import React, { useState } from 'react';
import { Users, MapPin, Globe2, TrendingUp, TrendingDown, Briefcase, Factory, BarChart3, Percent, Hash, Target, Crosshair, Layers, Activity, Zap } from 'lucide-react';
import { ExtendedKPIData, IndustryCategory } from '@/types/filters';
import { GeographyProfile, getLocationName, getRegionColors } from '@/types/geography';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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

  return (
    <div className="space-y-5">
      {/* Hero + 4 KPIs in one row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Hero KPI */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/90 via-primary to-accent/80 p-6 text-white">
          <div className="absolute inset-0 dot-grid opacity-10" />
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <p className="text-[11px] font-semibold uppercase tracking-widest opacity-70 mb-2">Total People</p>
            <p className="text-5xl font-black tracking-tight">{data.totalPeople.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-2">
              {data.statesIncluded} {locationLabel.toLowerCase()} · {data.roleCoverage} roles selected
            </p>
          </div>
          <div className="absolute bottom-4 right-4 p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* 4 small KPIs */}
        <div className="lg:col-span-3 grid grid-cols-2 gap-4">
          <MiniKPI label={`${locationLabel}`} value={data.statesIncluded} icon={MapPin} accent="teal" />
          <MiniKPI label={regionLabel} value={data.regionsIncluded} icon={Globe2} accent="purple" note={`of ${totalRegions}`} />
          <MiniKPI label={`Avg / ${locationLabel.replace(/s$/, '')}`} value={data.avgPeoplePerState} icon={BarChart3} accent="amber" />
          <MiniKPI label="Roles Selected" value={data.roleCoverage} icon={Briefcase} accent="rose" />
        </div>
      </div>

      {/* Targeting Intelligence */}
      {targetingMetrics && (
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
            <Crosshair className="w-3.5 h-3.5 text-primary" /> Targeting Intelligence
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <IntelCard label="Concentration" value={`${targetingMetrics.concentrationIndex}%`} desc={`Top 3 hold ${targetingMetrics.concentrationIndex}%`} icon={Target} color="rose" />
            <IntelCard label="Diversity Score" value={`${targetingMetrics.diversityScore}%`} desc="Distribution evenness" icon={Layers} color="teal" />
            <IntelCard label="Avg per Role" value={targetingMetrics.avgPerRole.toLocaleString()} desc="People per role" icon={Activity} color="purple" />
            <IntelCard label="Top 5 Share" value={`${targetingMetrics.top5Share}%`} desc="Of total workforce" icon={Zap} color="amber" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <MapPin className="w-3 h-3 text-chart-teal" /> Top {locationLabel}
              </p>
              <div className="space-y-2">
                {targetingMetrics.top3Locations.map((loc, i) => (
                  <div key={loc} className="flex items-center gap-2.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      i === 0 ? "bg-chart-amber/20 text-chart-amber" : i === 1 ? "bg-muted text-muted-foreground" : "bg-chart-rose/10 text-chart-rose"
                    )}>{i + 1}</span>
                    <span className="text-xs font-medium text-foreground">{loc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                <Briefcase className="w-3 h-3 text-chart-purple" /> Top Roles
              </p>
              <div className="space-y-2">
                {targetingMetrics.top5Roles.map((role, i) => (
                  <div key={role} className="flex items-center gap-2.5">
                    <span className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                      i === 0 ? "bg-chart-amber/20 text-chart-amber" : i === 1 ? "bg-muted text-muted-foreground" : "bg-chart-rose/10 text-chart-rose"
                    )}>{i + 1}</span>
                    <span className="text-xs font-medium text-foreground truncate">{role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Highlight row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.topStateByPeople && (
          <HighlightCard title={`Top ${locationLabel.replace(/s$/, '')}`}
            primary={profile ? getLocationName(data.topStateByPeople.state, profile) : data.topStateByPeople.state}
            secondary={data.topStateByPeople.count.toLocaleString()}
            icon={<TrendingUp className="w-3.5 h-3.5 text-chart-emerald" />} />
        )}
        {data.bottomStateByPeople && (
          <HighlightCard title={`Lowest ${locationLabel.replace(/s$/, '')}`}
            primary={profile ? getLocationName(data.bottomStateByPeople.state, profile) : data.bottomStateByPeople.state}
            secondary={data.bottomStateByPeople.count.toLocaleString()}
            icon={<TrendingDown className="w-3.5 h-3.5 text-chart-rose" />} />
        )}
        {data.topRoleByPeople && (
          <HighlightCard title="Top Role"
            primary={truncate(data.topRoleByPeople.role, 22)}
            secondary={data.topRoleByPeople.count.toLocaleString()}
            icon={<Briefcase className="w-3.5 h-3.5 text-chart-purple" />} />
        )}
        {data.topIndustryByPeople && (
          <HighlightCard title="Top Industry"
            primary={data.topIndustryByPeople.industry}
            secondary={data.topIndustryByPeople.count.toLocaleString()}
            icon={<Factory className="w-3.5 h-3.5 text-chart-amber" />} />
        )}
      </div>

      {/* Breakdown bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-container">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Industry</p>
            <div className="flex items-center gap-1 p-0.5 bg-muted rounded-lg">
              <button onClick={() => setDisplayMode('absolute')}
                className={cn('px-2 py-0.5 text-[10px] font-medium rounded-md transition-all', displayMode === 'absolute' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                #
              </button>
              <button onClick={() => setDisplayMode('percent')}
                className={cn('px-2 py-0.5 text-[10px] font-medium rounded-md transition-all', displayMode === 'percent' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground')}>
                %
              </button>
            </div>
          </div>
          <div className="space-y-3">
            {Object.entries(data.industryBreakdown).sort((a, b) => b[1] - a[1]).map(([industry, count]) => {
              const pct = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
              return (
                <div key={industry}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{industry}</span>
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {displayMode === 'percent' ? `${pct.toFixed(1)}%` : count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className={cn('h-full rounded-full transition-all duration-500',
                      industry === 'Movie & Entertainment' ? 'bg-chart-rose' :
                      industry === 'Music & Audio' ? 'bg-chart-purple' : 'bg-chart-amber'
                    )} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="chart-container">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">{regionLabel}</p>
          <div className="space-y-3">
            {Object.entries(data.regionBreakdown).sort((a, b) => b[1] - a[1]).map(([region, count]) => {
              const pct = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
              const color = regionColors[region];
              return (
                <div key={region}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-foreground">{region}</span>
                    <span className="text-xs font-bold tabular-nums text-foreground">
                      {displayMode === 'percent' ? `${pct.toFixed(1)}%` : count.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color || 'hsl(var(--primary))' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniKPI({ label, value, icon: Icon, accent, note }: {
  label: string; value: number; icon: React.ComponentType<{ className?: string }>;
  accent: 'teal' | 'purple' | 'amber' | 'rose'; note?: string;
}) {
  const colors = {
    teal: 'text-chart-teal bg-chart-teal/10 border-chart-teal/20',
    purple: 'text-chart-purple bg-chart-purple/10 border-chart-purple/20',
    amber: 'text-chart-amber bg-chart-amber/10 border-chart-amber/20',
    rose: 'text-chart-rose bg-chart-rose/10 border-chart-rose/20',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4 flex items-start justify-between">
      <div>
        <p className="text-[11px] text-muted-foreground font-medium mb-1">{label}</p>
        <p className="text-2xl font-black tabular-nums text-foreground">{value.toLocaleString()}</p>
        {note && <p className="text-[11px] text-muted-foreground mt-0.5">{note}</p>}
      </div>
      <div className={cn('p-2 rounded-lg border', colors[accent])}>
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
}

function IntelCard({ label, value, desc, icon: Icon, color }: {
  label: string; value: string; desc: string; icon: React.ComponentType<{ className?: string }>; color: string;
}) {
  const colors: Record<string, string> = {
    rose: 'text-chart-rose bg-chart-rose/10 border-chart-rose/20',
    teal: 'text-chart-teal bg-chart-teal/10 border-chart-teal/20',
    purple: 'text-chart-purple bg-chart-purple/10 border-chart-purple/20',
    amber: 'text-chart-amber bg-chart-amber/10 border-chart-amber/20',
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className={cn('inline-flex p-1.5 rounded-lg border mb-3', colors[color])}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <p className="text-xl font-black text-foreground tabular-nums">{value}</p>
      <p className="text-[11px] font-semibold text-foreground/80 mt-0.5">{label}</p>
      <p className="text-[11px] text-muted-foreground">{desc}</p>
    </div>
  );
}

function HighlightCard({ title, primary, secondary, icon }: {
  title: string; primary: string; secondary: string; icon: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <span className="text-[11px] text-muted-foreground font-medium">{title}</span>
      </div>
      <p className="text-sm font-bold truncate text-foreground" title={primary}>{primary}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{secondary} people</p>
    </div>
  );
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '…' : str;
}
