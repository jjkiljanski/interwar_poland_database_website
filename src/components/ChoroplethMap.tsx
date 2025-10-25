import { useState, useMemo } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup
} from 'react-simple-maps';
import { GeoJSONData, DistrictData } from '../types';
import { Tooltip } from './ui/tooltip';

interface ChoroplethMapProps {
  geoJsonData: GeoJSONData;
  districtData: DistrictData[];
  datasetName?: string;
}

export function ChoroplethMap({ geoJsonData, districtData, datasetName }: ChoroplethMapProps) {
  const [hoveredGeo, setHoveredGeo] = useState<string | null>(null);
  const [tooltipContent, setTooltipContent] = useState<{ name: string; value: number | undefined; x: number; y: number } | null>(null);

  // Create a lookup map for district values
  const dataLookup = useMemo(() => 
    new Map(districtData.map(d => [d.districtId, d.value])),
    [districtData]
  );

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
    const districtId = geo.properties.id || geo.properties.ID || geo.properties.district_id;
    const districtName = geo.properties.name || geo.properties.NAME || geo.properties.district_name || districtId;
    const value = dataLookup.get(districtId);
    
    setHoveredGeo(districtId);
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
    if (tooltipContent) {
      setTooltipContent({
        ...tooltipContent,
        x: event.clientX,
        y: event.clientY
      });
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-50" onMouseMove={handleMouseMove}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 1000,
          center: [19, 52]
        }}
        className="w-full h-full"
      >
        <ZoomableGroup>
          <Geographies geography={geoJsonData}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const districtId = geo.properties.id || geo.properties.ID || geo.properties.district_id;
                const value = dataLookup.get(districtId);
                const isHovered = hoveredGeo === districtId;

                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(event) => handleMouseEnter(geo, event)}
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
