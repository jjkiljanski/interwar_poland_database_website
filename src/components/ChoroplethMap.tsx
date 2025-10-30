import { useState, useMemo, useRef, useEffect } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { GeoJSONData, DistrictData } from '../types';
import { Tooltip } from './ui/tooltip';
import { geoMercator, geoCentroid } from 'd3-geo';

interface ChoroplethMapProps {
  geoJsonData: GeoJSONData;
  districtData: DistrictData[];
  datasetName?: string;
  idProperty?: 'District' | 'Region';
}

export function ChoroplethMap({ geoJsonData, districtData, datasetName, idProperty = 'District' }: ChoroplethMapProps) {
  const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{ name: string; value: number | undefined; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 800, height: 600 });

  // Create a lookup map for district values
  const dataLookup = useMemo(() => {
    return new Map(
      districtData.map((d) => [String(d.districtId ?? '').trim().toUpperCase(), d.value])
    );
  }, [districtData]);

  // Calculate min and max for color scaling
  const { minValue, maxValue } = useMemo(() => {
    const values = districtData.map(d => d.value).filter(v => v !== null && v !== undefined);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values)
    };
  }, [districtData]);

  // Color scale function
  const getColor = (value: number | undefined): string => {
    if (value === undefined || value === null) return '#e5e7eb';
    
    const normalized = (value - minValue) / (maxValue - minValue);
    
    // Color scale from light blue to dark blue
    const colors = [
      '#f7fbff',
      '#deebf7',
      '#c6dbef',
      '#9ecae1',
      '#6baed6',
      '#4292c6',
      '#2171b5',
      '#08519c',
      '#08306b'
    ];
    
    const index = Math.min(Math.floor(normalized * colors.length), colors.length - 1);
    return colors[index];
  };

  // Generate legend items
  const legendItems = useMemo(() => {
    const grades = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1];
    const colors = [
      '#f7fbff', '#deebf7', '#c6dbef', '#9ecae1',
      '#6baed6', '#4292c6', '#2171b5', '#08519c', '#08306b'
    ];
    
    return grades.map((grade, i) => ({
      color: colors[i],
      label: (minValue + grade * (maxValue - minValue)).toLocaleString(),
      nextLabel: i < grades.length - 1 
        ? (minValue + grades[i + 1] * (maxValue - minValue)).toLocaleString()
        : null
    }));
  }, [minValue, maxValue]);

  const handleMouseEnter = (geo: any, event: React.MouseEvent) => {
    const raw = geo.properties?.[idProperty] || geo.properties.id || geo.properties.ID || geo.properties.district_id || geo.properties.region_id;
    const districtName = raw || geo.properties.name || geo.properties.NAME || geo.properties.district_name || raw;
    const key = String(raw ?? '').trim().toUpperCase();
    const value = dataLookup.get(key);
    
    setHoveredGeo(key);
    setTooltipContent({
      name: districtName,
      value: value,
      x: event.clientX,
      y: event.clientY
    });
  };

  const handleMouseLeave = () => {
    setHoveredGeo(null);
    setTooltipContent(null);
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    setTooltipContent(prev => {
      if (!prev) return prev;
      return { ...prev, x: event.clientX, y: event.clientY };
    });
  };

  // Measure container and fit projection to GeoJSON
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    });
    ro.observe(el);
    // initial
    const rect = el.getBoundingClientRect();
    setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
    return () => ro.disconnect();
  }, []);

  const projectionConfig = useMemo(() => {
    const padding = 20;
    const p = geoMercator();
    let scale = 1200;
    let center: [number, number] = [19, 52];
    try {
      if (geoJsonData && geoJsonData.features && geoJsonData.features.length > 0) {
        // Fit projection to the full FeatureCollection within container bounds
        // @ts-ignore - d3 accepts any GeoJSON object
        p.fitExtent([[padding, padding], [Math.max(1, size.width - padding), Math.max(1, size.height - padding)]], geoJsonData as any);
        scale = p.scale();
        // Use geographic centroid for proper centering
        // @ts-ignore
        const c = geoCentroid(geoJsonData as any);
        if (Array.isArray(c) && c.length === 2 && isFinite(c[0]) && isFinite(c[1])) {
          center = c as [number, number];
        }
      }
    } catch {}
    return { scale, center };
  }, [geoJsonData, size]);

  return (
    <div ref={containerRef} className="w-full h-full relative bg-gray-50" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={projectionConfig}
        width={size.width}
        height={size.height}
        className="w-full h-full"
      >
        <ZoomableGroup>
          <Geographies geography={geoJsonData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const raw = geo.properties?.[idProperty] || geo.properties.id || geo.properties.ID || geo.properties.district_id || geo.properties.region_id;
                const key = String(raw ?? '').trim().toUpperCase();
                const value = dataLookup.get(key);
                const isHovered = hoveredGeo === key;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
                    onMouseMove={(event) => handleMouseEnter(geo, event)}
                    onMouseLeave={handleMouseLeave}
                    style={{
                      default: {
                        fill: getColor(value),
                        stroke: '#666',
                        strokeWidth: 0.5,
                        outline: 'none'
                      },
                      hover: {
                        fill: getColor(value),
                        stroke: '#333',
                        strokeWidth: 2,
                        outline: 'none',
                        filter: 'brightness(0.9)'
                      },
                      pressed: {
                        fill: getColor(value),
                        stroke: '#333',
                        strokeWidth: 2,
                        outline: 'none'
                      }
                    }}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>

      {/* Custom Tooltip */}
      {tooltipContent && (
        <div
          className="fixed pointer-events-none z-50 bg-white px-3 py-2 rounded shadow-lg border border-gray-200"
          style={{
            left: tooltipContent.x + 10,
            top: tooltipContent.y + 10
          }}
        >
          <div className="text-sm">
            <div>{tooltipContent.name}</div>
            {datasetName && <div className="text-xs text-gray-500 italic">{datasetName}</div>}
            <div className="mt-1">
              {tooltipContent.value !== undefined 
                ? `Value: ${tooltipContent.value.toLocaleString()}`
                : 'No data available'}
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white p-4 rounded shadow-lg border border-gray-200">
        <div className="mb-2">Value Range</div>
        <div className="space-y-1">
          {legendItems.map((item, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <div
                className="w-5 h-4 border border-gray-300"
                style={{ backgroundColor: item.color }}
              />
              <span>
                {item.label}
                {item.nextLabel && ` – ${item.nextLabel}`}
                {!item.nextLabel && '+'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
