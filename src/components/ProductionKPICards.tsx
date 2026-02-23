import React, { useMemo } from 'react';
import {
  Factory, MapPin, Building2, Shield, Briefcase,
  Globe2, TrendingUp, Star, Crown, Film, Music, Shirt,
  BarChart3, Target, Layers, PieChart, Landmark, Sparkles
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
  bottomState: { name: string; count: number } | null;
  uniqueStates: number;
  uniqueCities: number;
  publicCount: number;
  privateCount: number;
  majorCount: number;
  indieCount: number;
  // Production-specific
  avgCompaniesPerState: number;
  stateConcentration: number; // top 3 states hold X% of companies
  industryHHI: number; // Herfindahl index for industry diversity (0-100, 100=diverse)
  topIndustry: { name: string; count: number; pct: number } | null;
  specialtyCount: number;
  marketLeaderPct: number; // % held by dominant ownership type
}

function computeMetrics(data: Record<string, unknown>[]): CompanyMetrics {
  const ownership: Record<string, number> = {};
  const size: Record<string, number> = {};
  const focus: Record<string, number> = {};
  const states: Record<string, number> = {};
  const cities: Record<string, number> = {};
  const industries: Record<string, number> = {};

  for (const row of data) {
    const own = (row['Ownership'] as string) || (row['Company Type'] as string) || 'Unknown';
    ownership[own] = (ownership[own] || 0) + 1;

    const sz = (row['Size bracket'] as string) || '';
    if (sz) size[sz] = (size[sz] || 0) + 1;

    const foc = (row['Focus'] as string) || (row['Specialty'] as string) || '';
    if (foc) focus[foc] = (focus[foc] || 0) + 1;

    const st = (row['HQ State'] as string) || (row['State'] as string) || '';
    if (st) states[st] = (states[st] || 0) + 1;

    const city = (row['HQ City'] as string) || (row['City'] as string) || '';
    if (city) cities[city] = (cities[city] || 0) + 1;

    const ind = (row['Industry'] as string) || '';
    if (ind) industries[ind] = (industries[ind] || 0) + 1;
  }

  const total = data.length;
  const sortedStates = Object.entries(states).sort((a, b) => b[1] - a[1]);
  const sortedCities = Object.entries(cities).sort((a, b) => b[1] - a[1]);
  const sortedIndustries = Object.entries(industries).sort((a, b) => b[1] - a[1]);
  const sortedOwnership = Object.entries(ownership).sort((a, b) => b[1] - a[1]);

  // State concentration: top 3 states
  const top3Total = sortedStates.slice(0, 3).reduce((s, [, c]) => s + c, 0);
  const stateConcentration = total > 0 ? Math.round((top3Total / total) * 100) : 0;

  // Industry HHI (inverted → diversity score)
  const indTotal = Object.values(industries).reduce((a, b) => a + b, 0);
  const hhi = indTotal > 0
    ? Object.values(industries).reduce((sum, v) => sum + Math.pow(v / indTotal, 2), 0)
    : 0;
  const industryHHI = Math.round((1 - hhi) * 100);

  const topInd = sortedIndustries[0];
  const marketLeader = sortedOwnership[0];

  const publicCount = (ownership['Public'] || 0) + (ownership['Co-op'] || 0);
  const privateCount = ownership['Private'] || 0;
  const majorCount = (size['Major'] || 0) + (size['Major/Studio'] || 0) + (ownership['Major Studio'] || 0) + (ownership['Major Label'] || 0) + (ownership['Major Network'] || 0);
  const indieCount = (size['Indie/Notable'] || 0) + (ownership['Independent'] || 0);

  return {
    totalCompanies: total,
    ownershipBreakdown: ownership,
    sizeBreakdown: size,
    focusBreakdown: focus,
    stateBreakdown: states,
    cityBreakdown: cities,
    industryBreakdown: industries,
    topState: sortedStates[0] ? { name: sortedStates[0][0], count: sortedStates[0][1] } : null,
    topCity: sortedCities[0] ? { name: sortedCities[0][0], count: sortedCities[0][1] } : null,
    bottomState: sortedStates.length > 1 ? { name: sortedStates[sortedStates.length - 1][0], count: sortedStates[sortedStates.length - 1][1] } : null,
    uniqueStates: Object.keys(states).length,
    uniqueCities: Object.keys(cities).length,
    publicCount, privateCount, majorCount, indieCount,
    avgCompaniesPerState: Object.keys(states).length > 0 ? Math.round(total / Object.keys(states).length) : 0,
    stateConcentration,
    industryHHI,
    topIndustry: topInd ? { name: topInd[0], count: topInd[1], pct: total > 0 ? Math.round((topInd[1] / total) * 100) : 0 } : null,
    specialtyCount: Object.keys(focus).length,
    marketLeaderPct: marketLeader && total > 0 ? Math.round((marketLeader[1] / total) * 100) : 0,
  };
}

const INDUSTRY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'Movie': Film, 'Music': Music, 'Fashion': Shirt,
};

export function ProductionKPICards({ data, columns }: ProductionKPICardsProps) {
  const m = useMemo(() => computeMetrics(data), [data]);

  const majorPct = m.totalCompanies > 0 ? Math.round((m.majorCount / m.totalCompanies) * 100) : 0;
  const indiePct = m.totalCompanies > 0 ? Math.round((m.indieCount / m.totalCompanies) * 100) : 0;

  const sortedIndustries = Object.entries(m.industryBreakdown).sort((a, b) => b[1] - a[1]);
  const sortedOwnership = Object.entries(m.ownershipBreakdown).sort((a, b) => b[1] - a[1]);
  const sortedStates = Object.entries(m.stateBreakdown).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      {/* ── Row 1: Hero + Industry breakdown ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero */}
        <div className="col-span-12 md:col-span-4 relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
          <div className="absolute inset-0 dot-grid opacity-[0.08]" />
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-3">Total Companies</p>
            <p className="text-6xl font-black tracking-tight text-white leading-none">
              {m.totalCompanies}
            </p>
            <p className="text-sm text-white/50 mt-1 tabular-nums">across {m.uniqueStates} states & {m.uniqueCities} cities</p>
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-3 gap-3">
              <div>
                <p className="text-[10px] text-white/50 font-medium">Industries</p>
                <p className="text-xl font-bold text-white">{sortedIndustries.length}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-medium">Specialties</p>
                <p className="text-xl font-bold text-white">{m.specialtyCount}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-medium">Avg/State</p>
                <p className="text-xl font-bold text-white">{m.avgCompaniesPerState}</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-5 right-5 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Factory className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* Industry Cards — one per industry with donut-style visual */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {sortedIndustries.slice(0, 3).map(([industry, count], i) => {
            const pct = m.totalCompanies > 0 ? Math.round((count / m.totalCompanies) * 100) : 0;
            const colors = [
              { ring: 'border-chart-rose', text: 'text-chart-rose', bg: 'bg-chart-rose/10', bar: 'bg-chart-rose' },
              { ring: 'border-chart-purple', text: 'text-chart-purple', bg: 'bg-chart-purple/10', bar: 'bg-chart-purple' },
              { ring: 'border-chart-amber', text: 'text-chart-amber', bg: 'bg-chart-amber/10', bar: 'bg-chart-amber' },
            ][i];
            const IconComp = Object.entries(INDUSTRY_ICONS).find(([k]) => industry.toLowerCase().includes(k.toLowerCase()))?.[1] || Briefcase;
            return (
              <div key={industry} className="rounded-xl border border-border bg-card p-5 flex flex-col justify-between gap-4">
                <div className="flex items-start justify-between">
                  <div className={cn('p-2 rounded-xl border', colors.bg, colors.ring)}>
                    <IconComp className={cn('w-4 h-4', colors.text)} />
                  </div>
                  <span className={cn('text-3xl font-black tabular-nums', colors.text)}>{pct}%</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{industry}</p>
                  <p className="text-[11px] text-muted-foreground">{count} companies</p>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full transition-all duration-700', colors.bar)} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Row 2: Intelligence Gauges ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <GaugeCard
          label="State Concentration"
          value={`${m.stateConcentration}%`}
          sub={`Top 3 states hold ${m.stateConcentration}% of companies`}
          fill={m.stateConcentration}
          icon={Target}
          color="rose"
        />
        <GaugeCard
          label="Industry Diversity"
          value={`${m.industryHHI}`}
          sub="Score out of 100 (higher = more diverse)"
          fill={m.industryHHI}
          icon={Layers}
          color="teal"
        />
        <GaugeCard
          label="Major vs Indie"
          value={`${majorPct}/${indiePct}`}
          sub={`${m.majorCount} major · ${m.indieCount} indie`}
          fill={majorPct}
          icon={Crown}
          color="amber"
        />
        <GaugeCard
          label="Market Leader"
          value={`${m.marketLeaderPct}%`}
          sub={`${sortedOwnership[0]?.[0] || '—'} dominates ownership`}
          fill={m.marketLeaderPct}
          icon={Sparkles}
          color="purple"
        />
      </div>

      {/* ── Row 3: Highlight Picks ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <HighlightPick
          title="Top State"
          primary={m.topState?.name || '—'}
          secondary={`${m.topState?.count || 0} companies`}
          badge={m.topState && m.totalCompanies > 0 ? `${Math.round((m.topState.count / m.totalCompanies) * 100)}%` : '—'}
          trend="up"
        />
        <HighlightPick
          title="Top City"
          primary={m.topCity?.name || '—'}
          secondary={`${m.topCity?.count || 0} companies`}
          badge={m.topCity && m.totalCompanies > 0 ? `${Math.round((m.topCity.count / m.totalCompanies) * 100)}%` : '—'}
          trend="up"
        />
        <HighlightPick
          title="Top Industry"
          primary={m.topIndustry?.name || '—'}
          secondary={`${m.topIndustry?.count || 0} companies`}
          badge={`${m.topIndustry?.pct || 0}%`}
          trend="neutral"
        />
        <HighlightPick
          title="Least Served State"
          primary={m.bottomState?.name || '—'}
          secondary={`${m.bottomState?.count || 0} companies`}
          badge="lowest"
          trend="down"
        />
      </div>

      {/* ── Row 4: Side-by-side breakdowns ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <BreakdownPanel
          title="Ownership Type"
          entries={sortedOwnership}
          total={m.totalCompanies}
          colorFn={(i) => ['bg-chart-teal', 'bg-chart-purple', 'bg-chart-amber', 'bg-chart-rose'][i % 4]}
        />
        <BreakdownPanel
          title="Geographic Distribution"
          entries={sortedStates.slice(0, 10)}
          total={m.totalCompanies}
          colorFn={(i) => {
            const hue = 210 + i * 15;
            return '';
          }}
          barStyleFn={(i) => ({ background: `hsl(${210 + i * 15} 65% ${55 - i * 2}%)` })}
        />
        <BreakdownPanel
          title="Specialty / Focus"
          entries={Object.entries(m.focusBreakdown).sort((a, b) => b[1] - a[1]).slice(0, 10)}
          total={m.totalCompanies}
          colorFn={(i) => ['bg-chart-amber', 'bg-chart-rose', 'bg-chart-purple', 'bg-chart-teal'][i % 4]}
        />
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function GaugeCard({ label, value, sub, fill, icon: Icon, color }: {
  label: string; value: string; sub: string; fill: number;
  icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  const palettes: Record<string, { icon: string; bar: string }> = {
    rose:   { icon: 'text-chart-rose bg-chart-rose/10 border-chart-rose/20', bar: 'bg-chart-rose' },
    teal:   { icon: 'text-chart-teal bg-chart-teal/10 border-chart-teal/20', bar: 'bg-chart-teal' },
    amber:  { icon: 'text-chart-amber bg-chart-amber/10 border-chart-amber/20', bar: 'bg-chart-amber' },
    purple: { icon: 'text-chart-purple bg-chart-purple/10 border-chart-purple/20', bar: 'bg-chart-purple' },
  };
  const p = palettes[color] || palettes.teal;
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={cn('p-1.5 rounded-lg border', p.icon)}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <p className="text-2xl font-black tabular-nums text-foreground leading-none">{value}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold text-foreground/80">{label}</p>
        <p className="text-[10px] text-muted-foreground leading-snug">{sub}</p>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', p.bar)}
          style={{ width: `${Math.min(100, Math.max(2, fill))}%` }} />
      </div>
    </div>
  );
}

function HighlightPick({ title, primary, secondary, badge, trend }: {
  title: string; primary: string; secondary: string; badge: string;
  trend: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2">
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      <p className="text-lg font-black text-foreground leading-tight truncate">{primary}</p>
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-muted-foreground">{secondary}</p>
        <span className={cn(
          'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
          trend === 'up' ? 'bg-chart-teal/10 text-chart-teal' :
          trend === 'down' ? 'bg-chart-rose/10 text-chart-rose' :
          'bg-muted text-muted-foreground'
        )}>{badge}</span>
      </div>
    </div>
  );
}

function BreakdownPanel({ title, entries, total, colorFn, barStyleFn }: {
  title: string;
  entries: [string, number][];
  total: number;
  colorFn: (i: number) => string;
  barStyleFn?: (i: number) => React.CSSProperties;
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
                  style={{ width: `${Math.max(pct, 2)}%`, ...(barStyleFn ? barStyleFn(i) : {}) }}
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
