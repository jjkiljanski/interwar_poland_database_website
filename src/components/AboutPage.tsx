import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../lib/i18n';

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Button onClick={onBack} variant="ghost" className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('about.back')}
        </Button>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>{t('about.title')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This project provides a comprehensive digital platform for exploring and visualizing 
              district-level statistical data from Poland during the interwar period (1918-1939). 
              Following the restoration of Polish independence after World War I, the Second Polish 
              Republic faced the enormous challenge of rebuilding and modernizing its infrastructure, 
              economy, and administrative systems.
            </p>
            <p>
              The data presented here offers unique insights into the geographic, demographic, and 
              economic landscape of interwar Poland, drawing from historical statistical yearbooks, 
              census data, and administrative records from the period.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Data Sources & Methodology</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The datasets are compiled from various historical sources, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Polish Statistical Yearbooks (Rocznik Statystyczny)</li>
              <li>Census data from 1921 and 1931</li>
              <li>Administrative records from the Ministry of Internal Affairs</li>
              <li>Regional economic surveys and reports</li>
              <li>Infrastructure development documentation</li>
            </ul>
            <p>
              All data has been digitized and georeferenced to historical district boundaries. 
              Each dataset includes comprehensive metadata documenting sources, collection dates, 
              and methodological notes to ensure transparency and academic rigor.
            </p>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Technical Implementation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              This platform leverages modern web technologies to provide an efficient and 
              responsive data exploration experience:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>DuckDB-WASM:</strong> Client-side analytical database for fast querying 
                of Parquet files without server infrastructure
              </li>
              <li>
                <strong>GeoJSON:</strong> Historical district boundaries for accurate spatial visualization
              </li>
              <li>
                <strong>Interactive Choropleth Maps:</strong> Dynamic visualization of statistical 
                data across districts
              </li>
              <li>
                <strong>Hierarchical Data Organization:</strong> Multi-level categorization for 
                easy dataset discovery
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Historical Context</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              The interwar period was a time of significant transformation for Poland. After 123 years 
              of partition, the newly independent nation faced the task of unifying territories that 
              had been under different administrative systems (Russian, Prussian, and Austro-Hungarian).
            </p>
            <p>
              This data reflects both the challenges and achievements of this era: the development of 
              the port of Gdynia, industrialization efforts, educational expansion, infrastructure 
              improvements, and the gradual modernization of Polish society and economy.
            </p>
            <p>
              Understanding this historical data provides valuable insights into the foundations of 
              modern Poland and the complex regional variations that characterized the Second Republic.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
