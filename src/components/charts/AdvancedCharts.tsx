import React from 'react';
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
  Legend,
  ComposedChart,
  Line,
  Area
} from 'recharts';
import { 
  RegionIndustryData, 
  RoleRegionData, 
  ParetoDataPoint,
  StateSummary,
  ExtendedKPIData,
  RegionName,
  IndustryCategory
} from '@/types/filters';
import { US_STATES } from '@/types/analytics';
import { cn } from '@/lib/utils';

const REGION_COLORS: Record<RegionName, string> = {
  Northeast: 'hsl(172, 66%, 50%)',
  Midwest: 'hsl(262, 83%, 58%)',
  South: 'hsl(340, 82%, 52%)',
  West: 'hsl(38, 92%, 50%)'
};

const INDUSTRY_COLORS: Record<IndustryCategory, string> = {
  'Movie & Entertainment': 'hsl(340, 82%, 52%)',
  'Music & Audio': 'hsl(262, 83%, 58%)',
  'Fashion & Apparel': 'hsl(38, 92%, 50%)'
};

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

// Top 10 States Bar Chart
interface TopStatesChartProps {
  kpiData: ExtendedKPIData;
  onStateClick?: (stateCode: string) => void;
}

export function TopStatesChart({ kpiData, onStateClick }: TopStatesChartProps) {
  const data = Object.entries(kpiData.stateBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([state, count]) => ({
      state,
      name: US_STATES[state] || state,
      count
    }));

  return (
    <ChartCard title="Top 10 States by People">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <defs>
            <linearGradient id="topStatesGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(243, 75%, 59%)" />
              <stop offset="100%" stopColor="hsl(172, 66%, 50%)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => [value.toLocaleString(), 'People']}
          />
          <Bar 
            dataKey="count" 
            fill="url(#topStatesGradient)" 
            radius={[0, 8, 8, 0]}
            onClick={(data) => onStateClick?.(data.state)}
            className="cursor-pointer"
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Bottom 10 States Bar Chart
export function BottomStatesChart({ kpiData }: TopStatesChartProps) {
  const allStates = Object.entries(kpiData.stateBreakdown)
    .sort((a, b) => a[1] - b[1]);
  
  const data = allStates
    .slice(0, 10)
    .map(([state, count]) => ({
      state,
      name: US_STATES[state] || state,
      count
    }));

  return (
    <ChartCard title="Bottom 10 States by People">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => [value.toLocaleString(), 'People']}
          />
          <Bar 
            dataKey="count" 
            fill="hsl(340, 82%, 52%)" 
            radius={[0, 8, 8, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Region × Industry Stacked Bar Chart
interface RegionIndustryChartProps {
  data: RegionIndustryData[];
}

export function RegionIndustryStackedChart({ data }: RegionIndustryChartProps) {
  return (
    <ChartCard title="Region Totals by Industry">
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="region" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
          <Bar dataKey="Movie & Entertainment" stackId="a" fill={INDUSTRY_COLORS['Movie & Entertainment']} />
          <Bar dataKey="Music & Audio" stackId="a" fill={INDUSTRY_COLORS['Music & Audio']} />
          <Bar dataKey="Fashion & Apparel" stackId="a" fill={INDUSTRY_COLORS['Fashion & Apparel']} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Industry Donut Chart
interface IndustryDonutChartProps {
  data: Record<IndustryCategory, number>;
}

export function IndustryDonutChart({ data }: IndustryDonutChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name,
    value
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <ChartCard title="Share of People by Industry">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(1)}%`}
          >
            {chartData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={INDUSTRY_COLORS[entry.name as IndustryCategory]} 
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => [value.toLocaleString(), 'People']}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Top 15 Roles Horizontal Bar Chart
interface TopRolesChartProps {
  roleBreakdown: Record<string, number>;
}

export function TopRolesChart({ roleBreakdown }: TopRolesChartProps) {
  const data = Object.entries(roleBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([role, count]) => ({
      role: role.length > 25 ? role.slice(0, 25) + '...' : role,
      fullRole: role,
      count
    }));

  return (
    <ChartCard title="Top 15 Roles by People" className="col-span-full">
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} layout="vertical" margin={{ left: 20, right: 30 }}>
          <defs>
            <linearGradient id="roleGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(262, 83%, 58%)" />
              <stop offset="100%" stopColor="hsl(243, 75%, 59%)" />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis
            dataKey="role"
            type="category"
            width={180}
            tick={{ fontSize: 10 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number, name: any, props: any) => [
              value.toLocaleString(), 
              props.payload.fullRole
            ]}
          />
          <Bar 
            dataKey="count" 
            fill="url(#roleGradient)" 
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Pareto Chart (80/20 Rule)
interface ParetoChartProps {
  data: ParetoDataPoint[];
}

export function ParetoChart({ data }: ParetoChartProps) {
  // Take top 20 roles for clarity
  const chartData = data.slice(0, 20).map(d => ({
    ...d,
    role: d.role.length > 15 ? d.role.slice(0, 15) + '...' : d.role
  }));

  return (
    <ChartCard title="Pareto Analysis (80/20 Rule)" className="col-span-full">
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="role" 
            tick={{ fontSize: 10 }}
            angle={-45}
            textAnchor="end"
            interval={0}
          />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis 
            yAxisId="right" 
            orientation="right" 
            tick={{ fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number, name: string) => {
              if (name === 'count') return [value.toLocaleString(), 'People'];
              return [`${value.toFixed(1)}%`, 'Cumulative'];
            }}
          />
          <Legend />
          <Bar 
            yAxisId="left" 
            dataKey="count" 
            name="People"
            fill="hsl(243, 75%, 59%)" 
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="cumulativePercent"
            name="Cumulative %"
            stroke="hsl(340, 82%, 52%)"
            strokeWidth={3}
            dot={{ fill: 'hsl(340, 82%, 52%)', r: 4 }}
          />
          {/* 80% reference line */}
          <Line
            yAxisId="right"
            type="monotone"
            dataKey={() => 80}
            stroke="hsl(var(--muted-foreground))"
            strokeDasharray="5 5"
            strokeWidth={1}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Role × Region Stacked Bar Chart
interface RoleRegionChartProps {
  data: RoleRegionData[];
}

export function RoleRegionStackedChart({ data }: RoleRegionChartProps) {
  const chartData = data.map(d => ({
    ...d,
    role: d.role.length > 20 ? d.role.slice(0, 20) + '...' : d.role
  }));

  return (
    <ChartCard title="Top 10 Roles by Region Distribution" className="col-span-full">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis 
            dataKey="role" 
            tick={{ fontSize: 10 }}
            angle={-30}
            textAnchor="end"
          />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
          <Bar dataKey="Northeast" stackId="a" fill={REGION_COLORS.Northeast} />
          <Bar dataKey="Midwest" stackId="a" fill={REGION_COLORS.Midwest} />
          <Bar dataKey="South" stackId="a" fill={REGION_COLORS.South} />
          <Bar dataKey="West" stackId="a" fill={REGION_COLORS.West} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Region × Industry Heatmap
export function RegionIndustryHeatmap({ data }: RegionIndustryChartProps) {
  const industries: IndustryCategory[] = ['Movie & Entertainment', 'Music & Audio', 'Fashion & Apparel'];
  
  // Find max value for color scaling
  const maxValue = Math.max(...data.flatMap(d => industries.map(i => d[i])));

  const getOpacity = (value: number) => {
    return maxValue > 0 ? Math.max(0.2, value / maxValue) : 0.2;
  };

  return (
    <ChartCard title="Region × Industry Heatmap">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="p-2 text-left text-sm font-medium text-muted-foreground">Region</th>
              {industries.map(industry => (
                <th key={industry} className="p-2 text-center text-xs font-medium text-muted-foreground">
                  {industry.split(' ')[0]}
                </th>
              ))}
              <th className="p-2 text-center text-sm font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.region}>
                <td className="p-2 text-sm font-medium">{row.region}</td>
                {industries.map(industry => (
                  <td key={industry} className="p-1">
                    <div 
                      className="p-2 rounded-lg text-center text-sm font-medium transition-colors"
                      style={{
                        backgroundColor: INDUSTRY_COLORS[industry],
                        opacity: getOpacity(row[industry]),
                        color: 'white'
                      }}
                    >
                      {row[industry].toLocaleString()}
                    </div>
                  </td>
                ))}
                <td className="p-2 text-center text-sm font-bold">{row.total.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
