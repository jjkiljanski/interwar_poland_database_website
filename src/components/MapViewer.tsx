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
import { LanguageSelector } from './LanguageSelector';

type VariantOption = { id: string; label: string };

interface MapViewerProps {
  onBack: () => void;
  treeData: DatasetTreeNode[];
  geoJsonData: GeoJSONData;
  boundaryGeoJson?: GeoJSONData;
  onLoadDataset: (datasetId: string) => Promise<{ data: DistrictData[], variants: VariantOption[], dataTableMeta: Record<string, any>, columnMeta: Record<string, any> }>;
  onLoadVariant: (datasetId: string, variantId: string) => Promise<{ data: DistrictData[], dataTableMeta: Record<string, any>, columnMeta: Record<string, any> }>;
  onDatasetLoaded: (hasData: boolean) => void;
  selectedAdmLevel: 'District' | 'Region' | 'City';
  onAdmLevelChange: (level: 'District' | 'Region' | 'City') => void;
}

export function MapViewer({ onBack, treeData, geoJsonData, boundaryGeoJson, onLoadDataset, onLoadVariant, onDatasetLoaded, selectedAdmLevel, onAdmLevelChange }: MapViewerProps) {
  const { t, language } = useLanguage();
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

  // ----- CSV Download helpers bound to current selection -----
  const downloadCurrentVariantCSV = () => {
    if (!selectedDatasetId || !selectedVariant || currentData.length === 0) return;
    const districtHeader = selectedAdmLevel === 'District'
      ? (language === 'pl' ? 'Powiat' : 'District')
      : (selectedAdmLevel === 'Region'
          ? (language === 'pl' ? 'Województwo' : 'Region')
          : (language === 'pl' ? 'Miasto' : 'City'));
    const valueHeader = (columnMeta as any)?.column_name || (variants.find(v => v.id === selectedVariant)?.label ?? selectedVariant);
    const header = [districtHeader, valueHeader];
    const lines = [header.map(csvEscape).join(',')];
    for (const row of currentData) {
      const vals = [row.districtName, row.value];
      lines.push(vals.map(csvEscape).join(','));
    }
    const datasetLabel = datasetPath.length ? formatSafeFilename(datasetPath) : 'dataset';
    const variantLabel = formatSafeFilename([variants.find(v => v.id === selectedVariant)?.label ?? selectedVariant]);
    const filename = `${datasetLabel}__${variantLabel}.csv`;
    triggerDownload(filename, lines.join('\n'));
  };

  const downloadAllVariantsCSV = async () => {
    if (!selectedDatasetId || variants.length === 0) return;
    try {
      const districtHeader = selectedAdmLevel === 'District'
        ? (language === 'pl' ? 'Powiat' : 'District')
        : (selectedAdmLevel === 'Region'
            ? (language === 'pl' ? 'Województwo' : 'Region')
            : (language === 'pl' ? 'Miasto' : 'City'));
      // Determine column for each variant
      const engFullPath = await getEnglishFullPathFromDatasetId(selectedDatasetId, language as 'en' | 'pl');
      const variantMap = await getVariantColumnsForCategoryEng(engFullPath);
      const orderedVariantIds = variants.map(v => v.id);

      // Collect data for each variant
      const districtSet = new Set<string>();
      const byVariant: Record<string, Map<string, number | null>> = {};
      for (const vid of orderedVariantIds) {
        const col = variantMap.get(vid);
        if (!col) continue;
        const rows = selectedAdmLevel === 'District'
          ? await getDistrictDataForColumnAndTable(col, vid)
          : await getRegionDataForColumnAndTable(col, vid);
        const m = new Map<string, number | null>();
        for (const r of rows as any[]) {
          const name = String((r.District ?? r.Region ?? r.City) ?? '').trim();
          districtSet.add(name);
          m.set(name, typeof r.value === 'number' ? r.value : (r.value == null ? null : Number(r.value)));
        }
        byVariant[vid] = m;
      }

      // Build CSV
      const header = [districtHeader, ...orderedVariantIds.map(id => variants.find(v => v.id === id)?.label ?? id)];
      const lines = [header.map(csvEscape).join(',')];
      const districts = Array.from(districtSet.values()).sort((a, b) => a.localeCompare(b));
      for (const dname of districts) {
        const row: (string | number | null)[] = [dname];
        for (const vid of orderedVariantIds) {
          const mv = byVariant[vid];
          row.push(mv ? (mv.get(dname) ?? null) : null);
        }
        lines.push(row.map(csvEscape).join(','));
      }

      const datasetLabel = datasetPath.length ? formatSafeFilename(datasetPath) : 'dataset';
      const filename = `${datasetLabel}__all_variants.csv`;
      triggerDownload(filename, lines.join('\n'));
    } catch (e) {
      console.error('Failed to download all variants CSV:', e);
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
        {/* Top-right controls inside header */}
        <div className="flex items-center gap-2">
          {/* Administrative level selector */}
          <AdminLevelSelect
            value={selectedAdmLevel}
            onChange={(val) => { onAdmLevelChange(val); }}
          />

          <Sheet open={datasetSelectorOpen} onOpenChange={setDatasetSelectorOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Menu className="h-4 w-4 mr-2" />
                {t('map.selectDataset')}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full sm:w-96 p-0 overflow-hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>{t('selector.title')}</SheetTitle>
                <SheetDescription>{t('selector.description')}</SheetDescription>
              </SheetHeader>
              <div className="h-full min-h-0">
                <DatasetSelector
                  treeData={treeData}
                  onSelectDataset={handleSelectDataset}
                  selectedDatasetId={selectedDatasetId}
                />
              </div>
            </SheetContent>
          </Sheet>

          <VariantSelect
            disabled={!selectedDatasetId || variants.length === 0}
            value={selectedVariant}
            onChange={handleVariantChange}
            options={variants}
            label={t('map.datasetVariant')}
          />

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
            <SheetContent side="right" className="w-full sm:w-96 p-0 overflow-hidden">
              <SheetHeader className="sr-only">
                <SheetTitle>{t('metadata.title')}</SheetTitle>
                <SheetDescription>View metadata for the selected dataset</SheetDescription>
              </SheetHeader>
              {(dataTableMeta || columnMeta) && (
                <div className="min-h-full h-full flex flex-col min-w-0">
                  <div className="flex-1 overflow-auto p-0 min-h-0">
                    <VariantInfoPanel dataTableMeta={dataTableMeta} columnMeta={columnMeta} />
                  </div>
                  <div className="sticky bottom-0 left-0 right-0 p-3 border-t bg-white flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={!selectedDatasetId || !selectedVariant || currentData.length === 0}
                      onClick={() => downloadCurrentVariantCSV()}
                    >
                      Download dataset (CSV)
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      disabled={!selectedDatasetId || variants.length === 0}
                      onClick={() => downloadAllVariantsCSV()}
                    >
                      Download all variants (CSV)
                    </Button>
                  </div>
                </div>
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
            <>
              <ChoroplethMap
                geoJsonData={geoJsonData}
                boundaryGeoJson={boundaryGeoJson}
                districtData={currentData}
                datasetName={(columnMeta as any)?.column_name || selectedVariant}
                idProperty={selectedAdmLevel === 'District' ? 'District' : (selectedAdmLevel === 'Region' ? 'Region' : 'City')}
              />
              {/* Language selector pinned to top-right when map is displayed */}
              <LanguageSelector positionClass="absolute top-4 right-4 z-20" />
            </>
          ) : (
            <div className="h-full flex items-center justify-center bg-transparent relative">
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
              {/* Language selector pinned to top-right of this empty-state container */}
              <LanguageSelector positionClass="absolute top-4 right-4 z-20" />
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

// Admin level select component
function AdminLevelSelect({ value, onChange }: { value: 'District' | 'Region' | 'City'; onChange: (v: 'District' | 'Region' | 'City') => void }) {
  const { language } = useLanguage();
  const labelDistrict = language === 'pl' ? 'Powiaty' : 'Districts';
  const labelRegion = language === 'pl' ? 'Województwa' : 'Voivodships';
  const labelCity = language === 'pl' ? 'Miasta' : 'Cities';
  return (
    <Select value={value} onValueChange={(v) => onChange(v as 'District' | 'Region' | 'City')}>
      <SelectTrigger className="h-9 w-44 text-sm">
        <SelectValue placeholder={labelDistrict} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="District">{labelDistrict}</SelectItem>
        <SelectItem value="Region">{labelRegion}</SelectItem>
        <SelectItem value="City">{labelCity}</SelectItem>
      </SelectContent>
    </Select>
  );
}

// CSV helpers and download actions
import { getEnglishFullPathFromDatasetId, getVariantColumnsForCategoryEng, getDistrictDataForColumnAndTable, getRegionDataForColumnAndTable } from '../lib/duckdb';

function csvEscape(value: string | number | null | undefined): string {
  const s = value == null ? '' : String(value);
  if (/[",\n]/.test(s)) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}

function triggerDownload(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Note: these are methods on the component scope, so they can use state
function formatSafeFilename(parts: string[]) {
  const raw = parts.join(' - ');
  return raw.replace(/[^A-Za-z0-9_\- ]+/g, '_').replace(/\s+/g, '_').slice(0, 120);
}

// Attach methods to component via declaration merging hack is not ideal; instead,
// define them inside the component so they have access to state.


