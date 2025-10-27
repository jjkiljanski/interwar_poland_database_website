import * as duckdb from '@duckdb/duckdb-wasm';

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

export async function initializeDuckDB() {
  if (db) return { db, conn };

  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker}");`], {
      type: 'text/javascript',
    })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger();
  db = new duckdb.AsyncDuckDB(logger, worker);
  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  conn = await db.connect();

  // Enable HTTP file access for read_parquet over /data/... URLs
  try {
    await conn.query('INSTALL httpfs;');
  } catch {}
  try {
    await conn.query('LOAD httpfs;');
  } catch {}

  return { db, conn };
}

function toAbsoluteUrl(url: string) {
  if (/^https?:\/\//i.test(url)) return url;
  if (typeof window !== 'undefined') {
    // Resolve relative to the current document base (respects Vite base in dev and prod)
    try {
      const base = (document?.baseURI ?? window.location.href);
      const rel = url.startsWith('/') ? url.slice(1) : url;
      return new URL(rel, base).toString();
    } catch {
      // Fallback to origin + BASE_URL
      const basePath = (import.meta as any)?.env?.BASE_URL ?? '/';
      const rel = url.startsWith('/') ? url.slice(1) : url;
      return window.location.origin + basePath + rel;
    }
  }
  return url;
}

export async function loadParquetFile(c: duckdb.AsyncDuckDBConnection, tableName: string, url: string) {
  const abs = toAbsoluteUrl(url);
  await c.query(`CREATE TABLE IF NOT EXISTS ${tableName} AS SELECT * FROM read_parquet('${abs}')`);
}

export async function queryData(c: duckdb.AsyncDuckDBConnection, query: string) {
  const result = await c.query(query);
  return result.toArray();
}

// Convenience: load all known parquet sources from public/data into tables
export async function loadInitialParquet() {
  if (!conn) throw new Error('DuckDB not initialized');

  const sources: { table: string; path: string }[] = [
    { table: 'city_datasets', path: 'data/City_datasets.parquet' },
    { table: 'district_datasets', path: 'data/District_datasets.parquet' },
    { table: 'region_datasets', path: 'data/Region_datasets.parquet' },
    { table: 'columns_metadata', path: 'data/columns_metadata.parquet' },
    { table: 'data_tables_metadata', path: 'data/data_tables_metadata.parquet' },
  ];

  const results: { table: string; loaded: boolean; rowCount?: number; error?: unknown }[] = [];

  for (const src of sources) {
    try {
      await loadParquetFile(conn, src.table, src.path);
      const rows = await queryData(conn, `SELECT COUNT(*) as cnt FROM ${src.table}`);
      const rowCount = (rows?.[0]?.cnt as number) ?? 0;
      results.push({ table: src.table, loaded: true, rowCount });
    } catch (error) {
      // Non-fatal: continue loading others
      results.push({ table: src.table, loaded: false, error });
    }
  }

  return results;
}

export async function getDatasetHierarchy(c: duckdb.AsyncDuckDBConnection) {
  // Placeholder: adjust once metadata schema is finalized
  const result = await c.query(`SELECT * FROM data_tables_metadata`);
  return result.toArray();
}

// Fetch category path strings from columns_metadata using language-specific column
export async function getCategoryPaths(language: 'en' | 'pl') {
  if (!conn) throw new Error('DuckDB not initialized');
  const col = language === 'pl' ? 'category_pol' : 'category_eng';
  // DISTINCT paths, trimmed, ignoring empties
  const rows = await queryData(conn, `
    SELECT DISTINCT TRIM(${col}) AS path
    FROM columns_metadata
    WHERE ${col} IS NOT NULL AND TRIM(${col}) <> ''
    ORDER BY path
  `);
  return rows.map((r: any) => r.path as string);
}

// Map a selected leaf label to its English equivalent based on language
export async function getEnglishCategoryName(selectedLeafName: string, language: 'en' | 'pl') {
  if (language === 'en') return selectedLeafName;
  if (!conn) throw new Error('DuckDB not initialized');
  // Escape single quotes
  const pol = selectedLeafName.replace(/'/g, "''");
  const rows = await queryData(conn, `
    SELECT category_eng
    FROM columns_metadata
    WHERE category_pol = '${pol}'
    LIMIT 1
  `);
  return (rows?.[0]?.category_eng as string) ?? selectedLeafName;
}

// Given a datasetId like `ds:Level1 / Level2 / Leaf` in the current UI language,
// return the FULL English category path from columns_metadata (not just the leaf).
export async function getEnglishFullPathFromDatasetId(datasetId: string, language: 'en' | 'pl') {
  console.log("datasetId: ", datasetId);
  const currentPath = datasetId.replace(/^ds:/, '');
  console.log("currentPath: ", currentPath);
  if (language === 'en') return currentPath;
  if (!conn) throw new Error('DuckDB not initialized');
  const pol = currentPath.replace(/'/g, "''");
  console.log("pol: ", pol);
  const rows = await queryData(conn, `
    SELECT category_eng
    FROM columns_metadata
    WHERE TRIM(category_pol) = '${pol}'
    LIMIT 1
  `);
  const engPath = rows?.[0]?.category_eng as string | undefined;
  return engPath ?? currentPath;
}

// Discover the numeric value column in district_datasets
export async function getDistrictDatasetsValueColumn() {
  if (!conn) throw new Error('DuckDB not initialized');
  const cols = await queryData(conn, `
    SELECT column_name, data_type
    FROM information_schema.columns
    WHERE table_name = 'district_datasets'
    ORDER BY ordinal_position
  `);
  // Prefer a column literally named 'value'
  const valueCol = cols.find((c: any) => (c.column_name as string).toLowerCase() === 'value');
  if (valueCol) return valueCol.column_name as string;
  // Otherwise pick the first numeric-looking column excluding identifiers/labels
  const numeric = cols.find((c: any) => {
    const name = (c.column_name as string).toLowerCase();
    const dt = (c.data_type as string).toLowerCase();
    if (name === 'district' || name === 'variable_name') return false;
    return dt.includes('int') || dt.includes('double') || dt.includes('decimal') || dt.includes('real') || dt.includes('numeric');
  });
  if (!numeric) throw new Error('Could not determine value column in district_datasets');
  return numeric.column_name as string;
}

// Fetch district values for a given English variable name
export async function getDistrictDataForVariable(variableNameEng: string) {
  if (!conn) throw new Error('DuckDB not initialized');
  const valueCol = await getDistrictDatasetsValueColumn();
  const v = variableNameEng.replace(/'/g, "''");
  let rows = await queryData(conn, `
    SELECT TRIM(District) AS District, "${valueCol}" AS value
    FROM district_datasets
    WHERE TRIM(variable_name) = '${v}'
  `);
  if (!rows || rows.length === 0) {
    // Fallback: match by suffix when data stores full paths differently
    rows = await queryData(conn, `
      SELECT TRIM(District) AS District, "${valueCol}" AS value
      FROM district_datasets
      WHERE TRIM(variable_name) LIKE '%' || '${v}'
    `);
  }
  return rows as Array<{ District: string; value: number | null }>;
}

// Get distinct data_table_id values for a given full English category path
export async function getDataTableIdsForCategoryEng(engFullPath: string) {
  if (!conn) throw new Error('DuckDB not initialized');
  const p = engFullPath.replace(/'/g, "''");
  const rows = await queryData(conn, `
    SELECT DISTINCT TRIM(data_table_id) AS id
    FROM columns_metadata
    WHERE TRIM(category_eng) = '${p}'
      AND data_table_id IS NOT NULL AND TRIM(data_table_id) <> ''
    ORDER BY id
  `);
  return rows.map((r: any) => r.id as string);
}

export { db, conn };
