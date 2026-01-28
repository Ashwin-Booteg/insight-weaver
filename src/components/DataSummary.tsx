import React, { useMemo } from 'react';
import { DataColumn } from '@/types/analytics';
import { 
  Hash, 
  Calendar, 
  Type, 
  ToggleLeft, 
  MapPin, 
  Building2, 
  Target, 
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataSummaryProps {
  data: Record<string, unknown>[];
  columns: DataColumn[];
  className?: string;
}

interface ColumnStats {
  column: DataColumn;
  nullCount: number;
  uniqueCount: number;
  // Numeric stats
  min?: number;
  max?: number;
  sum?: number;
  mean?: number;
  median?: number;
  // Categorical stats
  topValues?: { value: string; count: number }[];
}

export function DataSummary({ data, columns, className }: DataSummaryProps) {
  const stats = useMemo(() => {
    return columns
      .filter(col => !col.name.endsWith('_normalized'))
      .map(col => calculateColumnStats(data, col));
  }, [data, columns]);

  const numericStats = stats.filter(s => s.column.type === 'number');
  const categoricalStats = stats.filter(s => s.column.type === 'text' || s.column.type === 'location');
  const dateStats = stats.filter(s => s.column.type === 'date');

  return (
    <div className={cn('space-y-6', className)}>
      {/* Numeric Columns Summary */}
      {numericStats.length > 0 && (
        <div className="chart-container">
          <div className="flex items-center gap-2 mb-4">
            <Hash className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Numeric Columns ({numericStats.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {numericStats.map(stat => (
              <NumericStatCard key={stat.column.name} stat={stat} totalRows={data.length} />
            ))}
          </div>
        </div>
      )}

      {/* Categorical Columns Summary */}
      {categoricalStats.length > 0 && (
        <div className="chart-container">
          <div className="flex items-center gap-2 mb-4">
            <Type className="w-5 h-5 text-accent" />
            <h3 className="text-sm font-semibold text-foreground">Categorical Columns ({categoricalStats.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoricalStats.slice(0, 9).map(stat => (
              <CategoricalStatCard key={stat.column.name} stat={stat} totalRows={data.length} />
            ))}
          </div>
        </div>
      )}

      {/* Date Columns Summary */}
      {dateStats.length > 0 && (
        <div className="chart-container">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-destructive" />
            <h3 className="text-sm font-semibold text-foreground">Date Columns ({dateStats.length})</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dateStats.map(stat => (
              <DateStatCard key={stat.column.name} stat={stat} data={data} totalRows={data.length} />
            ))}
          </div>
        </div>
      )}

      {/* Column Classification Overview */}
      <div className="chart-container">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Column Classification</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {columns.filter(c => !c.name.endsWith('_normalized')).map(col => (
            <ColumnBadge key={col.name} column={col} />
          ))}
        </div>
      </div>
    </div>
  );
}

function NumericStatCard({ stat, totalRows }: { stat: ColumnStats; totalRows: number }) {
  const fillRate = ((totalRows - stat.nullCount) / totalRows) * 100;
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={stat.column.name}>
            {formatColumnName(stat.column.name)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stat.uniqueCount.toLocaleString()} unique • {fillRate.toFixed(0)}% filled
          </p>
        </div>
        <Hash className="w-4 h-4 text-primary shrink-0" />
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-xs text-muted-foreground">Sum</p>
          <p className="text-lg font-bold text-foreground">
            {formatNumber(stat.sum)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Mean</p>
          <p className="text-lg font-bold text-foreground">
            {formatNumber(stat.mean)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Min</p>
          <p className="text-sm font-medium text-muted-foreground">
            {formatNumber(stat.min)}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Max</p>
          <p className="text-sm font-medium text-muted-foreground">
            {formatNumber(stat.max)}
          </p>
        </div>
      </div>
    </div>
  );
}

function CategoricalStatCard({ stat, totalRows }: { stat: ColumnStats; totalRows: number }) {
  const fillRate = ((totalRows - stat.nullCount) / totalRows) * 100;
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={stat.column.name}>
            {formatColumnName(stat.column.name)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stat.uniqueCount.toLocaleString()} unique • {fillRate.toFixed(0)}% filled
          </p>
        </div>
        {getColumnIcon(stat.column)}
      </div>
      
      {stat.topValues && stat.topValues.length > 0 && (
        <div className="space-y-1.5">
          {stat.topValues.slice(0, 4).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground truncate max-w-[60%]" title={item.value}>
                {item.value || '(empty)'}
              </span>
              <span className="font-medium text-foreground">
                {item.count.toLocaleString()}
              </span>
            </div>
          ))}
          {stat.topValues.length > 4 && (
            <p className="text-xs text-muted-foreground">
              +{stat.uniqueCount - 4} more values
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DateStatCard({ stat, data, totalRows }: { stat: ColumnStats; data: Record<string, unknown>[]; totalRows: number }) {
  const fillRate = ((totalRows - stat.nullCount) / totalRows) * 100;
  
  // Calculate date range
  const dates = data
    .map(row => row[stat.column.name])
    .filter((d): d is Date => d instanceof Date)
    .sort((a, b) => a.getTime() - b.getTime());
  
  const minDate = dates[0];
  const maxDate = dates[dates.length - 1];
  
  return (
    <div className="bg-muted/30 rounded-lg p-4 border border-border/50">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate" title={stat.column.name}>
            {formatColumnName(stat.column.name)}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stat.uniqueCount.toLocaleString()} unique dates • {fillRate.toFixed(0)}% filled
          </p>
        </div>
        <Calendar className="w-4 h-4 text-destructive shrink-0" />
      </div>
      
      <div className="space-y-2">
        {minDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Earliest</span>
            <span className="font-medium text-foreground">
              {minDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
        {maxDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Latest</span>
            <span className="font-medium text-foreground">
              {maxDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        )}
        {minDate && maxDate && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Span</span>
            <span className="font-medium text-foreground">
              {Math.ceil((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24))} days
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function ColumnBadge({ column }: { column: DataColumn }) {
  const getTypeColor = () => {
    if (column.isICP) return 'bg-accent/20 text-accent-foreground';
    if (column.isCompany) return 'bg-primary/10 text-primary';
    if (column.isState) return 'bg-secondary text-secondary-foreground';
    if (column.isStatus) return 'bg-muted text-muted-foreground';
    if (column.type === 'number') return 'bg-primary/10 text-primary';
    if (column.type === 'date') return 'bg-destructive/10 text-destructive';
    return 'bg-muted text-muted-foreground';
  };

  const getLabel = () => {
    const labels: string[] = [];
    if (column.isICP) labels.push('ICP');
    if (column.isCompany) labels.push('Company');
    if (column.isState) labels.push('State');
    if (column.isCity) labels.push('City');
    if (column.isZip) labels.push('Zip');
    if (column.isStatus) labels.push('Status');
    if (labels.length === 0) labels.push(column.type);
    return labels.join(', ');
  };

  return (
    <div className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', getTypeColor())}>
      {getColumnIcon(column)}
      <span className="truncate max-w-[120px]" title={column.name}>
        {formatColumnName(column.name)}
      </span>
      <span className="opacity-60">({getLabel()})</span>
    </div>
  );
}

function getColumnIcon(column: DataColumn) {
  if (column.isICP) return <Target className="w-3 h-3" />;
  if (column.isCompany) return <Building2 className="w-3 h-3" />;
  if (column.isState || column.isCity || column.isZip) return <MapPin className="w-3 h-3" />;
  if (column.isStatus) return <Activity className="w-3 h-3" />;
  if (column.type === 'number') return <Hash className="w-3 h-3" />;
  if (column.type === 'date') return <Calendar className="w-3 h-3" />;
  if (column.type === 'boolean') return <ToggleLeft className="w-3 h-3" />;
  return <Type className="w-3 h-3" />;
}

function calculateColumnStats(data: Record<string, unknown>[], column: DataColumn): ColumnStats {
  const values = data.map(row => row[column.name]);
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  const nullCount = values.length - nonNullValues.length;
  
  const uniqueSet = new Set(nonNullValues.map(v => String(v)));
  const uniqueCount = uniqueSet.size;
  
  const stats: ColumnStats = {
    column,
    nullCount,
    uniqueCount
  };
  
  if (column.type === 'number') {
    const numericValues = nonNullValues
      .map(v => typeof v === 'number' ? v : parseFloat(String(v)))
      .filter(v => !isNaN(v));
    
    if (numericValues.length > 0) {
      stats.min = Math.min(...numericValues);
      stats.max = Math.max(...numericValues);
      stats.sum = numericValues.reduce((a, b) => a + b, 0);
      stats.mean = stats.sum / numericValues.length;
      
      // Calculate median
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      stats.median = sorted.length % 2 !== 0 
        ? sorted[mid] 
        : (sorted[mid - 1] + sorted[mid]) / 2;
    }
  }
  
  if (column.type === 'text' || column.type === 'location') {
    const counts: Record<string, number> = {};
    for (const value of nonNullValues) {
      const str = String(value);
      counts[str] = (counts[str] || 0) + 1;
    }
    
    stats.topValues = Object.entries(counts)
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }
  
  return stats;
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

function formatNumber(value: number | undefined): string {
  if (value === undefined || isNaN(value)) return '-';
  
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(1) + 'M';
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(1) + 'K';
  }
  if (Number.isInteger(value)) {
    return value.toLocaleString();
  }
  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}
