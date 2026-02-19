import React, { useState } from 'react';
import {
  Users, MapPin, Globe2, TrendingUp, TrendingDown, Briefcase, Factory,
  BarChart3, Target, Crosshair, Layers, Activity, Zap, ArrowUpRight,
  ArrowDownRight, Minus, Star, Award, PieChart, Hash
} from 'lucide-react';
import { ExtendedKPIData, IndustryCategory } from '@/types/filters';
import { GeographyProfile, getLocationName, getRegionColors } from '@/types/geography';
import { cn } from '@/lib/utils';

interface TargetingMetrics {
  concentrationIndex: number;
  avgPerRole: number;
  diversityScore: number;
  top5Share: number;
  topIndustryShare: number;
  top3Locations: string[];
  top5Roles: string[];
}

interface ExtendedKPICardsProps {
  data: ExtendedKPIData;
  showPercentages?: boolean;
  profile?: GeographyProfile;
  targetingMetrics?: TargetingMetrics;
}

export function ExtendedKPICards({ data, profile, targetingMetrics }: ExtendedKPICardsProps) {
  const [displayMode, setDisplayMode] = useState<'absolute' | 'percent'>('absolute');
  const locationLabel = profile?.locationLabel || 'Countries';
  const regionLabel = profile?.regionLabel || 'Regions';
  const totalRegions = profile ? Object.keys(profile.regions).length : 4;
  const regionColors = profile ? getRegionColors(profile) : {};

  // Derived metrics
  const sortedStateEntries = Object.entries(data.stateBreakdown).sort((a, b) => b[1] - a[1]);
  const topStatePct = data.totalPeople > 0 && sortedStateEntries[0]
    ? ((sortedStateEntries[0][1] / data.totalPeople) * 100).toFixed(1)
    : '0';

  const sortedRoleEntries = Object.entries(data.roleBreakdown).sort((a, b) => b[1] - a[1]);
  const topRolePct = data.totalPeople > 0 && sortedRoleEntries[0]
    ? ((sortedRoleEntries[0][1] / data.totalPeople) * 100).toFixed(1)
    : '0';

  const industryEntries = Object.entries(data.industryBreakdown).sort((a, b) => b[1] - a[1]);
  const dominantIndustry = industryEntries[0];
  const dominantPct = data.totalPeople > 0 && dominantIndustry
    ? ((dominantIndustry[1] / data.totalPeople) * 100).toFixed(1)
    : '0';

  // Gini-like concentration: top 10% of locations hold X% of workforce
  const top10Pct = Math.ceil(sortedStateEntries.length * 0.1);
  const top10Total = sortedStateEntries.slice(0, top10Pct).reduce((s, [, v]) => s + v, 0);
  const giniProxy = data.totalPeople > 0 ? Math.round((top10Total / data.totalPeople) * 100) : 0;

  return (
    <div className="space-y-4">

      {/* ── Row 1: Hero + stat grid ── */}
      <div className="grid grid-cols-12 gap-4">
        {/* Hero */}
        <div className="col-span-12 md:col-span-4 relative overflow-hidden rounded-2xl p-6 hero-kpi">
          <div className="absolute inset-0 dot-grid opacity-[0.08]" />
          <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-white/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/60 mb-3">Total Workforce</p>
            <p className="text-6xl font-black tracking-tight text-white leading-none">
              {formatCompact(data.totalPeople)}
            </p>
            <p className="text-sm text-white/50 mt-1 tabular-nums">{data.totalPeople.toLocaleString()} people</p>
            <div className="mt-5 pt-4 border-t border-white/10 grid grid-cols-2 gap-3">
              <div>
                <p className="text-[10px] text-white/50 font-medium">{locationLabel}</p>
                <p className="text-xl font-bold text-white">{data.statesIncluded}</p>
              </div>
              <div>
                <p className="text-[10px] text-white/50 font-medium">Roles Active</p>
                <p className="text-xl font-bold text-white">{data.roleCoverage}</p>
              </div>
            </div>
          </div>
          <div className="absolute bottom-5 right-5 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm">
            <Users className="w-5 h-5 text-white" />
          </div>
        </div>

        {/* 8 mini stats */}
        <div className="col-span-12 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile
            label={regionLabel}
            value={data.regionsIncluded}
            note={`of ${totalRegions}`}
            icon={Globe2}
            accent="purple"
          />
          <StatTile
            label={`Avg / ${locationLabel.replace(/s$/, '')}`}
            value={formatCompact(data.avgPeoplePerState)}
            rawValue={data.avgPeoplePerState.toLocaleString()}
            icon={BarChart3}
            accent="teal"
          />
          <StatTile
            label="Top Location %"
            value={`${topStatePct}%`}
            note={data.topStateByPeople ? (profile ? getLocationName(data.topStateByPeople.state, profile) : data.topStateByPeople.state) : '—'}
            icon={MapPin}
            accent="amber"
          />
          <StatTile
            label="Top Role %"
            value={`${topRolePct}%`}
            note={data.topRoleByPeople ? truncate(data.topRoleByPeople.role, 16) : '—'}
            icon={Briefcase}
            accent="rose"
          />
          <StatTile
            label="Dominant Industry"
            value={`${dominantPct}%`}
            note={dominantIndustry ? dominantIndustry[0] : '—'}
            icon={Factory}
            accent="indigo"
          />
          <StatTile
            label="Market Leader"
            value={targetingMetrics ? `${targetingMetrics.topIndustryShare}%` : '—'}
            note="Top industry share"
            icon={Star}
            accent="amber"
          />
          <StatTile
            label="Top-10% Hold"
            value={`${giniProxy}%`}
            note={`${top10Pct} ${locationLabel.toLowerCase()}`}
            icon={PieChart}
            accent="rose"
          />
          <StatTile
            label="Diversity Index"
            value={targetingMetrics ? `${targetingMetrics.diversityScore}` : '—'}
            note="Out of 100"
            icon={Layers}
            accent="teal"
          />
        </div>
      </div>

      {/* ── Row 2: Intelligence cards + sparkbars ── */}
      {targetingMetrics && (
        <div className="grid grid-cols-12 gap-4">
          {/* Intel cards */}
          <div className="col-span-12 md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <IntelCard label="Concentration" value={`${targetingMetrics.concentrationIndex}%`} sub="Top 3 locations" icon={Target} color="rose" bar={targetingMetrics.concentrationIndex} />
            <IntelCard label="Diversity" value={`${targetingMetrics.diversityScore}`} sub="Spread evenness" icon={Layers} color="teal" bar={targetingMetrics.diversityScore} />
            <IntelCard label="Avg / Role" value={formatCompact(targetingMetrics.avgPerRole)} sub="People per role" icon={Activity} color="purple" bar={Math.min(100, (targetingMetrics.avgPerRole / 5000) * 100)} />
            <IntelCard label="Top 5 Share" value={`${targetingMetrics.top5Share}%`} sub="Top roles' weight" icon={Zap} color="amber" bar={targetingMetrics.top5Share} />
          </div>

          {/* Top 3 + Top 5 roles micro lists */}
          <div className="col-span-12 md:col-span-4 grid grid-cols-1 gap-3">
            <MicroList
              title={`Top ${locationLabel}`}
              icon={<MapPin className="w-3 h-3" />}
              items={targetingMetrics.top3Locations}
              colors={['text-chart-amber', 'text-muted-foreground', 'text-chart-rose']}
              bgs={['bg-chart-amber/10', 'bg-muted/50', 'bg-chart-rose/10']}
            />
          </div>
        </div>
      )}

      {/* ── Row 3: Highlight picks ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.topStateByPeople && (
          <HighlightCard
            title={`Best ${locationLabel.replace(/s$/, '')}`}
            primary={profile ? getLocationName(data.topStateByPeople.state, profile) : data.topStateByPeople.state}
            secondary={`${data.topStateByPeople.count.toLocaleString()} people`}
            badge={`${topStatePct}%`}
            trend="up"
          />
        )}
        {data.bottomStateByPeople && (
          <HighlightCard
            title={`Lowest ${locationLabel.replace(/s$/, '')}`}
            primary={profile ? getLocationName(data.bottomStateByPeople.state, profile) : data.bottomStateByPeople.state}
            secondary={`${data.bottomStateByPeople.count.toLocaleString()} people`}
            badge="last"
            trend="down"
          />
        )}
        {data.topRoleByPeople && (
          <HighlightCard
            title="Top Role"
            primary={truncate(data.topRoleByPeople.role, 20)}
            secondary={`${data.topRoleByPeople.count.toLocaleString()} people`}
            badge={`${topRolePct}%`}
            trend="up"
          />
        )}
        {data.topIndustryByPeople && (
          <HighlightCard
            title="Top Industry"
            primary={data.topIndustryByPeople.industry}
            secondary={`${data.topIndustryByPeople.count.toLocaleString()} people`}
            badge={`${dominantPct}%`}
            trend="neutral"
          />
        )}
      </div>

      {/* ── Row 4: Breakdown bars side-by-side ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Industry */}
        <div className="chart-container space-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Industry Split</p>
            <ModeSwitcher mode={displayMode} onChange={setDisplayMode} />
          </div>
          {industryEntries.map(([industry, count], i) => {
            const pct = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
            const barColor = industry === 'Movie & Entertainment' ? 'bg-chart-rose' :
              industry === 'Music & Audio' ? 'bg-chart-purple' : 'bg-chart-amber';
            return (
              <BreakdownRow
                key={industry}
                label={industry}
                value={displayMode === 'percent' ? `${pct.toFixed(1)}%` : formatCompact(count)}
                pct={pct}
                barColor={barColor}
                rank={i + 1}
              />
            );
          })}
        </div>

        {/* Region */}
        <div className="chart-container space-y-1">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{regionLabel} Split</p>
            <ModeSwitcher mode={displayMode} onChange={setDisplayMode} />
          </div>
          {Object.entries(data.regionBreakdown)
            .filter(([, v]) => v > 0)
            .sort((a, b) => b[1] - a[1])
            .map(([region, count], i) => {
              const pct = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
              const color = regionColors[region];
              return (
                <BreakdownRow
                  key={region}
                  label={region}
                  value={displayMode === 'percent' ? `${pct.toFixed(1)}%` : formatCompact(count)}
                  pct={pct}
                  barColorRaw={color}
                  rank={i + 1}
                />
              );
            })}
        </div>
      </div>

      {/* ── Row 5: Top roles mini bar chart ── */}
      {targetingMetrics && targetingMetrics.top5Roles.length > 0 && (
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Top Roles by Volume</p>
            <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-muted">Top {Math.min(10, sortedRoleEntries.length)}</span>
          </div>
          <div className="space-y-2">
            {sortedRoleEntries.slice(0, 10).map(([role, count], i) => {
              const pct = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
              const maxCount = sortedRoleEntries[0]?.[1] || 1;
              const relWidth = (count / maxCount) * 100;
              return (
                <div key={role} className="flex items-center gap-3 group">
                  <span className="text-[10px] font-bold text-muted-foreground w-5 text-right shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-foreground truncate pr-2">{role}</span>
                      <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                        {formatCompact(count)} <span className="text-muted-foreground font-normal">({pct.toFixed(1)}%)</span>
                      </span>
                    </div>
                    <div className="h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${relWidth}%`,
                          background: `hsl(${243 + i * 8} 70% ${60 - i * 3}%)`
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatTile({ label, value, note, rawValue, icon: Icon, accent }: {
  label: string;
  value: string | number;
  note?: string;
  rawValue?: string;
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
        <p className="text-2xl font-black tabular-nums text-foreground leading-none" title={rawValue}>{value}</p>
        {note && <p className="text-[10px] text-muted-foreground mt-1 truncate">{note}</p>}
      </div>
    </div>
  );
}

function IntelCard({ label, value, sub, icon: Icon, color, bar }: {
  label: string; value: string; sub: string;
  icon: React.ComponentType<{ className?: string }>; color: string; bar: number;
}) {
  const palettes: Record<string, string> = {
    rose:   'text-chart-rose   bg-chart-rose/10   border-chart-rose/20',
    teal:   'text-chart-teal   bg-chart-teal/10   border-chart-teal/20',
    purple: 'text-chart-purple bg-chart-purple/10 border-chart-purple/20',
    amber:  'text-chart-amber  bg-chart-amber/10  border-chart-amber/20',
  };
  const barColors: Record<string, string> = {
    rose: 'bg-chart-rose', teal: 'bg-chart-teal', purple: 'bg-chart-purple', amber: 'bg-chart-amber',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className={cn('inline-flex p-1.5 rounded-lg border w-fit', palettes[color])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <p className="text-2xl font-black text-foreground tabular-nums leading-none">{value}</p>
        <p className="text-[11px] font-semibold text-foreground/80 mt-1">{label}</p>
        <p className="text-[10px] text-muted-foreground">{sub}</p>
      </div>
      {/* mini progress */}
      <div className="h-0.5 bg-muted rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-700', barColors[color])}
          style={{ width: `${Math.min(100, Math.max(0, bar))}%` }} />
      </div>
    </div>
  );
}

function MicroList({ title, icon, items, colors, bgs }: {
  title: string; icon: React.ReactNode;
  items: string[]; colors: string[]; bgs: string[];
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
      </div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={item} className="flex items-center gap-2.5">
            <span className={cn('w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0', bgs[i] || 'bg-muted/50', colors[i] || 'text-muted-foreground')}>
              {i + 1}
            </span>
            <span className="text-xs font-medium text-foreground truncate">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HighlightCard({ title, primary, secondary, badge, trend }: {
  title: string; primary: string; secondary: string; badge: string; trend: 'up' | 'down' | 'neutral';
}) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : Minus;
  const trendColor = trend === 'up' ? 'text-chart-emerald bg-chart-emerald/10' : trend === 'down' ? 'text-chart-rose bg-chart-rose/10' : 'text-muted-foreground bg-muted';
  return (
    <div className="rounded-xl border border-border bg-card p-4 group hover:border-primary/20 transition-all duration-200">
      <div className="flex items-start justify-between mb-2">
        <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">{title}</p>
        <span className={cn('inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold', trendColor)}>
          <TrendIcon className="w-2.5 h-2.5" />{badge}
        </span>
      </div>
      <p className="text-sm font-bold truncate text-foreground" title={primary}>{primary}</p>
      <p className="text-[11px] text-muted-foreground mt-0.5">{secondary}</p>
    </div>
  );
}

function BreakdownRow({ label, value, pct, barColor, barColorRaw, rank }: {
  label: string; value: string; pct: number; barColor?: string; barColorRaw?: string; rank: number;
}) {
  return (
    <div className="space-y-1.5 py-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] font-bold text-muted-foreground w-4 shrink-0 text-right">{rank}</span>
          <span className="text-xs font-medium text-foreground truncate">{label}</span>
        </div>
        <span className="text-xs font-bold tabular-nums text-foreground shrink-0">{value}</span>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden ml-6">
        <div
          className={cn('h-full rounded-full transition-all duration-500', barColor)}
          style={{
            width: `${Math.min(100, pct)}%`,
            ...(barColorRaw ? { backgroundColor: barColorRaw } : {})
          }}
        />
      </div>
    </div>
  );
}

function ModeSwitcher({ mode, onChange }: { mode: 'absolute' | 'percent'; onChange: (m: 'absolute' | 'percent') => void }) {
  return (
    <div className="flex items-center gap-0.5 p-0.5 bg-muted rounded-lg">
      <button
        onClick={() => onChange('absolute')}
        className={cn('px-2 py-0.5 text-[10px] font-bold rounded-md transition-all', mode === 'absolute' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
      >#</button>
      <button
        onClick={() => onChange('percent')}
        className={cn('px-2 py-0.5 text-[10px] font-bold rounded-md transition-all', mode === 'percent' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground')}
      >%</button>
    </div>
  );
}

// ─── Utilities ─────────────────────────────────────────────────────────────────

function formatCompact(n: number | string): string {
  const num = typeof n === 'string' ? parseFloat(n) : n;
  if (isNaN(num)) return String(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}
