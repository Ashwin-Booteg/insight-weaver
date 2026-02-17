import React, { useState } from 'react';
import { Users, MapPin, Globe2, TrendingUp, TrendingDown, Briefcase, Factory, BarChart3, Percent, Hash } from 'lucide-react';
import { ExtendedKPIData, IndustryCategory } from '@/types/filters';
import { GeographyProfile, getLocationName, getRegionColors } from '@/types/geography';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ExtendedKPICardsProps {
  data: ExtendedKPIData;
  showPercentages?: boolean;
  profile?: GeographyProfile;
}

export function ExtendedKPICards({ data, showPercentages = false, profile }: ExtendedKPICardsProps) {
  const [displayMode, setDisplayMode] = useState<'absolute' | 'percent'>('absolute');
  const locationLabel = profile?.locationLabel || 'States';
  const regionLabel = profile?.regionLabel || 'Regions';
  const totalRegions = profile ? Object.keys(profile.regions).length : 4;
  const regionColors = profile ? getRegionColors(profile) : {};

  return (
    <div className="space-y-6">
      {/* Mode Toggle */}
      <div className="flex items-center justify-end gap-2">
        <span className="text-sm text-muted-foreground">Display:</span>
        <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
          <Button variant="ghost" size="sm" onClick={() => setDisplayMode('absolute')}
            className={cn('h-7 px-3 text-xs', displayMode === 'absolute' && 'bg-card shadow-sm')}>
            <Hash className="w-3 h-3 mr-1" /> Count
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDisplayMode('percent')}
            className={cn('h-7 px-3 text-xs', displayMode === 'percent' && 'bg-card shadow-sm')}>
            <Percent className="w-3 h-3 mr-1" /> Share
          </Button>
        </div>
      </div>

      {/* Hero KPI */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-chart-purple rounded-3xl p-8 text-primary-foreground shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Total People (Selected Roles)</p>
            <p className="text-6xl font-black mt-2 tracking-tight drop-shadow-lg">{data.totalPeople.toLocaleString()}</p>
            <p className="text-sm mt-2 opacity-70">
              Across {data.statesIncluded} {locationLabel.toLowerCase()} • {data.roleCoverage} roles selected
            </p>
          </div>
          <div className="p-5 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg"><Users className="w-10 h-10" /></div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title={`${locationLabel} Included`} value={data.statesIncluded} icon={MapPin} variant="teal" />
        <KPICard title={`${regionLabel} Included`} value={data.regionsIncluded} icon={Globe2} variant="purple"
          subtitle={`of ${totalRegions} ${regionLabel.toLowerCase()}`} />
        <KPICard title={`Avg per ${locationLabel.replace(/s$/, '')}`} value={data.avgPeoplePerState} icon={BarChart3} variant="amber" />
        <KPICard title="Role Coverage" value={data.roleCoverage} icon={Briefcase} variant="rose" subtitle="roles selected" />
      </div>

      {/* Top/Bottom & Roles */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.topStateByPeople && (
          <HighlightCard title={`Top ${locationLabel.replace(/s$/, '')}`}
            primary={profile ? getLocationName(data.topStateByPeople.state, profile) : data.topStateByPeople.state}
            secondary={`${data.topStateByPeople.count.toLocaleString()} people`}
            icon={<TrendingUp className="w-4 h-4 text-chart-emerald" />} accentColor="emerald" />
        )}
        {data.bottomStateByPeople && (
          <HighlightCard title={`Bottom ${locationLabel.replace(/s$/, '')}`}
            primary={profile ? getLocationName(data.bottomStateByPeople.state, profile) : data.bottomStateByPeople.state}
            secondary={`${data.bottomStateByPeople.count.toLocaleString()} people`}
            icon={<TrendingDown className="w-4 h-4 text-chart-rose" />} accentColor="rose" />
        )}
        {data.topRoleByPeople && (
          <HighlightCard title="Top Role" primary={truncate(data.topRoleByPeople.role, 25)}
            secondary={`${data.topRoleByPeople.count.toLocaleString()} people`}
            icon={<Briefcase className="w-4 h-4 text-chart-purple" />} accentColor="purple" />
        )}
        {data.topIndustryByPeople && (
          <HighlightCard title="Top Industry" primary={data.topIndustryByPeople.industry}
            secondary={`${data.topIndustryByPeople.count.toLocaleString()} people`}
            icon={<Factory className="w-4 h-4 text-chart-amber" />} accentColor="amber" />
        )}
      </div>

      {/* Industry & Region Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="chart-container">
          <h3 className="text-sm font-bold text-foreground mb-3">Industry Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(data.industryBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([industry, count]) => {
                const percent = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
                return (
                  <div key={industry} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{industry}</span>
                        <span className="text-sm font-medium">
                          {displayMode === 'percent' ? `${percent.toFixed(1)}%` : count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full transition-all",
                          industry === 'Movie & Entertainment' && "bg-chart-rose",
                          industry === 'Music & Audio' && "bg-chart-purple",
                          industry === 'Fashion & Apparel' && "bg-chart-amber"
                        )} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="chart-container">
          <h3 className="text-sm font-bold text-foreground mb-3">{regionLabel} Breakdown</h3>
          <div className="space-y-2">
            {Object.entries(data.regionBreakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([region, count], idx) => {
                const percent = data.totalPeople > 0 ? (count / data.totalPeople) * 100 : 0;
                const color = regionColors[region];
                return (
                  <div key={region} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">{region}</span>
                        <span className="text-sm font-medium">
                          {displayMode === 'percent' ? `${percent.toFixed(1)}%` : count.toLocaleString()}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: color || 'hsl(var(--primary))' }} />
                      </div>
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

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'teal' | 'purple' | 'amber' | 'rose';
  subtitle?: string;
}

function KPICard({ title, value, icon: Icon, variant, subtitle }: KPICardProps) {
  const variantClasses = {
    primary: 'from-primary to-primary/80 text-primary-foreground',
    teal: 'from-chart-teal to-chart-teal/80 text-white',
    purple: 'from-chart-purple to-chart-purple/80 text-white',
    amber: 'from-chart-amber to-chart-amber/80 text-white',
    rose: 'from-chart-rose to-chart-rose/80 text-white'
  };

  return (
    <div className={cn("relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br shadow-lg", variantClasses[variant])}>
      <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide opacity-80">{title}</p>
          <p className="text-2xl font-black mt-1">{value.toLocaleString()}</p>
          {subtitle && <p className="text-xs opacity-70 mt-0.5">{subtitle}</p>}
        </div>
        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm"><Icon className="w-5 h-5" /></div>
      </div>
    </div>
  );
}

interface HighlightCardProps {
  title: string;
  primary: string;
  secondary: string;
  icon: React.ReactNode;
  accentColor: 'emerald' | 'rose' | 'purple' | 'amber';
}

function HighlightCard({ title, primary, secondary, icon, accentColor }: HighlightCardProps) {
  const borderColors = {
    emerald: 'border-l-chart-emerald', rose: 'border-l-chart-rose',
    purple: 'border-l-chart-purple', amber: 'border-l-chart-amber'
  };
  return (
    <div className={cn("p-4 rounded-xl bg-card border border-border border-l-4 shadow-sm", borderColors[accentColor])}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs text-muted-foreground uppercase tracking-wide">{title}</span>
      </div>
      <p className="text-lg font-bold truncate" title={primary}>{primary}</p>
      <p className="text-sm text-muted-foreground">{secondary}</p>
    </div>
  );
}

function truncate(str: string, length: number): string {
  return str.length > length ? str.slice(0, length) + '...' : str;
}
