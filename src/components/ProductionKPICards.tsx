import React, { useMemo } from 'react';
import {
  Factory, MapPin, Building2, Users, Shield, Briefcase,
  Globe2, TrendingUp, Star, Layers, Crown, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProductionKPICardsProps {
  data: Record<string, unknown>[];
  columns: { name: string; isState?: boolean; isCity?: boolean; isCompany?: boolean; isIndustry?: boolean }[];
}

interface CompanyMetrics {
  totalCompanies: number;
  ownershipBreakdown: Record<string, number>;
  sizeBreakdown: Record<string, number>;
  focusBreakdown: Record<string, number>;
  stateBreakdown: Record<string, number>;
  cityBreakdown: Record<string, number>;
  industryBreakdown: Record<string, number>;
  topState: { name: string; count: number } | null;
  topCity: { name: string; count: number } | null;
  uniqueStates: number;
  uniqueCities: number;
  publicCount: number;
  privateCount: number;
  majorCount: number;
  indieCount: number;
}

function computeMetrics(data: Record<string, unknown>[]): CompanyMetrics {
  const ownership: Record<string, number> = {};
  const size: Record<string, number> = {};
  const focus: Record<string, number> = {};
  const states: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const industries: Record<string, number> = {};

  for (const row of data) {
    // Support both "Ownership" and "Company Type" columns
    const own = (row['Ownership'] as string) || (row['Company Type'] as string) || 'Unknown';
    ownership[own] = (ownership[own] || 0) + 1;

    // Support both "Size bracket" and "Company Type" for size
    const sz = (row['Size bracket'] as string) || '';
    if (sz) size[sz] = (size[sz] || 0) + 1;

    // Support "Focus" and "Specialty" columns
    const foc = (row['Focus'] as string) || (row['Specialty'] as string) || '';
    if (foc) focus[foc] = (focus[foc] || 0) + 1;

    // Support "HQ State" and "State" columns
    const st = (row['HQ State'] as string) || (row['State'] as string) || '';
    if (st) states[st] = (states[st] || 0) + 1;

    // Support "HQ City" and "City" columns
    const city = (row['HQ City'] as string) || (row['City'] as string) || '';
    if (city) cities[city] = (cities[city] || 0) + 1;

    const ind = (row['Industry'] as string) || '';
    if (ind) industries[ind] = (industries[ind] || 0) + 1;
  }

  const sortedStates = Object.entries(states).sort((a, b) => b[1] - a[1]);
  const sortedCities = Object.entries(cities).sort((a, b) => b[1] - a[1]);

  return {
    totalCompanies: data.length,
    ownershipBreakdown: ownership,
    sizeBreakdown: size,
    focusBreakdown: focus,
    stateBreakdown: states,
    cityBreakdown: cities,
    industryBreakdown: industries,
    topState: sortedStates[0] ? { name: sortedStates[0][0], count: sortedStates[0][1] } : null,
    topCity: sortedCities[0] ? { name: sortedCities[0][0], count: sortedCities[0][1] } : null,
    uniqueStates: Object.keys(states).length,
    uniqueCities: Object.keys(cities).length,
    publicCount: (ownership['Public'] || 0) + (ownership['Co-op'] || 0),
    privateCount: (ownership['Private'] || 0),
    majorCount: (size['Major'] || 0) + (size['Major/Studio'] || 0) + (ownership['Major Studio'] || 0) + (ownership['Major Label'] || 0) + (ownership['Major Network'] || 0),
    indieCount: (size['Indie/Notable'] || 0) + (ownership['Independent'] || 0),
  };
}

export function ProductionKPICards({ data, columns }: ProductionKPICardsProps) {
  const metrics = useMemo(() => computeMetrics(data), [data]);

  const publicPct = metrics.totalCompanies > 0 ? Math.round((metrics.publicCount / metrics.totalCompanies) * 100) : 0;
  const privatePct = metrics.totalCompanies > 0 ? Math.round((metrics.privateCount / metrics.totalCompanies) * 100) : 0;
  const majorPct = metrics.totalCompanies > 0 ? Math.round((metrics.majorCount / metrics.totalCompanies) * 100) : 0;
  const indiePct = metrics.totalCompanies > 0 ? Math.round((metrics.indieCount / metrics.totalCompanies) * 100) : 0;
  const topStatePct = metrics.totalCompanies > 0 && metrics.topState
    ? Math.round((metrics.topState.count / metrics.totalCompanies) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Row 1: Hero + stat grid */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero */}
        <div className="col-span-12 md:col-span-4 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 dot-grid opacity-[0.08]" />
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-3">Total Companies</p>
            <p className="text-6xl font-black tracking-tight text-white leading-none">
              {metrics.totalCompanies}
            </p>
            <p className="text-sm text-white/50 mt-1 tabular-nums">production companies tracked</p>
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50 font-medium">States</p>
                <p className="text-xl font-bold text-white">{metrics.uniqueStates}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-medium">Cities</p>
                <p className="text-xl font-bold text-white">{metrics.uniqueCities}</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-5 right-5 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Factory className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* 8 mini stats */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Public" value={metrics.publicCount} note={`${publicPct}% of total`} icon={Globe2} accent="teal" />
          <StatTile label="Private" value={metrics.privateCount} note={`${privatePct}% of total`} icon={Shield} accent="purple" />
          <StatTile label="Major Studios" value={metrics.majorCount} note={`${majorPct}% of total`} icon={Crown} accent="amber" />
          <StatTile label="Indie / Notable" value={metrics.indieCount} note={`${indiePct}% of total`} icon={Star} accent="rose" />
          <StatTile label="Top State" value={metrics.topState?.name || '—'} note={`${metrics.topState?.count || 0} companies`} icon={MapPin} accent="amber" />
          <StatTile label="Top City" value={metrics.topCity?.name || '—'} note={`${metrics.topCity?.count || 0} companies`} icon={Building2} accent="teal" />
          <StatTile label="State Coverage" value={`${topStatePct}%`} note={`in ${metrics.topState?.name || '—'}`} icon={TrendingUp} accent="rose" />
          <StatTile label="Focus Areas" value={Object.keys(metrics.focusBreakdown).length} note={Object.keys(metrics.focusBreakdown).join(', ').slice(0, 30)} icon={Briefcase} accent="indigo" />
        </div>
      </div>

      {/* Row 2: Breakdowns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BreakdownPanel
          title="Ownership Type"
          entries={Object.entries(metrics.ownershipBreakdown).sort((a, b) => b[1] - a[1])}
          total={metrics.totalCompanies}
          colorFn={(i) => ['bg-chart-teal', 'bg-chart-purple', 'bg-chart-amber', 'bg-chart-rose'][i % 4]}
        />
        <BreakdownPanel
          title="Size Bracket"
          entries={Object.entries(metrics.sizeBreakdown).sort((a, b) => b[1] - a[1])}
          total={metrics.totalCompanies}
          colorFn={(i) => ['bg-chart-amber', 'bg-chart-rose', 'bg-chart-purple', 'bg-chart-teal'][i % 4]}
        />
        <BreakdownPanel
          title="Geographic Distribution"
          entries={Object.entries(metrics.stateBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 8)}
          total={metrics.totalCompanies}
          colorFn={(i) => ['bg-blue-500', 'bg-chart-teal', 'bg-chart-purple', 'bg-chart-amber'][i % 4]}
        />
      </div>
    </div>
  );
}

// Sub-components

function StatTile({ label, value, note, icon: Icon, accent }: {
  label: string;
  value: string | number;
  note?: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: 'teal' | 'purple' | 'amber' | 'rose' | 'indigo';
}) {
  const palettes = {
    teal:   'text-chart-teal   bg-chart-teal/10   border-chart-teal/20',
    purple: 'text-chart-purple bg-chart-purple/10 border-chart-purple/20',
    amber:  'text-chart-amber  bg-chart-amber/10  border-chart-amber/20',
    rose:   'text-chart-rose   bg-chart-rose/10   border-chart-rose/20',
    indigo: 'text-primary      bg-primary/10      border-primary/20',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col justify-between gap-3 group hover:border-primary/20 transition-all duration-200 hover:shadow-[0_0_16px_hsl(243_80%_62%/0.08)]">
      <div className="flex items-start justify-between">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide leading-tight max-w-[70%]">{label}</p>
        <div className={cn('p-1.5 rounded-lg border shrink-0', palettes[accent])}>
          <Icon className="w-3 h-3" />
        </div>
      </div>
      <div>
        <p className="text-2xl font-black tabular-nums text-foreground leading-none">{value}</p>
        {note && <p className="text-[10px] text-muted-foreground mt-1 truncate">{note}</p>}
      </div>
    </div>
  );
}

function BreakdownPanel({ title, entries, total, colorFn }: {
  title: string;
  entries: [string, number][];
  total: number;
  colorFn: (i: number) => string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">{title}</p>
      {entries.map(([label, count], i) => {
        const pct = total > 0 ? (count / total) * 100 : 0;
        return (
          <div key={label} className="flex items-center gap-3 py-1.5">
            <span className="text-[10px] font-bold text-muted-foreground w-4 text-right shrink-0">{i + 1}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-foreground truncate pr-2">{label}</span>
                <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                  {count} <span className="text-muted-foreground font-normal">({pct.toFixed(0)}%)</span>
                </span>
              </div>
              <div className="h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all duration-700', colorFn(i))}
                  style={{ width: `${Math.max(pct, 2)}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
      {entries.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-4">No data available</p>
      )}
    </div>
  );
}
