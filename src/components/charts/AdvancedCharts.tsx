import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Line
} from 'recharts';
import { 
  RegionIndustryData, RoleRegionData, ParetoDataPoint,
  ExtendedKPIData, IndustryCategory, GlobalFilterState
} from '@/types/filters';
import { GeographyProfile, getRegionColors, getLocationName } from '@/types/geography';
import { cn } from '@/lib/utils';
import { Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const INDUSTRY_COLORS: Record<IndustryCategory, string> = {
  'Movie & Entertainment': 'hsl(340, 82%, 52%)',
  'Music & Audio': 'hsl(262, 83%, 58%)',
  'Fashion & Apparel': 'hsl(38, 92%, 50%)'
};

interface ChartCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  activeFilters?: string[];
}

function ChartCard({ title, children, className, activeFilters }: ChartCardProps) {
  return (
    <div className={cn('chart-container', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        {activeFilters && activeFilters.length > 0 && (
          <Badge variant="secondary" className="gap-1 text-xs">
            <Filter className="w-3 h-3" />
            {activeFilters.join(', ')}
          </Badge>
        )}
      </div>
      {children}
    </div>
  );
}

// Top 10 Locations Bar Chart
interface TopStatesChartProps {
  kpiData: ExtendedKPIData;
  onStateClick?: (stateCode: string) => void;
  activeFilters?: string[];
  profile?: GeographyProfile;
}

export function TopStatesChart({ kpiData, onStateClick, activeFilters, profile }: TopStatesChartProps) {
  const data = Object.entries(kpiData.stateBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([state, count]) => ({
      state,
      name: profile ? getLocationName(state, profile) : state,
      count
    }));

  const locationLabel = profile?.locationLabel || 'States';

  return (
    <ChartCard title={`Top 10 ${locationLabel} by People`} activeFilters={activeFilters}>
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
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            formatter={(value: number) => [value.toLocaleString(), 'People']}
          />
          <Bar dataKey="count" fill="url(#topStatesGradient)" radius={[0, 8, 8, 0]}
            onClick={(data) => onStateClick?.(data.state)} className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export function BottomStatesChart({ kpiData, onStateClick, activeFilters, profile }: TopStatesChartProps) {
  const data = Object.entries(kpiData.stateBreakdown)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 10)
    .map(([state, count]) => ({
      state,
      name: profile ? getLocationName(state, profile) : state,
      count
    }));

  const locationLabel = profile?.locationLabel || 'States';

  return (
    <ChartCard title={`Bottom 10 ${locationLabel} by People`} activeFilters={activeFilters}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} layout="vertical" margin={{ left: 10, right: 30 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" tick={{ fontSize: 12 }} />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 11 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            formatter={(value: number) => [value.toLocaleString(), 'People']}
          />
          <Bar dataKey="count" fill="hsl(340, 82%, 52%)" radius={[0, 8, 8, 0]}
            onClick={(data) => onStateClick?.(data.state)} className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Region × Industry Stacked Bar Chart
interface RegionIndustryChartProps {
  data: RegionIndustryData[];
  onRegionClick?: (region: string) => void;
  onIndustryClick?: (industry: IndustryCategory) => void;
  activeFilters?: string[];
}

export function RegionIndustryStackedChart({ data, onRegionClick, activeFilters }: RegionIndustryChartProps) {
  return (
    <ChartCard title="Region Totals by Industry" activeFilters={activeFilters}>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }} onClick={(e) => {
          if (e?.activePayload?.[0]) onRegionClick?.(e.activePayload[0].payload.region);
        }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="region" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
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
  onIndustryClick?: (industry: IndustryCategory) => void;
  activeFilters?: string[];
}

export function IndustryDonutChart({ data, onIndustryClick, activeFilters }: IndustryDonutChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));

  return (
    <ChartCard title="Share of People by Industry" activeFilters={activeFilters}>
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
            paddingAngle={3} dataKey="value"
            label={({ percent }) => `${(percent * 100).toFixed(1)}%`}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={INDUSTRY_COLORS[entry.name as IndustryCategory]}
                className="cursor-pointer" onClick={() => onIndustryClick?.(entry.name as IndustryCategory)} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
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
  onRoleClick?: (role: string) => void;
  activeFilters?: string[];
}

export function TopRolesChart({ roleBreakdown, onRoleClick, activeFilters }: TopRolesChartProps) {
  const data = Object.entries(roleBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([role, count]) => ({
      role: role.length > 25 ? role.slice(0, 25) + '...' : role,
      fullRole: role,
      count
    }));

  return (
    <ChartCard title="Top 15 Roles by People" className="col-span-full" activeFilters={activeFilters}>
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
          <YAxis dataKey="role" type="category" width={180} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            formatter={(value: number, name: any, props: any) => [value.toLocaleString(), props.payload.fullRole]}
          />
          <Bar dataKey="count" fill="url(#roleGradient)" radius={[0, 6, 6, 0]}
            onClick={(data) => onRoleClick?.(data.fullRole)} className="cursor-pointer" />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Pareto Chart
interface ParetoChartProps {
  data: ParetoDataPoint[];
  onRoleClick?: (role: string) => void;
  activeFilters?: string[];
}

export function ParetoChart({ data, onRoleClick, activeFilters }: ParetoChartProps) {
  const chartData = data.slice(0, 20).map(d => ({
    ...d,
    role: d.role.length > 15 ? d.role.slice(0, 15) + '...' : d.role
  }));

  return (
    <ChartCard title="Pareto Analysis (80/20 Rule)" className="col-span-full" activeFilters={activeFilters}>
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="role" tick={{ fontSize: 10 }} angle={-45} textAnchor="end" interval={0} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
          <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            formatter={(value: number, name: string) => {
              if (name === 'count') return [value.toLocaleString(), 'People'];
              return [`${value.toFixed(1)}%`, 'Cumulative'];
            }}
          />
          <Legend />
          <Bar yAxisId="left" dataKey="count" name="People" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]}
            onClick={(data) => onRoleClick?.(data?.role)} className="cursor-pointer" />
          <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumulative %"
            stroke="hsl(340, 82%, 52%)" strokeWidth={3} dot={{ fill: 'hsl(340, 82%, 52%)', r: 4 }} />
          <Line yAxisId="right" type="monotone" dataKey={() => 80}
            stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" strokeWidth={1} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Role × Region Stacked Bar Chart (dynamic regions)
interface RoleRegionChartProps {
  data: RoleRegionData[];
  onRoleClick?: (role: string) => void;
  activeFilters?: string[];
  profile?: GeographyProfile;
}

export function RoleRegionStackedChart({ data, onRoleClick, activeFilters, profile }: RoleRegionChartProps) {
  const regionColors = profile ? getRegionColors(profile) : {};
  const regionKeys = profile ? Object.keys(profile.regions) : [];

  const chartData = data.map(d => ({
    ...d,
    role: typeof d.role === 'string' && d.role.length > 20 ? d.role.slice(0, 20) + '...' : d.role
  }));

  return (
    <ChartCard title={`Top 10 Roles by ${profile?.regionLabel || 'Region'} Distribution`} className="col-span-full" activeFilters={activeFilters}>
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 50 }} onClick={(e) => {
          if (e?.activePayload?.[0]) {
            const role = e.activePayload[0].payload.role;
            const original = data.find(d => d.role === role || (typeof d.role === 'string' && d.role.startsWith(String(role).replace('...', ''))));
            onRoleClick?.(String(original?.role || role));
          }
        }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="role" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '12px' }}
            formatter={(value: number) => value.toLocaleString()}
          />
          <Legend />
          {regionKeys.map((rk, i) => (
            <Bar key={rk} dataKey={rk} stackId="a" fill={regionColors[rk] || `hsl(${i * 60}, 70%, 50%)`}
              radius={i === regionKeys.length - 1 ? [4, 4, 0, 0] : undefined} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

// Region × Industry Heatmap
export function RegionIndustryHeatmap({ data, onRegionClick, onIndustryClick, activeFilters }: RegionIndustryChartProps) {
  const industries: IndustryCategory[] = ['Movie & Entertainment', 'Music & Audio', 'Fashion & Apparel'];
  const maxValue = Math.max(...data.flatMap(d => industries.map(i => d[i])));
  const getOpacity = (value: number) => maxValue > 0 ? Math.max(0.2, value / maxValue) : 0.2;

  return (
    <ChartCard title="Region × Industry Heatmap" activeFilters={activeFilters}>
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
                      className="p-2 rounded-lg text-center text-sm font-medium transition-colors cursor-pointer hover:ring-2 hover:ring-primary/50"
                      style={{
                        backgroundColor: INDUSTRY_COLORS[industry],
                        opacity: getOpacity(row[industry]),
                        color: 'white'
                      }}
                      onClick={() => {
                        onRegionClick?.(row.region);
                        onIndustryClick?.(industry);
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
