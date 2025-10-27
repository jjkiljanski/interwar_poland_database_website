import { useState, useEffect } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { AboutPage } from './components/AboutPage';
import { MapViewer } from './components/MapViewer';
import { LanguageSelector } from './components/LanguageSelector';
import { useLanguage } from './lib/i18n';
import { initializeDuckDB, loadInitialParquet, getCategoryPaths, getEnglishFullPathFromDatasetId, getDistrictDataForVariable, getDataTableIdsForCategoryEng } from './lib/duckdb';
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
  const loadDatasetReal = async (datasetId: string): Promise<{ data: DistrictData[], metadata: DatasetMetadata, variants: string[] }> => {
    // Get full English category path for filtering variable_name
    const engFullPath = await getEnglishFullPathFromDatasetId(datasetId, language);
    // Log the path that will be used in district_datasets.variable_name
    console.log('[Dataset Selection] Querying district_datasets.variable_name with path:', engFullPath);

    const rows = await getDistrictDataForVariable(engFullPath);
    const data: DistrictData[] = rows.map((r: any) => ({
      districtId: r.District,
      districtName: r.District,
      value: typeof r.value === 'number' ? r.value : 0,
    }));

    // Fetch dataset variants (data_table_id list) for this category
    const variants = await getDataTableIdsForCategoryEng(engFullPath);

    const metadata: DatasetMetadata = {
      id: datasetId,
      name: engFullPath,
      source: 'district_datasets',
      sourceLink: '#',
      date: '',
      description: `Values for ${engFullPath} from district_datasets`,
    };

    return { data, metadata, variants };
  };

  return (
    <>
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
        />
      )}

      <LanguageSelector />
      <Toaster />
    </>
  );
}
