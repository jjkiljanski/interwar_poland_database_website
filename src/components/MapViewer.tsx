import { useState } from 'react';
import { ChoroplethMap } from './ChoroplethMap';
import { DatasetSelector } from './DatasetSelector';
import { MetadataPanel } from './MetadataPanel';
import { VariantInfoPanel } from './VariantInfoPanel';
import { DatasetTreeNode, GeoJSONData, DistrictData } from '../types';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { ArrowLeft, Menu, Info } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

type VariantOption = { id: string; label: string };

interface MapViewerProps {
  onBack: () => void;
  treeData: DatasetTreeNode[];
  geoJsonData: GeoJSONData;
  onLoadDataset: (datasetId: string) => Promise<{ data: DistrictData[], variants: VariantOption[], dataTableMeta: Record<string, any>, columnMeta: Record<string, any> }>;
  onLoadVariant: (datasetId: string, variantId: string) => Promise<{ data: DistrictData[], dataTableMeta: Record<string, any>, columnMeta: Record<string, any> }>;
  onDatasetLoaded: (hasData: boolean) => void;
}

export function MapViewer({ onBack, treeData, geoJsonData, onLoadDataset, onLoadVariant, onDatasetLoaded }: MapViewerProps) {
  const { t } = useLanguage();
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | undefined>();
  const [dataTableMeta, setDataTableMeta] = useState<Record<string, any> | undefined>();
  const [columnMeta, setColumnMeta] = useState<Record<string, any> | undefined>();
  const [currentData, setCurrentData] = useState<DistrictData[]>([]);
  const [datasetPath, setDatasetPath] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [datasetSelectorOpen, setDatasetSelectorOpen] = useState(false);
  const [metadataSheetOpen, setMetadataSheetOpen] = useState(false);
  const [variants, setVariants] = useState<VariantOption[]>([]);
  const [selectedVariant, setSelectedVariant] = useState<string>('');

  const handleVariantChange = async (variantId: string) => {
    setSelectedVariant(variantId);
    if (!selectedDatasetId) return;
    try {
      setIsLoading(true);
      const { data, dataTableMeta, columnMeta } = await onLoadVariant(selectedDatasetId, variantId);
      setCurrentData(data);
      setDataTableMeta(dataTableMeta);
      setColumnMeta(columnMeta);
      onDatasetLoaded(data.length > 0);
    } catch (e) {
      console.error('Error loading variant data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectDataset = async (datasetId: string, path: string[]) => {
    setIsLoading(true);
    setDatasetSelectorOpen(false);
    
    try {
      const { data, variants, dataTableMeta, columnMeta } = await onLoadDataset(datasetId);
      setSelectedDatasetId(datasetId);
      setCurrentData(data);
      setDataTableMeta(dataTableMeta);
      setColumnMeta(columnMeta);
      setDatasetPath(path);
      setVariants(variants);
      setSelectedVariant(variants[0]?.id ?? '');
      onDatasetLoaded(data.length > 0);
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
          
          {/* Dataset Variant Selector */}
          <div>
            <VariantSelect
              disabled={!selectedDatasetId || variants.length === 0}
              value={selectedVariant}
              onChange={handleVariantChange}
              options={variants}
              label={t('map.datasetVariant')}
            />
          </div>

          <Sheet open={metadataSheetOpen} onOpenChange={setMetadataSheetOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!dataTableMeta && !columnMeta}
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
              {(dataTableMeta || columnMeta) && (
                <VariantInfoPanel dataTableMeta={dataTableMeta} columnMeta={columnMeta} />
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
              datasetName={(columnMeta as any)?.column_name || selectedVariant}
            />
          ) : (
            <div className="h-full flex items-center justify-center bg-transparent">
              <div className="max-w-md w-full px-4">
                <div className="rounded-xl border border-border bg-white text-foreground shadow-xl">
                  <div className="p-6 text-center">
                    <div className="h-3" aria-hidden="true" />
                    <div className="mb-4">
                      <svg className="w-16 h-16 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                      </svg>
                    </div>
                    <h2 className="mb-2">{t('map.noDataset')}</h2>
                    <p className="text-gray-700 mb-6">
                      {t('map.noDatasetDescription')}
                    </p>
                    <Button onClick={() => setDatasetSelectorOpen(true)}>
                      {t('map.browseDatasets')}
                    </Button>
                    <div className="h-4" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Lightweight select using shadcn Select primitives styled like a small outline button
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface VariantSelectProps {
  disabled?: boolean;
  value?: string;
  onChange: (value: string) => void;
  options: VariantOption[];
  label: string;
}

function VariantSelect({ disabled, value, onChange, options, label }: VariantSelectProps) {
  return (
    <Select disabled={disabled} value={value} onValueChange={onChange}>
      <SelectTrigger className="h-9 w-48 text-sm">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


