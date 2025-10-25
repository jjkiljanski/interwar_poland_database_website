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
  
  return { db, conn };
}

export async function loadParquetFile(conn: duckdb.AsyncDuckDBConnection, tableName: string, url: string) {
  await conn.query(`CREATE TABLE IF NOT EXISTS ${tableName} AS SELECT * FROM read_parquet('${url}')`);
}

export async function queryData(conn: duckdb.AsyncDuckDBConnection, query: string) {
  const result = await conn.query(query);
  return result.toArray();
}

export async function getDatasetHierarchy(conn: duckdb.AsyncDuckDBConnection) {
  // This would query your metadata table to build the hierarchy
  // For now, returning a mock structure
  const result = await conn.query(`SELECT * FROM metadata`);
  return result.toArray();
}

export { db, conn };
