import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Factory, Users, Award, Film, Music, Shirt, MapPin, Briefcase } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { RoleMetadata, OrgSector, IndustryCategory, ExtendedKPIData, classifyRoleSector, classifyRoleIndustry } from '@/types/filters';
import { GeographyProfile, getRegionFromLocation, getLocationName } from '@/types/geography';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface SectorDashboardSectionsProps {
  roleMetadata: RoleMetadata[];
  filteredData: Record<string, unknown>[];
  columns: { name: string; type: string; isState?: boolean }[];
  effectiveSelectedRoles: string[];
  profile: GeographyProfile;
  extendedKPIs: ExtendedKPIData;
}

const SECTOR_CONFIG: Record<OrgSector, { icon: React.ElementType; color: string; gradient: string }> = {
  'Production Companies': { icon: Factory, color: 'hsl(var(--chart-blue))', gradient: 'from-blue-500/10 to-blue-600/5' },
  'Unions': { icon: Users, color: 'hsl(var(--chart-amber))', gradient: 'from-amber-500/10 to-amber-600/5' },
  'Guilds & Associations': { icon: Award, color: 'hsl(var(--chart-purple))', gradient: 'from-purple-500/10 to-purple-600/5' },
};

const INDUSTRY_ICONS: Record<IndustryCategory, React.ElementType> = {
  'Movie & Entertainment': Film,
  'Music & Audio': Music,
  'Fashion & Apparel': Shirt,
};

export function SectorDashboardSections({
  roleMetadata, filteredData, columns, effectiveSelectedRoles, profile, extendedKPIs
}: SectorDashboardSectionsProps) {
  const sectors: OrgSector[] = ['Production Companies', 'Unions', 'Guilds & Associations'];

  const stateColumn = useMemo(() => columns.find(c => c.isState), [columns]);

  // Compute per-sector data
  const sectorData = useMemo(() => {
    const selectedSet = new Set(effectiveSelectedRoles);
    const result: Record<OrgSector, {
      totalPeople: number;
      roles: { name: string; count: number }[];
      regionBreakdown: Record<string, number>;
      industryBreakdown: Record<IndustryCategory, number>;
      topLocation: { name: string; count: number } | null;
    }> = {} as any;

    for (const sector of sectors) {
      const sectorRoles = roleMetadata.filter(r => r.sector === sector && selectedSet.has(r.columnName));
      const roleNames = new Set(sectorRoles.map(r => r.columnName));

      let totalPeople = 0;
      const roleTotals: Record<string, number> = {};
      const regionTotals: Record<string, number> = {};
      const locationTotals: Record<string, number> = {};
      const industryTotals: Record<IndustryCategory, number> = {
        'Movie & Entertainment': 0, 'Music & Audio': 0, 'Fashion & Apparel': 0
      };

      for (const rn of Object.keys(profile.regions)) regionTotals[rn] = 0;

      for (const row of filteredData) {
        const stateValue = stateColumn
          ? (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string
          : null;

        for (const roleName of roleNames) {
          const value = row[roleName];
          if (typeof value === 'number' && !isNaN(value)) {
            totalPeople += value;
            roleTotals[roleName] = (roleTotals[roleName] || 0) + value;
            industryTotals[classifyRoleIndustry(roleName)] += value;

            if (stateValue) {
              locationTotals[stateValue] = (locationTotals[stateValue] || 0) + value;
              const region = getRegionFromLocation(stateValue, profile);
              if (region && regionTotals[region] !== undefined) {
                regionTotals[region] += value;
              }
            }
          }
        }
      }

      const sortedRoles = Object.entries(roleTotals)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([name, count]) => ({ name, count }));

      const sortedLocations = Object.entries(locationTotals).sort((a, b) => b[1] - a[1]);
      const topLoc = sortedLocations[0]
        ? { name: getLocationName(sortedLocations[0][0], profile), count: sortedLocations[0][1] }
        : null;

      result[sector] = { totalPeople, roles: sortedRoles, regionBreakdown: regionTotals, industryBreakdown: industryTotals, topLocation: topLoc };
    }
    return result;
  }, [roleMetadata, filteredData, effectiveSelectedRoles, stateColumn, profile, sectors]);

  return (
    <section className="mb-6 space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-4 rounded-full bg-accent" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sector Breakdown</h2>
      </div>
      {sectors.map(sector => (
        <SectorSection
          key={sector}
          sector={sector}
          data={sectorData[sector]}
          roleMetadata={roleMetadata}
          profile={profile}
        />
      ))}
    </section>
  );
}

function SectorSection({
  sector, data, roleMetadata, profile
}: {
  sector: OrgSector;
  data: { totalPeople: number; roles: { name: string; count: number }[]; regionBreakdown: Record<string, number>; industryBreakdown: Record<string, number>; topLocation: { name: string; count: number } | null };
  roleMetadata: RoleMetadata[];
  profile: GeographyProfile;
}) {
  const [open, setOpen] = useState(true);
  const config = SECTOR_CONFIG[sector];
  const Icon = config.icon;
  const sectorRoleCount = roleMetadata.filter(r => r.sector === sector).length;

  const regionData = useMemo(() => {
    return Object.entries(data.regionBreakdown)
      .filter(([, v]) => v > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [data.regionBreakdown]);

  const topRole = data.roles[0];

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className={cn("chart-container p-0 overflow-hidden", !open && "pb-0")}>
        <CollapsibleTrigger className="w-full">
          <div className={cn("flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors", `bg-gradient-to-r ${config.gradient}`)}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${config.color}20` }}>
                <Icon className="w-4 h-4" style={{ color: config.color }} />
              </div>
              <div className="text-left">
                <h3 className="text-sm font-bold text-foreground">{sector}</h3>
                <p className="text-xs text-muted-foreground">{sectorRoleCount} roles · {data.totalPeople.toLocaleString()} people</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {data.totalPeople > 0 && (
                <div className="flex items-center gap-4 mr-4">
                  {topRole && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Role</p>
                      <p className="text-xs font-semibold text-foreground truncate max-w-[140px]">{topRole.name}</p>
                    </div>
                  )}
                  {data.topLocation && (
                    <div className="text-right hidden sm:block">
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Location</p>
                      <p className="text-xs font-semibold text-foreground">{data.topLocation.name}</p>
                    </div>
                  )}
                </div>
              )}
              {open ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          {data.totalPeople === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">No roles matched for this sector in the current dataset.</div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Mini KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <MiniKPI label="Total People" value={data.totalPeople.toLocaleString()} icon={Users} />
                <MiniKPI label="Roles" value={sectorRoleCount.toString()} icon={Briefcase} />
                {topRole && <MiniKPI label="Top Role" value={topRole.name} sub={topRole.count.toLocaleString()} icon={Award} />}
                {data.topLocation && <MiniKPI label="Top Location" value={data.topLocation.name} sub={data.topLocation.count.toLocaleString()} icon={MapPin} />}
              </div>

              {/* Production Companies: show industry split */}
              {sector === 'Production Companies' && (
                <div className="flex items-center gap-3 flex-wrap">
                  {(['Movie & Entertainment', 'Music & Audio', 'Fashion & Apparel'] as IndustryCategory[]).map(ind => {
                    const IndIcon = INDUSTRY_ICONS[ind];
                    const count = data.industryBreakdown[ind] || 0;
                    const pct = data.totalPeople > 0 ? ((count / data.totalPeople) * 100).toFixed(1) : '0';
                    return (
                      <Badge key={ind} variant="secondary" className="gap-1.5 text-xs py-1 px-2.5">
                        <IndIcon className="w-3 h-3" />
                        {ind.split(' ')[0]}: {count.toLocaleString()} ({pct}%)
                      </Badge>
                    );
                  })}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Top Roles Bar Chart */}
                {data.roles.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Top Roles</h4>
                    <ResponsiveContainer width="100%" height={Math.max(200, data.roles.length * 28)}>
                      <BarChart data={data.roles} layout="vertical" margin={{ left: 120, right: 16, top: 4, bottom: 4 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={110} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number) => [value.toLocaleString(), 'People']}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {data.roles.map((_, i) => (
                            <Cell key={i} fill={config.color} fillOpacity={1 - i * 0.06} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Region Breakdown */}
                {regionData.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">{profile.regionLabel || 'Region'} Breakdown</h4>
                    <ResponsiveContainer width="100%" height={Math.max(200, regionData.length * 28)}>
                      <BarChart data={regionData} layout="vertical" margin={{ left: 100, right: 16, top: 4, bottom: 4 }}>
                        <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={90} />
                        <Tooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                          formatter={(value: number) => [value.toLocaleString(), 'People']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} fill={config.color} fillOpacity={0.7} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

function MiniKPI({ label, value, sub, icon: Icon }: { label: string; value: string; sub?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className="w-3 h-3 text-muted-foreground" />
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-sm font-bold text-foreground truncate">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
