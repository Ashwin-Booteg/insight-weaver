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
  AreaChart,
  Area,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
  ComposedChart,
  Line
} from 'recharts';
import { DataColumn } from '@/types/analytics';
import { cn } from '@/lib/utils';

const CHART_COLORS = [
  'hsl(243, 75%, 59%)',  // primary indigo
  'hsl(172, 66%, 50%)',  // teal
  'hsl(38, 92%, 50%)',   // amber
  'hsl(340, 82%, 52%)',  // rose
  'hsl(262, 83%, 58%)',  // purple
  'hsl(160, 84%, 39%)',  // emerald
  'hsl(189, 94%, 43%)',  // cyan
  'hsl(215, 16%, 47%)',  // slate
];

const GRADIENT_COLORS = [
  { start: 'hsl(243, 75%, 59%)', end: 'hsl(262, 83%, 58%)' },
  { start: 'hsl(172, 66%, 50%)', end: 'hsl(160, 84%, 39%)' },
  { start: 'hsl(38, 92%, 50%)', end: 'hsl(25, 95%, 53%)' },
  { start: 'hsl(340, 82%, 52%)', end: 'hsl(326, 78%, 50%)' },
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
    
    // Find industry column for special visualization
    const industryColumn = columns.find(c => c.isIndustry);
    const levelColumn = columns.find(c => c.isLevel);
    const statusColumn = columns.find(c => c.isStatus);
    
    // Industry Distribution - Horizontal Bar Chart
    if (industryColumn) {
      const distribution = getDistribution(data, industryColumn.name, 10);
      if (distribution.length > 1) {
        chartConfigs.push(
          <ChartCard key="industry-bar" title="Industry Distribution" className="col-span-full lg:col-span-1">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={distribution} layout="vertical" margin={{ left: 10, right: 30 }}>
                <defs>
                  <linearGradient id="industryGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="hsl(243, 75%, 59%)" />
                    <stop offset="100%" stopColor="hsl(262, 83%, 58%)" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={120}
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => v.length > 18 ? v.slice(0, 18) + '...' : v}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px -4px rgba(0,0,0,0.15)'
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                />
                <Bar dataKey="value" fill="url(#industryGradient)" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Level/Audience Segmentation - Donut Chart
    if (levelColumn) {
      const distribution = getDistribution(data, levelColumn.name, 6);
      if (distribution.length > 1) {
        chartConfigs.push(
          <ChartCard key="level-donut" title="Audience Segmentation">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={distribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
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
                    borderRadius: '12px'
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-sm">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Status Distribution - Pie Chart with percentages
    if (statusColumn) {
      const distribution = getDistribution(data, statusColumn.name, 8);
      if (distribution.length > 1) {
        const total = distribution.reduce((sum, d) => sum + d.value, 0);
        const dataWithPercent = distribution.map(d => ({
          ...d,
          percent: ((d.value / total) * 100).toFixed(1)
        }));
        
        chartConfigs.push(
          <ChartCard key="status-pie" title="Status Breakdown">
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={dataWithPercent}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${percent}%)`}
                  outerRadius={100}
                  dataKey="value"
                >
                  {dataWithPercent.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'Count']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Radar chart for multi-dimensional analysis
    if (categoricalColumns.length >= 3) {
      const radarData = getRadarData(data, categoricalColumns.slice(0, 5));
      if (radarData.length > 0) {
        chartConfigs.push(
          <ChartCard key="radar-analysis" title="Multi-Dimensional Analysis">
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Distribution"
                  dataKey="value"
                  stroke="hsl(243, 75%, 59%)"
                  fill="hsl(243, 75%, 59%)"
                  fillOpacity={0.4}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Time series with area chart
    const dateColumn = columns.find(c => c.type === 'date');
    if (dateColumn) {
      const timeData = getTimeSeries(data, dateColumn.name);
      if (timeData.length > 1) {
        chartConfigs.push(
          <ChartCard key="time-series" title="Records Over Time" className="col-span-full">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={timeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                  formatter={(value: number) => [value.toLocaleString(), 'Records']}
                />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(243, 75%, 59%)"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#timeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // ICP vs Non-ICP by category - Stacked Bar
    const icpColumn = columns.find(c => c.isICP);
    if (icpColumn && industryColumn) {
      const icpByCategory = getICPByCategory(data, industryColumn.name, icpColumn.name);
      
      if (icpByCategory.length > 1) {
        chartConfigs.push(
          <ChartCard key="icp-stacked" title="ICP Distribution by Industry" className="col-span-full lg:col-span-1">
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={icpByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v}
                  angle={-25}
                  textAnchor="end"
                  height={60}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Legend />
                <Bar dataKey="icp" name="ICP Match" stackId="a" fill="hsl(172, 66%, 50%)" radius={[0, 0, 0, 0]} />
                <Bar dataKey="nonIcp" name="Non-ICP" stackId="a" fill="hsl(215, 16%, 77%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Treemap for hierarchical data
    if (categoricalColumns.length > 0 && !industryColumn) {
      const primaryCategory = categoricalColumns[0];
      const distribution = getDistribution(data, primaryCategory.name, 12);
      if (distribution.length > 2) {
        const treemapData = distribution.map((d, i) => ({
          name: d.name,
          size: d.value,
          fill: CHART_COLORS[i % CHART_COLORS.length]
        }));
        
        chartConfigs.push(
          <ChartCard key="treemap" title={`${formatColumnName(primaryCategory.name)} Distribution`}>
            <ResponsiveContainer width="100%" height={320}>
              <Treemap
                data={treemapData}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="hsl(var(--background))"
                content={<CustomTreemapContent />}
              />
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Composed chart for numeric analysis
    const numericColumns = columns.filter(c => c.type === 'number');
    if (numericColumns.length >= 2 && categoricalColumns.length > 0) {
      const composedData = getComposedData(data, categoricalColumns[0].name, numericColumns.slice(0, 2));
      if (composedData.length > 1) {
        chartConfigs.push(
          <ChartCard key="composed" title="Numeric Comparison" className="col-span-full">
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={composedData} margin={{ top: 10, right: 30, left: 0, bottom: 30 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10 }}
                  angle={-30}
                  textAnchor="end"
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px'
                  }}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="value1" name={formatColumnName(numericColumns[0].name)} fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="value2" name={formatColumnName(numericColumns[1].name)} stroke="hsl(340, 82%, 52%)" strokeWidth={3} dot={{ fill: 'hsl(340, 82%, 52%)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartCard>
        );
      }
    }
    
    // Generate additional bar charts for remaining categorical columns
    for (const col of categoricalColumns.slice(0, 2)) {
      if (col.name === industryColumn?.name || col.name === levelColumn?.name || col.name === statusColumn?.name) continue;
      
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
                    borderRadius: '12px'
                  }}
                />
                <Bar dataKey="value" fill="hsl(172, 66%, 50%)" radius={[0, 6, 6, 0]} />
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
    <div className={cn('grid grid-cols-1 lg:grid-cols-2 gap-6', className)}>
      {charts}
    </div>
  );
}

// Custom Treemap content renderer
function CustomTreemapContent({ x, y, width, height, name, fill }: {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  fill?: string;
}) {
  if (!width || !height || width < 50 || height < 30) return null;
  
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        stroke="hsl(var(--background))"
        strokeWidth={2}
        rx={4}
      />
      {width > 60 && height > 40 && (
        <text
          x={x! + width / 2}
          y={y! + height / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="white"
          fontSize={width > 100 ? 12 : 10}
          fontWeight="600"
        >
          {name && name.length > 15 ? name.slice(0, 15) + '...' : name}
        </text>
      )}
    </g>
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
      <h3 className="text-sm font-bold text-foreground mb-4">{title}</h3>
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

function getRadarData(data: Record<string, unknown>[], columns: DataColumn[]): { category: string; value: number }[] {
  const maxCounts: Record<string, number> = {};
  
  for (const col of columns) {
    const uniqueValues = new Set<string>();
    for (const row of data) {
      const value = row[col.name];
      if (value) uniqueValues.add(String(value));
    }
    maxCounts[col.name] = uniqueValues.size;
  }
  
  const maxValue = Math.max(...Object.values(maxCounts));
  
  return columns.map(col => ({
    category: formatColumnName(col.name),
    value: Math.round((maxCounts[col.name] / maxValue) * 100)
  }));
}

function getComposedData(
  data: Record<string, unknown>[], 
  categoryColumn: string, 
  numericColumns: DataColumn[]
): { name: string; value1: number; value2: number }[] {
  const aggregated: Record<string, { sum1: number; sum2: number; count: number }> = {};
  
  for (const row of data) {
    const category = String(row[categoryColumn] || 'Unknown');
    if (!aggregated[category]) {
      aggregated[category] = { sum1: 0, sum2: 0, count: 0 };
    }
    
    const val1 = row[numericColumns[0].name];
    const val2 = row[numericColumns[1]?.name];
    
    if (typeof val1 === 'number') aggregated[category].sum1 += val1;
    if (typeof val2 === 'number') aggregated[category].sum2 += val2;
    aggregated[category].count++;
  }
  
  return Object.entries(aggregated)
    .map(([name, { sum1, sum2, count }]) => ({
      name,
      value1: Math.round(sum1 / count),
      value2: Math.round(sum2 / count)
    }))
    .sort((a, b) => b.value1 - a.value1)
    .slice(0, 10);
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
