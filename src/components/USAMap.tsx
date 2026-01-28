import React, { useState, useMemo } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { StateMetric, US_STATES } from '@/types/analytics';
import { cn } from '@/lib/utils';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface USAMapProps {
  stateMetrics: StateMetric[];
  metricType: 'count' | 'percentage' | 'icp';
  onStateClick?: (stateCode: string) => void;
  selectedState?: string | null;
}

export function USAMap({ stateMetrics, metricType, onStateClick, selectedState }: USAMapProps) {
  const [tooltipContent, setTooltipContent] = useState<{
    state: string;
    data: StateMetric | null;
    x: number;
    y: number;
  } | null>(null);
  
  const metricMap = useMemo(() => {
    const map = new Map<string, StateMetric>();
    for (const metric of stateMetrics) {
      map.set(metric.stateCode, metric);
    }
    return map;
  }, [stateMetrics]);
  
  const { colorScale, maxValue } = useMemo(() => {
    let values: number[];
    
    switch (metricType) {
      case 'percentage':
        values = stateMetrics.map(m => m.percentage);
        break;
      case 'icp':
        values = stateMetrics.map(m => m.icpCount || 0);
        break;
      default:
        values = stateMetrics.map(m => m.value);
    }
    
    const max = Math.max(...values, 1);
    
    const scale = scaleLinear<string>()
      .domain([0, max * 0.25, max * 0.5, max])
      .range(['#E0F2FE', '#7DD3FC', '#38BDF8', '#0284C7']);
    
    return { colorScale: scale, maxValue: max };
  }, [stateMetrics, metricType]);
  
  const getStateValue = (stateCode: string): number => {
    const metric = metricMap.get(stateCode);
    if (!metric) return 0;
    
    switch (metricType) {
      case 'percentage':
        return metric.percentage;
      case 'icp':
        return metric.icpCount || 0;
      default:
        return metric.value;
    }
  };
  
  const stateCodeFromId = (id: string): string | null => {
    const fipsToState: Record<string, string> = {
      '01': 'AL', '02': 'AK', '04': 'AZ', '05': 'AR', '06': 'CA',
      '08': 'CO', '09': 'CT', '10': 'DE', '11': 'DC', '12': 'FL',
      '13': 'GA', '15': 'HI', '16': 'ID', '17': 'IL', '18': 'IN',
      '19': 'IA', '20': 'KS', '21': 'KY', '22': 'LA', '23': 'ME',
      '24': 'MD', '25': 'MA', '26': 'MI', '27': 'MN', '28': 'MS',
      '29': 'MO', '30': 'MT', '31': 'NE', '32': 'NV', '33': 'NH',
      '34': 'NJ', '35': 'NM', '36': 'NY', '37': 'NC', '38': 'ND',
      '39': 'OH', '40': 'OK', '41': 'OR', '42': 'PA', '44': 'RI',
      '45': 'SC', '46': 'SD', '47': 'TN', '48': 'TX', '49': 'UT',
      '50': 'VT', '51': 'VA', '53': 'WA', '54': 'WV', '55': 'WI',
      '56': 'WY'
    };
    return fipsToState[id] || null;
  };
  
  return (
    <div className="relative w-full">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        className="w-full h-auto"
        style={{ maxHeight: '500px' }}
      >
        <ZoomableGroup center={[-97, 38]} zoom={1}>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const stateCode = stateCodeFromId(geo.id);
                if (!stateCode) return null;
                
                const value = getStateValue(stateCode);
                const metric = metricMap.get(stateCode);
                const isSelected = selectedState === stateCode;
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={value > 0 ? colorScale(value) : '#F1F5F9'}
                    stroke={isSelected ? '#1E40AF' : '#CBD5E1'}
                    strokeWidth={isSelected ? 2 : 0.5}
                    style={{
                      default: { outline: 'none', cursor: 'pointer' },
                      hover: { outline: 'none', fill: '#0D9488', cursor: 'pointer' },
                      pressed: { outline: 'none' }
                    }}
                    onMouseEnter={(e) => {
                      const rect = (e.target as Element).getBoundingClientRect();
                      setTooltipContent({
                        state: US_STATES[stateCode] || stateCode,
                        data: metric || null,
                        x: rect.left + rect.width / 2,
                        y: rect.top
                      });
                    }}
                    onMouseLeave={() => setTooltipContent(null)}
                    onClick={() => onStateClick?.(stateCode)}
                  />
                );
              })
            }
          </Geographies>
        </ZoomableGroup>
      </ComposableMap>
      
      {tooltipContent && (
        <MapTooltip
          state={tooltipContent.state}
          data={tooltipContent.data}
          metricType={metricType}
        />
      )}
      
      <MapLegend maxValue={maxValue} metricType={metricType} />
    </div>
  );
}

interface MapTooltipProps {
  state: string;
  data: StateMetric | null;
  metricType: 'count' | 'percentage' | 'icp';
}

function MapTooltip({ state, data, metricType }: MapTooltipProps) {
  return (
    <div className="absolute top-4 right-4 map-tooltip animate-fade-in z-10">
      <p className="font-semibold text-foreground">{state}</p>
      {data ? (
        <div className="mt-1 space-y-1 text-sm">
          <p className="text-muted-foreground">
            Records: <span className="font-medium text-foreground">{data.value.toLocaleString()}</span>
          </p>
          <p className="text-muted-foreground">
            % of Total: <span className="font-medium text-foreground">{data.percentage.toFixed(1)}%</span>
          </p>
          {data.icpCount !== undefined && (
            <p className="text-muted-foreground">
              ICP: <span className="font-medium text-foreground">{data.icpCount.toLocaleString()}</span>
            </p>
          )}
          {data.companyCount !== undefined && (
            <p className="text-muted-foreground">
              Companies: <span className="font-medium text-foreground">{data.companyCount.toLocaleString()}</span>
            </p>
          )}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground mt-1">No data</p>
      )}
    </div>
  );
}

interface MapLegendProps {
  maxValue: number;
  metricType: 'count' | 'percentage' | 'icp';
}

function MapLegend({ maxValue, metricType }: MapLegendProps) {
  const label = metricType === 'percentage' ? '%' : '';
  
  return (
    <div className="absolute bottom-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-border">
      <p className="text-xs font-medium text-muted-foreground mb-2">
        {metricType === 'count' ? 'Record Count' : metricType === 'percentage' ? '% of Total' : 'ICP Count'}
      </p>
      <div className="flex items-center gap-1">
        <div className="w-20 h-3 rounded-sm" style={{
          background: 'linear-gradient(to right, #E0F2FE, #7DD3FC, #38BDF8, #0284C7)'
        }} />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <span>0{label}</span>
        <span>{maxValue.toFixed(metricType === 'percentage' ? 1 : 0)}{label}</span>
      </div>
    </div>
  );
}

interface MetricSelectorProps {
  value: 'count' | 'percentage' | 'icp';
  onChange: (value: 'count' | 'percentage' | 'icp') => void;
}

export function MetricSelector({ value, onChange }: MetricSelectorProps) {
  const options: { value: 'count' | 'percentage' | 'icp'; label: string }[] = [
    { value: 'count', label: 'Count' },
    { value: 'percentage', label: '% of Total' },
    { value: 'icp', label: 'ICP Count' }
  ];
  
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-md transition-all',
            value === option.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
