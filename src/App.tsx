import { useState, useEffect } from 'react';
import { WelcomePage } from './components/WelcomePage';
import { AboutPage } from './components/AboutPage';
import { MapViewer } from './components/MapViewer';
import { LanguageSelector } from './components/LanguageSelector';
import { LanguageProvider } from './lib/i18n';
import { initializeDuckDB, loadParquetFile, queryData } from './lib/duckdb';
import { DatasetTreeNode, DatasetMetadata, GeoJSONData, DistrictData } from './types';
import { Toaster } from './components/ui/sonner';
import { toast } from 'sonner@2.0.3';

type Page = 'welcome' | 'about' | 'map';

// Mock data - replace with your actual data loading logic
const mockTreeData: DatasetTreeNode[] = [
  {
    id: '1',
    name: 'Demographics',
    level: 0,
    children: [
      {
        id: '1.1',
        name: 'Population',
        level: 1,
        children: [
          {
            id: '1.1.1',
            name: 'Total Population',
            level: 2,
            children: [
              {
                id: '1.1.1.1',
                name: 'Total Population 1921',
                level: 3,
                datasetId: 'pop_1921'
              },
              {
                id: '1.1.1.2',
                name: 'Total Population 1931',
                level: 3,
                datasetId: 'pop_1931'
              }
            ]
          },
          {
            id: '1.1.2',
            name: 'Urban Population',
            level: 2,
            children: [
              {
                id: '1.1.2.1',
                name: 'Urban Population 1921',
                level: 3,
                datasetId: 'urban_pop_1921'
              },
              {
                id: '1.1.2.2',
                name: 'Urban Population 1931',
                level: 3,
                datasetId: 'urban_pop_1931'
              }
            ]
          }
        ]
      },
      {
        id: '1.2',
        name: 'Ethnicity',
        level: 1,
        children: [
          {
            id: '1.2.1',
            name: 'Polish Population %',
            level: 2,
            datasetId: 'eth_polish'
          },
          {
            id: '1.2.2',
            name: 'Jewish Population %',
            level: 2,
            datasetId: 'eth_jewish'
          },
          {
            id: '1.2.3',
            name: 'Ukrainian Population %',
            level: 2,
            datasetId: 'eth_ukrainian'
          }
        ]
      }
    ]
  },
  {
    id: '2',
    name: 'Economy',
    level: 0,
    children: [
      {
        id: '2.1',
        name: 'Agriculture',
        level: 1,
        children: [
          {
            id: '2.1.1',
            name: 'Land Use',
            level: 2,
            children: [
              {
                id: '2.1.1.1',
                name: 'Arable Land (hectares)',
                level: 3,
                datasetId: 'agr_arable'
              },
              {
                id: '2.1.1.2',
                name: 'Forest Land (hectares)',
                level: 3,
                datasetId: 'agr_forest'
              }
            ]
          },
          {
            id: '2.1.2',
            name: 'Livestock',
            level: 2,
            children: [
              {
                id: '2.1.2.1',
                name: 'Cattle Count',
                level: 3,
                datasetId: 'livestock_cattle'
              },
              {
                id: '2.1.2.2',
                name: 'Horse Count',
                level: 3,
                datasetId: 'livestock_horses'
              }
            ]
          }
        ]
      },
      {
        id: '2.2',
        name: 'Industry',
        level: 1,
        children: [
          {
            id: '2.2.1',
            name: 'Number of Factories',
            level: 2,
            datasetId: 'ind_factories'
          },
          {
            id: '2.2.2',
            name: 'Industrial Workers',
            level: 2,
            datasetId: 'ind_workers'
          }
        ]
      }
    ]
  },
  {
    id: '3',
    name: 'Infrastructure',
    level: 0,
    children: [
      {
        id: '3.1',
        name: 'Transportation',
        level: 1,
        children: [
          {
            id: '3.1.1',
            name: 'Railway Length (km)',
            level: 2,
            datasetId: 'rail_length'
          },
          {
            id: '3.1.2',
            name: 'Road Length (km)',
            level: 2,
            datasetId: 'road_length'
          }
        ]
      },
      {
        id: '3.2',
        name: 'Education',
        level: 1,
        children: [
          {
            id: '3.2.1',
            name: 'Primary Schools',
            level: 2,
            datasetId: 'edu_primary_schools'
          },
          {
            id: '3.2.2',
            name: 'Secondary Schools',
            level: 2,
            datasetId: 'edu_secondary_schools'
          },
          {
            id: '3.2.3',
            name: 'Literacy Rate %',
            level: 2,
            datasetId: 'edu_literacy'
          }
        ]
      }
    ]
  }
];

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

  useEffect(() => {
    // Initialize DuckDB on app load
    const init = async () => {
      try {
        toast.info('Initializing database...');
        await initializeDuckDB();
        setDbInitialized(true);
        toast.success('Database initialized successfully');
        
        // Load your parquet files here
        // Example: await loadParquetFile(conn, 'metadata', '/data/metadata.parquet');
        // Example: await loadParquetFile(conn, 'datasets', '/data/datasets.parquet');
      } catch (error) {
        console.error('Failed to initialize DuckDB:', error);
        toast.error('Failed to initialize database');
      }
    };

    init();
  }, []);

  useEffect(() => {
    // Fetch hero image
    fetch('https://images.unsplash.com/photo-1590502593747-42a996133562?w=1920&q=80')
      .then(() => setHeroImageUrl('https://images.unsplash.com/photo-1590502593747-42a996133562?w=1920&q=80'))
      .catch(() => setHeroImageUrl('https://images.unsplash.com/photo-1590502593747-42a996133562?w=1920&q=80'));
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

  return (
    <LanguageProvider>
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
          treeData={mockTreeData}
          geoJsonData={mockGeoJsonData}
          onLoadDataset={handleLoadDataset}
        />
      )}

      <LanguageSelector />
      <Toaster />
    </LanguageProvider>
  );
}
