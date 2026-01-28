import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  Legend
} from 'recharts';
import { DataColumn } from '@/types/analytics';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(224, 76%, 48%)',  // primary blue
  'hsl(168, 76%, 42%)',  // teal
  'hsl(38, 92%, 50%)',   // amber
  'hsl(346, 77%, 50%)',  // rose
  'hsl(262, 83%, 58%)',  // purple
  'hsl(160, 84%, 39%)',  // emerald
  'hsl(189, 94%, 43%)',  // cyan
  'hsl(215, 16%, 47%)',  // slate
];

interface AutoChartsProps {
  data: Record<string, unknown>[];
  columns: DataColumn[];
  className?: string;
}

export function AutoCharts({ data, columns, className }: AutoChartsProps) {
  const charts = useMemo(() => {
    const chartConfigs: React.ReactNode[] = [];
    
    // Find categorical columns for bar charts
    const categoricalColumns = columns.filter(
      c => c.type === 'text' && !c.isState && !c.isCity && !c.isZip && !c.isCompany
    );
    
    // Generate bar charts for top categorical columns
    for (const col of categoricalColumns.slice(0, 3)) {
      const distribution = getDistribution(data, col.name, 8);
      if (distribution.length > 1) {
        chartConfigs.push(
          <ChartCard key={`bar-${col.name}`} title={formatColumnName(col.name)}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={distribution} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={100}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(224, 76%, 48%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Find status column for pie chart
    const statusColumn = columns.find(c => c.isStatus);
    if (statusColumn) {
      const distribution = getDistribution(data, statusColumn.name, 6);
      if (distribution.length > 1) {
        chartConfigs.push(
          <ChartCard key="status-pie" title="Status Distribution">
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {distribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Find date column for time series
    const dateColumn = columns.find(c => c.type === 'date');
    if (dateColumn) {
      const timeData = getTimeSeries(data, dateColumn.name);
      if (timeData.length > 1) {
        chartConfigs.push(
          <ChartCard key="time-series" title="Records Over Time" className="col-span-full">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(224, 76%, 48%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(224, 76%, 48%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // ICP distribution by category
    const icpColumn = columns.find(c => c.isICP);
    if (icpColumn && categoricalColumns.length > 0) {
      const primaryCategory = categoricalColumns[0];
      const icpByCategory = getICPByCategory(data, primaryCategory.name, icpColumn.name);
      
      if (icpByCategory.length > 1) {
        chartConfigs.push(
          <ChartCard key="icp-distribution" title={`ICP by ${formatColumnName(primaryCategory.name)}`}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={icpByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 10 ? v.slice(0, 10) + '...' : v}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="icp" name="ICP" fill="hsl(168, 76%, 42%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="nonIcp" name="Non-ICP" fill="hsl(215, 16%, 77%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    return chartConfigs;
  }, [data, columns]);
  
  if (charts.length === 0) {
    return (
      <div className={cn('chart-container flex items-center justify-center h-64 text-muted-foreground', className)}>
        <p>Upload data to see visualizations</p>
      </div>
    );
  }
  
  return (
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-4', className)}>
      {charts}
    </div>
  );
}

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
}

function ChartCard({ title, children, className }: ChartCardProps) {
  return (
    <div className={cn('chart-container', className)}>
      <h3 className="text-sm font-semibold text-foreground mb-4">{title}</h3>
      {children}
    </div>
  );
}

function getDistribution(data: Record<string, unknown>[], columnName: string, limit: number): { name: string; value: number }[] {
  const counts: Record<string, number> = {};
  
  for (const row of data) {
    const value = String(row[columnName] || 'Unknown');
    counts[value] = (counts[value] || 0) + 1;
  }
  
  return Object.entries(counts)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

function getTimeSeries(data: Record<string, unknown>[], columnName: string): { date: string; count: number }[] {
  const counts: Record<string, number> = {};
  
  for (const row of data) {
    const dateValue = row[columnName];
    if (dateValue instanceof Date) {
      const monthKey = `${dateValue.getFullYear()}-${String(dateValue.getMonth() + 1).padStart(2, '0')}`;
      counts[monthKey] = (counts[monthKey] || 0) + 1;
    }
  }
  
  return Object.entries(counts)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

function getICPByCategory(
  data: Record<string, unknown>[],
  categoryColumn: string,
  icpColumn: string
): { name: string; icp: number; nonIcp: number }[] {
  const counts: Record<string, { icp: number; nonIcp: number }> = {};
  
  for (const row of data) {
    const category = String(row[categoryColumn] || 'Unknown');
    const isICP = row[icpColumn] === true || row[icpColumn] === 'true' || 
                  row[icpColumn] === 'yes' || row[icpColumn] === 'Yes' ||
                  row[icpColumn] === 1 || row[icpColumn] === '1';
    
    if (!counts[category]) {
      counts[category] = { icp: 0, nonIcp: 0 };
    }
    
    if (isICP) {
      counts[category].icp++;
    } else {
      counts[category].nonIcp++;
    }
  }
  
  return Object.entries(counts)
    .map(([name, data]) => ({ name, ...data }))
    .sort((a, b) => (b.icp + b.nonIcp) - (a.icp + a.nonIcp))
    .slice(0, 8);
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
