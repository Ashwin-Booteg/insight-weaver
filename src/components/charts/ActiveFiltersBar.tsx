import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Film, Music, Shirt, Building2, Layers, Globe } from 'lucide-react';

interface ActiveFilter {
  type: 'industry' | 'level' | 'domain' | 'state' | 'category';
  value: string;
}

interface ActiveFiltersBarProps {
  filters: ActiveFilter[];
  onRemove: (filter: ActiveFilter) => void;
  onClearAll: () => void;
  className?: string;
}

const FILTER_ICONS: Record<string, React.ReactNode> = {
  industry: <Film className="w-3 h-3" />,
  level: <Layers className="w-3 h-3" />,
  domain: <Globe className="w-3 h-3" />,
  state: <Building2 className="w-3 h-3" />,
  category: <Shirt className="w-3 h-3" />,
};

const FILTER_COLORS: Record<string, string> = {
  industry: 'bg-chart-purple/10 text-chart-purple border-chart-purple/30',
  level: 'bg-chart-blue/10 text-chart-blue border-chart-blue/30',
  domain: 'bg-chart-teal/10 text-chart-teal border-chart-teal/30',
  state: 'bg-chart-amber/10 text-chart-amber border-chart-amber/30',
  category: 'bg-chart-rose/10 text-chart-rose border-chart-rose/30',
};

export function ActiveFiltersBar({ filters, onRemove, onClearAll, className }: ActiveFiltersBarProps) {
  if (filters.length === 0) return null;
  
  return (
    <div className={cn('flex items-center gap-2 flex-wrap', className)}>
      <span className="text-xs font-medium text-muted-foreground">Active Filters:</span>
      {filters.slice(0, 8).map((filter, index) => (
        <Badge 
          key={`${filter.type}-${filter.value}-${index}`}
          variant="outline"
          className={cn(
            'cursor-pointer hover:opacity-70 transition-opacity gap-1.5',
            FILTER_COLORS[filter.type]
          )}
          onClick={() => onRemove(filter)}
        >
          {FILTER_ICONS[filter.type]}
          {filter.value}
          <span className="ml-1 opacity-60">×</span>
        </Badge>
      ))}
      {filters.length > 8 && (
        <Badge variant="secondary" className="text-xs">
          +{filters.length - 8} more
        </Badge>
      )}
      <button 
        onClick={onClearAll}
        className="text-xs text-muted-foreground hover:text-destructive transition-colors ml-2"
      >
        Clear all
      </button>
    </div>
  );
}
