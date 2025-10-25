import { useState } from 'react';
import { ChoroplethMap } from './ChoroplethMap';
import { DatasetSelector } from './DatasetSelector';
import { MetadataPanel } from './MetadataPanel';
import { DatasetTreeNode, DatasetMetadata, GeoJSONData, DistrictData } from '../types';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ArrowLeft, Menu, Info } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface MapViewerProps {
  onBack: () => void;
  treeData: DatasetTreeNode[];
  geoJsonData: GeoJSONData;
  onLoadDataset: (datasetId: string) => Promise<{ data: DistrictData[], metadata: DatasetMetadata }>;
}

export function MapViewer({ onBack, treeData, geoJsonData, onLoadDataset }: MapViewerProps) {
  const { t } = useLanguage();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>();
  const [currentMetadata, setCurrentMetadata] = useState<DatasetMetadata | undefined>();
  const [currentData, setCurrentData] = useState<DistrictData[]>([]);
  const [datasetPath, setDatasetPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetSelectorOpen, setDatasetSelectorOpen] = useState(false);
  const [metadataSheetOpen, setMetadataSheetOpen] = useState(false);

  const handleSelectDataset = async (datasetId: string, path: string[]) => {
    setIsLoading(true);
    setDatasetSelectorOpen(false);
    
    try {
      const { data, metadata } = await onLoadDataset(datasetId);
      setSelectedDatasetId(datasetId);
      setCurrentData(data);
      setCurrentMetadata(metadata);
      setDatasetPath(path);
    } catch (error) {
      console.error('Error loading dataset:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('map.home')}
          </Button>
          <div className="border-l h-6" />
          <h1 className="text-xl">{t('map.title')}</h1>
        </div>
        
        <div className="flex items-center gap-2">
          <Sheet open={datasetSelectorOpen} onOpenChange={setDatasetSelectorOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                {t('map.selectDataset')}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 p-0">
              <SheetHeader className="sr-only">
                <SheetTitle>{t('selector.title')}</SheetTitle>
                <SheetDescription>{t('selector.description')}</SheetDescription>
              </SheetHeader>
              <DatasetSelector
                treeData={treeData}
                onSelectDataset={handleSelectDataset}
                selectedDatasetId={selectedDatasetId}
              />
            </SheetContent>
          </Sheet>
          
          <Sheet open={metadataSheetOpen} onOpenChange={setMetadataSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!currentMetadata}
              >
                <Info className="h-4 w-4 mr-2" />
                {t('map.datasetInfo')}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-full sm:w-96 p-0 overflow-auto">
              <SheetHeader className="sr-only">
                <SheetTitle>{t('metadata.title')}</SheetTitle>
                <SheetDescription>View metadata for the selected dataset</SheetDescription>
              </SheetHeader>
              {currentMetadata && (
                <MetadataPanel metadata={currentMetadata} />
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {/* Map Area - Full Width */}
        <div className="absolute inset-0">
          {isLoading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>{t('map.loading')}</p>
              </div>
            </div>
          )}
          
          {currentData.length > 0 ? (
            <ChoroplethMap
              geoJsonData={geoJsonData}
              districtData={currentData}
              datasetName={currentMetadata?.name}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-gray-50">
              <div className="text-center max-w-md px-4">
                <div className="mb-4">
                  <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </div>
                <h2 className="mb-2">{t('map.noDataset')}</h2>
                <p className="text-gray-600 mb-6">
                  {t('map.noDatasetDescription')}
                </p>
                <Button onClick={() => setDatasetSelectorOpen(true)}>
                  {t('map.browseDatasets')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
