import { DatasetMetadata } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ExternalLink, Calendar, FileText, Tag } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '../lib/i18n';

interface MetadataPanelProps {
  metadata: DatasetMetadata;
}

export function MetadataPanel({ metadata }: MetadataPanelProps) {
  const { t } = useLanguage();
  
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t('metadata.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)]">
          <div className="space-y-4">
            <div>
              <h3 className="mb-2">{metadata.name}</h3>
            </div>

            {metadata.category && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{t('metadata.category')}</span>
                </div>
                <Badge variant="secondary">{metadata.category}</Badge>
              </div>
            )}

            {metadata.date && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-500">{t('metadata.date')}</span>
                </div>
                <p>{metadata.date}</p>
              </div>
            )}

            {metadata.description && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('metadata.description')}</p>
                <p className="text-sm leading-relaxed">{metadata.description}</p>
              </div>
            )}

            {metadata.source && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('metadata.source')}</p>
                <p className="text-sm">{metadata.source}</p>
              </div>
            )}

            {metadata.sourceLink && (
              <div>
                <a
                  href={metadata.sourceLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  {t('metadata.viewSource')}
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {metadata.unit && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('metadata.unit')}</p>
                <p className="text-sm">{metadata.unit}</p>
              </div>
            )}

            {metadata.methodology && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('metadata.methodology')}</p>
                <p className="text-sm leading-relaxed">{metadata.methodology}</p>
              </div>
            )}

            {metadata.notes && (
              <div>
                <p className="text-sm text-gray-500 mb-2">{t('metadata.notes')}</p>
                <p className="text-sm leading-relaxed italic text-gray-600">{metadata.notes}</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
