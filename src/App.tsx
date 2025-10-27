import { useState, useEffect } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { AboutPage } from './components/AboutPage';
import { MapViewer } from './components/MapViewer';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './lib/i18n';
import { initializeDuckDB, loadInitialParquet, getCategoryPaths, getEnglishFullPathFromDatasetId, getVariantColumnsForCategoryEng, getDistrictDataForColumnAndTable, getDataTableMetadata, getColumnMetadata, getDataTableDatesForIds } from './lib/duckdb';
import { DatasetTreeNode, DatasetMetadata, GeoJSONData, DistrictData } from './types';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

type Page = 'welcome' | 'about' | 'map';

// Build tree from slash-separated category paths
function buildTreeFromPaths(paths: string[]): DatasetTreeNode[] {
  const root: DatasetTreeNode[] = [];
  // Map of pathKey => node for quick lookup
  const nodeMap = new Map<string, DatasetTreeNode>();

  const makeId = (parts: string[], level: number) => `${level}:${parts.join('/')}`;
  const makeDatasetId = (parts: string[]) => `ds:${parts.join('/')}`; // stable, human-readable

  for (const raw of paths) {
    const parts = raw.split('/').map(s => s.trim()).filter(Boolean);
    const chain: string[] = [];
    let parentChildren = root;

    parts.forEach((name, idx) => {
      chain.push(name);
      const pathKey = chain.join('/');
      const level = idx; // 0-based
      let node = nodeMap.get(pathKey);

      if (!node) {
        node = {
          id: makeId(chain, level),
          name,
          level,
          children: [],
        };

        parentChildren.push(node);
        nodeMap.set(pathKey, node);
      }

      if (idx === parts.length - 1) {
        // Leaf node represents a dataset
        node.datasetId = makeDatasetId(parts);
      }

      // Prepare children for next level
      if (!node.children) node.children = [];
      parentChildren = node.children;
    });
  }

  return root;
}

// Mock GeoJSON data - replace with your actual GeoJSON
const mockGeoJsonData: GeoJSONData = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      properties: { id: 'warsaw', name: 'Warsaw' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [20.8, 52.1],
          [21.2, 52.1],
          [21.2, 52.4],
          [20.8, 52.4],
          [20.8, 52.1]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'krakow', name: 'Kraków' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [19.7, 49.9],
          [20.1, 49.9],
          [20.1, 50.2],
          [19.7, 50.2],
          [19.7, 49.9]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'poznan', name: 'Poznań' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [16.7, 52.2],
          [17.1, 52.2],
          [17.1, 52.5],
          [16.7, 52.5],
          [16.7, 52.2]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'lwow', name: 'Lwów' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [23.8, 49.7],
          [24.2, 49.7],
          [24.2, 50.0],
          [23.8, 50.0],
          [23.8, 49.7]
        ]]
      }
    },
    {
      type: 'Feature',
      properties: { id: 'wilno', name: 'Wilno' },
      geometry: {
        type: 'Polygon',
        coordinates: [[
          [25.0, 54.5],
          [25.4, 54.5],
          [25.4, 54.8],
          [25.0, 54.8],
          [25.0, 54.5]
        ]]
      }
    }
  ]
};

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('welcome');
  const [dbInitialized, setDbInitialized] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState('');
  const [treeData, setTreeData] = useState<DatasetTreeNode[]>([]);
  const [geoJsonData, setGeoJsonData] = useState<GeoJSONData>({ type: 'FeatureCollection', features: [] });
  const { language } = useLanguage();
  const [hasDatasetData, setHasDatasetData] = useState(false);

  useEffect(() => {
    // Initialize DuckDB on app load
    const init = async () => {
      try {
        toast.info('Initializing database...');
        await initializeDuckDB();
        toast.success('Database initialized successfully');

        // Load Parquet files from public/data into DuckDB tables
        toast.info('Loading Parquet files from /data ...');
        const results = await loadInitialParquet();
        for (const r of results) {
          if (r.loaded) {
            toast.success(`Loaded ${r.table} (${r.rowCount} rows)`);
          } else {
            // Non-fatal: some files may be absent
            toast.message(`Skipped ${r.table}`);
          }
        }

        // Mark DB ready only after tables are loaded
        setDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize DuckDB:', error);
        toast.error('Failed to initialize database');
      }
    };

    init();
  }, []);

  // Build dataset tree based on language and metadata
  useEffect(() => {
    const loadTree = async () => {
      if (!dbInitialized) return;
      try {
        const paths = await getCategoryPaths(language);
        const tree = buildTreeFromPaths(paths);
        setTreeData(tree);
      } catch (err) {
        console.error('Failed to build dataset tree:', err);
        setTreeData([]);
      }
    };
    loadTree();
  }, [dbInitialized, language]);

  useEffect(() => {
    // Use local hero image; BASE_URL works in dev and on GitHub Pages
    setHeroImageUrl(`${import.meta.env.BASE_URL}images/hero.jpg`);
  }, []);

  useEffect(() => {
    // Load GeoJSON from public path using BASE_URL
    fetch(`${import.meta.env.BASE_URL}data/geo/districts.geojson`)
      .then(r => r.json())
      .then((gj) => setGeoJsonData(gj as GeoJSONData))
      .catch((err) => {
        console.error('Failed to load GeoJSON', err);
      });
  }, []);

  const handleLoadDataset = async (datasetId: string): Promise<{ data: DistrictData[], metadata: DatasetMetadata }> => {
    // This is where you would query DuckDB for the actual data
    // Example:
    // const data = await queryData(conn, `SELECT * FROM datasets WHERE id = '${datasetId}'`);
    
    // For now, returning mock data
    const mockData: DistrictData[] = [
      { districtId: 'warsaw', districtName: 'Warsaw', value: Math.random() * 1000000 },
      { districtId: 'krakow', districtName: 'Kraków', value: Math.random() * 500000 },
      { districtId: 'poznan', districtName: 'Poznań', value: Math.random() * 400000 },
      { districtId: 'lwow', districtName: 'Lwów', value: Math.random() * 600000 },
      { districtId: 'wilno', districtName: 'Wilno', value: Math.random() * 300000 }
    ];

    const mockMetadata: DatasetMetadata = {
      id: datasetId,
      name: `Dataset: ${datasetId}`,
      source: 'Rocznik Statystyczny (Polish Statistical Yearbook)',
      sourceLink: 'https://example.com/source',
      date: '1931',
      description: 'This dataset contains district-level statistics from the interwar period. The data was collected and published by the Main Statistical Office of Poland (Główny Urząd Statystyczny).',
      unit: 'persons',
      category: 'Demographics',
      methodology: 'Data collected through national census conducted by administrative districts.',
      notes: 'Some districts may have incomplete data due to administrative reorganization during the period.'
    };

    return { data: mockData, metadata: mockMetadata };
  };
  
  // Real loader using DuckDB and language-aware mapping
  type VariantOption = { id: string; label: string };

  const loadDatasetReal = async (datasetId: string): Promise<{ data: DistrictData[], variants: VariantOption[], dataTableMeta: Record<string, any>, columnMeta: Record<string, any> }> => {
    // Get full English category path for filtering variable_name
    const engFullPath = await getEnglishFullPathFromDatasetId(datasetId, language);
    // Log the path that will be used in district_datasets.variable_name
    console.log('[Dataset Selection] Querying district_datasets.variable_name with path:', engFullPath);

    // Get mapping of data_table_id -> column_name for this category
    const variantMap = await getVariantColumnsForCategoryEng(engFullPath);
    const variantIds = Array.from(variantMap.keys()).sort((a,b)=>a.localeCompare(b));
    // Fetch dates for variants and format labels
    const dateRows = await getDataTableDatesForIds(variantIds);
    const dateMap = new Map<string, any>(dateRows.map(r => [String(r.id), r.date]));
    const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
    const fmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    const toDate = (v: any): Date | undefined => {
      if (v == null) return undefined;
      if (v instanceof Date) return v;
      if (typeof v === 'number') {
        // Assume milliseconds since epoch (handles negatives too)
        const d = new Date(v);
        return isNaN(d.getTime()) ? undefined : d;
      }
      const s = String(v).trim();
      if (!s) return undefined;
      // Numeric string (ms since epoch)
      if (/^-?\d+$/.test(s)) {
        const d = new Date(Number(s));
        return isNaN(d.getTime()) ? undefined : d;
      }
      // DD.MM.YYYY
      const m = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
      if (m) {
        const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
        return isNaN(d.getTime()) ? undefined : d;
      }
      // ISO-like
      const d = new Date(s);
      return isNaN(d.getTime()) ? undefined : d;
    };
    const variantObjs = variantIds.map((id) => {
      const raw = dateMap.get(id);
      const d = toDate(raw);
      const label = d ? fmt.format(d) : (raw != null ? String(raw) : id);
      return { id, label, date: d as Date | undefined };
    });
    variantObjs.sort((a, b) => {
      const at = a.date ? a.date.getTime() : Number.POSITIVE_INFINITY;
      const bt = b.date ? b.date.getTime() : Number.POSITIVE_INFINITY;
      if (at !== bt) return at - bt;
      // tie-breaker: label then id
      const lab = a.label.localeCompare(b.label);
      if (lab !== 0) return lab;
      return a.id.localeCompare(b.id);
    });
    const variants: VariantOption[] = variantObjs.map(({ id, label }) => ({ id, label }));

    // Choose first variant by default
    const firstVariant = variantIds[0];
    let dataTableMeta: Record<string, any> = {};
    let columnMeta: Record<string, any> = {};
    let data: DistrictData[] = [];
    if (firstVariant) {
      const columnName = variantMap.get(firstVariant)!;
      // Load district values using column_name + data_table_id
    const rows = await getDistrictDataForColumnAndTable(columnName, firstVariant);
      data = rows.map((r: any) => {
        const name = String(r.District ?? '').trim();
        const id = name.toUpperCase();
        return {
          districtId: id,
          districtName: name,
          value: typeof r.value === 'number' ? r.value : 0,
        };
      });
      // Load metadata
      dataTableMeta = await getDataTableMetadata(firstVariant);
      columnMeta = await getColumnMetadata(columnName, firstVariant);
    }

    return { data, variants, dataTableMeta, columnMeta };
  };

  return (
    <>
      {/* Global hero background for About and Map-before-selection */}
      {((currentPage === 'about') || (currentPage === 'map' && !hasDatasetData)) && (
        <div className="fixed inset-0 pointer-events-none z-0">
          <img src={heroImageUrl} alt="Hero background" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/30" />
        </div>
      )}

      <div className="relative z-10">
        {currentPage === 'welcome' && (
          <WelcomePage
            onExploreData={() => setCurrentPage('map')}
            onAbout={() => setCurrentPage('about')}
            heroImageUrl={heroImageUrl}
          />
        )}

        {currentPage === 'about' && (
          <AboutPage onBack={() => setCurrentPage('welcome')} />
        )}

        {currentPage === 'map' && (
          <MapViewer
            onBack={() => setCurrentPage('welcome')}
            treeData={treeData}
            geoJsonData={geoJsonData}
            onLoadDataset={loadDatasetReal}
            onLoadVariant={async (datasetId: string, variantId: string) => {
              const engFullPath = await getEnglishFullPathFromDatasetId(datasetId, language);
              const variantMap = await getVariantColumnsForCategoryEng(engFullPath);
              const columnName = variantMap.get(variantId);
              if (!columnName) return { data: [], dataTableMeta: {}, columnMeta: {} };
              const rows = await getDistrictDataForColumnAndTable(columnName, variantId);
              const data: DistrictData[] = rows.map((r: any) => {
                const name = String(r.District ?? '').trim();
                const id = name.toUpperCase();
                return {
                  districtId: id,
                  districtName: name,
                  value: typeof r.value === 'number' ? r.value : 0,
                };
              });
              const dataTableMeta = await getDataTableMetadata(variantId);
              const columnMeta = await getColumnMetadata(columnName, variantId);
              setHasDatasetData(data.length > 0);
              return { data, dataTableMeta, columnMeta };
            }}
            onDatasetLoaded={(hasData: boolean) => setHasDatasetData(hasData)}
          />
        )}

        <LanguageSelector />
        <Toaster />
      </div>

      <LanguageSelector />
      <Toaster />
    </>
  );
}
