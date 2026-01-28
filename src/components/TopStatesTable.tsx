import React from 'react';
import { StateMetric } from '@/types/analytics';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TopStatesTableProps {
  stateMetrics: StateMetric[];
  onStateClick?: (stateCode: string) => void;
  selectedState?: string | null;
  limit?: number;
}

export function TopStatesTable({ stateMetrics, onStateClick, selectedState, limit = 10 }: TopStatesTableProps) {
  const topStates = stateMetrics.slice(0, limit);
  const maxValue = topStates[0]?.value || 1;
  
  if (topStates.length === 0) {
    return (
      <div className="chart-container flex items-center justify-center h-48 text-muted-foreground">
        <p>No state data available</p>
      </div>
    );
  }
  
  return (
    <div className="chart-container">
      <h3 className="text-sm font-semibold text-foreground mb-4">Top States</h3>
      
      <div className="space-y-2">
        {topStates.map((state, index) => (
          <button
            key={state.stateCode}
            onClick={() => onStateClick?.(state.stateCode)}
            className={cn(
              'w-full flex items-center gap-3 p-2 rounded-lg transition-all text-left group',
              selectedState === state.stateCode
                ? 'bg-primary/10 ring-1 ring-primary'
                : 'hover:bg-muted'
            )}
          >
            <span className={cn(
              'w-6 h-6 flex items-center justify-center text-xs font-bold rounded-full shrink-0',
              index === 0 ? 'bg-primary/20 text-primary' :
              index === 1 ? 'bg-secondary text-secondary-foreground' :
              index === 2 ? 'bg-accent/20 text-accent' :
              'bg-muted text-muted-foreground'
            )}>
              {index + 1}
            </span>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-medium text-sm truncate">{state.stateName}</span>
                <span className="text-sm font-semibold text-foreground">
                  {state.value.toLocaleString()}
                </span>
              </div>
              
              <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all"
                  style={{ width: `${(state.value / maxValue) * 100}%` }}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
              <span>{state.percentage.toFixed(1)}%</span>
              {state.icpCount !== undefined && state.icpCount > 0 && (
                <span className="px-1.5 py-0.5 bg-accent/10 text-accent rounded">
                  {state.icpCount} ICP
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
      
      {stateMetrics.length > limit && (
        <p className="text-xs text-muted-foreground text-center mt-4">
          Showing top {limit} of {stateMetrics.length} states
        </p>
      )}
    </div>
  );
}
