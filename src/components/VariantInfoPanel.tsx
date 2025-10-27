import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { useLanguage } from '../lib/i18n';

interface VariantInfoPanelProps {
  dataTableMeta?: Record<string, any>;
  columnMeta?: Record<string, any>;
}

function KeyValueList({ obj }: { obj?: Record<string, any> }) {
  if (!obj) return null;
  const entries = Object.entries(obj);
  return (
    <div className="space-y-2">
      {entries.map(([k, v]) => (
        <div key={k} className="text-sm">
          <span className="font-medium mr-2">{k}:</span>
          <span className="break-words text-gray-700">{String(v)}</span>
        </div>
      ))}
    </div>
  );
}

export function VariantInfoPanel({ dataTableMeta, columnMeta }: VariantInfoPanelProps) {
  const { t, language } = useLanguage();

  const toArray = (v: any): string[] => {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map((x) => String(x));
    const s = String(v).trim();
    if (!s) return [];
    // Try JSON-style list first (accepts single quotes too)
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s;
      try {
        const jsonish = inner.replace(/'/g, '"');
        const parsed = JSON.parse(jsonish);
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim());
        }
      } catch {}
      // Fallback: split on commas at top level
      const stripped = inner.slice(1, -1);
      return stripped
        .split(',')
        .map((part) => part.trim().replace(/^"|^'|"$|'$/g, ''))
        .filter((x) => x.length > 0);
    }
    // Scalar value
    return [s];
  };

  const sourceItems = () => {
    if (!dataTableMeta) return [] as { label: string; href: string }[];
    const srcList = toArray((dataTableMeta as any).source ?? (dataTableMeta as any).sources);
    const pageList = toArray((dataTableMeta as any).page ?? (dataTableMeta as any).pages);
    const pdfList = toArray((dataTableMeta as any).pdf_page ?? (dataTableMeta as any).pdf_pages);
    const linkList = toArray((dataTableMeta as any).links ?? (dataTableMeta as any).link);
    const tableList = toArray((dataTableMeta as any).table ?? (dataTableMeta as any).tables);
    const pfx = t('info.pagePrefix');
    const pdfSfx = t('info.pdfSuffix');
    // The lists are expected to be equal length; iterate by the length of 'source'
    const n = srcList.length;
    const items: { label: string; href: string }[] = [];
    for (let i = 0; i < n; i++) {
      const src = (srcList[i] ?? '').trim();
      const page = (pageList[i] ?? '').toString().trim();
      const pdf = (pdfList[i] ?? '').toString().trim();
      const href = (linkList[i] ?? '#').toString();
      const tbl = (tableList[i] ?? '').toString().trim();
      if (!src) continue;
      const parts: string[] = [];
      parts.push(src);
      if (tbl) parts.push(`${t('info.tableLabel')} ${tbl}`);
      const pageBits: string[] = [];
      if (page) pageBits.push(`${pfx}${page}`);
      if (pdf) pageBits.push(`(${pdf}${pdfSfx})`);
      const pageStr = pageBits.join(' ');
      const label = pageStr ? `${src}, ${pageStr}` : src;
      items.push({ label, href });
    }
    return items;
  };

  const description = language === 'pl'
    ? (dataTableMeta?.description_pol as string | undefined)
    : (dataTableMeta?.description_eng as string | undefined);

  const standardization = (dataTableMeta?.standardization_comments as string | undefined);
  const imputation = (dataTableMeta?.imputation_method as string | undefined);

  const none = t('info.none');

  const formatDateValue = (v: any): string => {
    if (v == null || v === '') return '';
    const locale = language === 'pl' ? 'pl-PL' : 'en-GB';
    const fmt = new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'long', day: 'numeric' });
    if (v instanceof Date) return fmt.format(v);
    const n = Number(v);
    if (!Number.isNaN(n)) {
      // Heuristic: treat magnitudes < 1e12 as seconds, otherwise milliseconds
      const ms = Math.abs(n) < 1e12 ? n * 1000 : n;
      const d = new Date(ms);
      if (!Number.isNaN(d.getTime())) return fmt.format(d);
    }
    // Fallback to string
    try {
      const d2 = new Date(String(v));
      if (!Number.isNaN(d2.getTime())) return fmt.format(d2);
    } catch {}
    return String(v);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-wide">{t('info.tableHeader')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {/* Source */}
          {(sourceItems().length > 0) && (
            <div>
              <div className="font-medium mb-1">{t('info.source')}:</div>
              <div className="space-y-1">
                {sourceItems().map((item, i) => (
                  <div key={i}>
                    <a href={item.href} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {item.label}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {description && (
            <div>
              <div className="font-medium mb-1">{t('info.description')}:</div>
              <div className="text-gray-700 leading-relaxed">{description}</div>
            </div>
          )}

          {/* Date */}
          {dataTableMeta?.date && (
            <div>
              <div className="font-medium mb-1">{t('info.dataDate')}:</div>
              <div className="text-gray-700">{formatDateValue(dataTableMeta.date)}</div>
            </div>
          )}

          {/* Original administrative boundaries date */}
          {dataTableMeta?.adm_state_date && (
            <div>
              <div className="font-medium mb-1">{t('info.originalAdmin')}:</div>
              <div className="text-gray-700">{formatDateValue(dataTableMeta.adm_state_date)}</div>
            </div>
          )}
          {dataTableMeta?.orig_adm_state_date && (
            <div>
              <div className="font-medium mb-1">{t('info.originalAdmin')}:</div>
              <div className="text-gray-700">{formatDateValue(dataTableMeta.orig_adm_state_date)}</div>
            </div>
          )}

          {/* Standardization comments */}
          <div>
            <div className="font-medium mb-1">{t('info.standardization')}:</div>
            <div className="text-gray-700">{(standardization && standardization.trim()) ? standardization : none}</div>
          </div>

          {/* Imputation method */}
          <div>
            <div className="font-medium mb-1">{t('info.imputation')}:</div>
            <div className="text-gray-700">{(imputation && imputation.trim()) ? imputation : none}</div>
          </div>
        </div>
      </CardContent>

      <CardHeader>
        <CardTitle className="text-base font-semibold tracking-wide">{t('info.datasetHeader')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {/* Dataset name */}
          <div>
            <div className="font-medium mb-1">{t('info.datasetName')}:</div>
            <div className="text-gray-700">
              {language === 'pl' ? (columnMeta?.category_pol ?? '') : (columnMeta?.category_eng ?? '')}
            </div>
          </div>

          {/* Unit */}
          <div>
            <div className="font-medium mb-1">{t('info.unit')}:</div>
            <div className="text-gray-700">
              {(() => {
                const u = columnMeta?.unit as string | undefined;
                return u && u.trim() ? u : t('info.none');
              })()}
            </div>
          </div>

          {/* Completeness */}
          <div>
            <div className="font-medium mb-1">{t('info.completeness')}:</div>
            <div className="text-gray-700">
              {(() => {
                const v = columnMeta?.completeness;
                if (v == null || isNaN(Number(v))) return t('info.none');
                const pct = Math.round(Number(v) * 10000) / 100; // 2 decimals
                return `${pct}%`;
              })()}
            </div>
          </div>

          {/* Counts before imputation */}
          <div>
            <div className="font-medium mb-1">{t('info.countPresent')}:</div>
            <div className="text-gray-700">
              {(() => {
                const a = Number(columnMeta?.n_not_na ?? 0);
                const b = Number(columnMeta?.n_na ?? 0);
                const total = a + b;
                return `${a}/${total}`;
              })()}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">{t('info.countMissing')}:</div>
            <div className="text-gray-700">
              {(() => {
                const a = Number(columnMeta?.n_not_na ?? 0);
                const b = Number(columnMeta?.n_na ?? 0);
                const total = a + b;
                return `${b}/${total}`;
              })()}
            </div>
          </div>

          {/* Completeness after imputation */}
          <div>
            <div className="font-medium mb-1">{t('info.completenessAfter')}:</div>
            <div className="text-gray-700">
              {(() => {
                const v = columnMeta?.completeness_after_imputation;
                if (v == null || isNaN(Number(v))) return t('info.none');
                const pct = Math.round(Number(v) * 10000) / 100;
                return `${pct}%`;
              })()}
            </div>
          </div>

          {/* Counts after imputation */}
          <div>
            <div className="font-medium mb-1">{t('info.countPresentAfter')}:</div>
            <div className="text-gray-700">
              {(() => {
                const baseA = Number(columnMeta?.n_not_na ?? 0);
                const baseB = Number(columnMeta?.n_na ?? 0);
                const total = baseA + baseB;
                const a = columnMeta?.n_not_na_after_imputation;
                if (a == null) return t('info.none');
                return `${Number(a)}/${total}`;
              })()}
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">{t('info.countMissingAfter')}:</div>
            <div className="text-gray-700">
              {(() => {
                const baseA = Number(columnMeta?.n_not_na ?? 0);
                const baseB = Number(columnMeta?.n_na ?? 0);
                const total = baseA + baseB;
                const b = columnMeta?.n_na_after_imputation;
                if (b == null) return t('info.none');
                return `${Number(b)}/${total}`;
              })()}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
