import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { Target, MapPin, Zap, Users, Shield, Briefcase, TrendingUp, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: Record<string, unknown>[];
  columns: { name: string }[];
}

const JURISDICTION_COLORS = [
  'hsl(var(--chart-amber))',
  'hsl(var(--chart-rose))',
  'hsl(var(--chart-purple))',
  'hsl(var(--chart-teal))',
  'hsl(var(--chart-blue))',
  'hsl(var(--chart-green))',
];

function extract(row: Record<string, unknown>) {
  return {
    state: ((row['HQ State'] || row['State'] || row['state']) as string) || '',
    name: ((row['Union Name'] || row['Organization'] || row['Name'] || row['Company Name'] || row['Company']) as string) || '',
    members: Number(row['Member Count'] || row['Members'] || row['Membership'] || row['Total Members'] || 0),
    jurisdiction: ((row['Jurisdiction'] || row['Trade'] || row['Craft'] || row['Type'] || row['Industry'] || row['Sector']) as string) || 'General',
    localNumber: ((row['Local Number'] || row['Local'] || row['Chapter']) as string) || '',
    city: ((row['HQ City'] || row['City'] || row['city']) as string) || '',
    affiliation: ((row['Affiliation'] || row['Parent Union'] || row['Federation']) as string) || '',
  };
}

export function UnionAcquisitionDashboard({ data }: Props) {
  const analysis = useMemo(() => {
    const byState: Record<string, { unions: number; totalMembers: number; jurisdictions: Set<string> }> = {};
    const byJurisdiction: Record<string, { count: number; members: number; states: Record<string, number> }> = {};
    const byAffiliation: Record<string, number> = {};
    const stateJurisdiction: Record<string, Record<string, number>> = {};
    let totalMembers = 0;

    for (const row of data) {
      const { state, members, jurisdiction, affiliation } = extract(row);

      totalMembers += members;

      if (state) {
        if (!byState[state]) byState[state] = { unions: 0, totalMembers: 0, jurisdictions: new Set() };
        byState[state].unions++;
        byState[state].totalMembers += members;
        byState[state].jurisdictions.add(jurisdiction);

        if (!stateJurisdiction[state]) stateJurisdiction[state] = {};
        stateJurisdiction[state][jurisdiction] = (stateJurisdiction[state][jurisdiction] || 0) + 1;
      }

      if (!byJurisdiction[jurisdiction]) byJurisdiction[jurisdiction] = { count: 0, members: 0, states: {} };
      byJurisdiction[jurisdiction].count++;
      byJurisdiction[jurisdiction].members += members;
      if (state) byJurisdiction[jurisdiction].states[state] = (byJurisdiction[jurisdiction].states[state] || 0) + 1;

      if (affiliation) byAffiliation[affiliation] = (byAffiliation[affiliation] || 0) + 1;
    }

    // Engagement opportunity: states with many unions = high engagement potential
    const maxUnions = Math.max(...Object.values(byState).map(s => s.unions), 1);
    const engagementStates = Object.entries(byState)
      .map(([state, info]) => ({
        state,
        unions: info.unions,
        totalMembers: info.totalMembers,
        jurisdictionCount: info.jurisdictions.size,
        engagementScore: Math.round((info.unions / maxUnions) * 100),
        avgMembers: info.unions > 0 ? Math.round(info.totalMembers / info.unions) : 0,
      }))
      .sort((a, b) => b.engagementScore - a.engagementScore);

    // Untapped: states with few unions but some member presence
    const untapped = engagementStates
      .filter(s => s.unions <= 3 && s.jurisdictionCount >= 1)
      .sort((a, b) => b.totalMembers - a.totalMembers)
      .slice(0, 6);

    const sortedJurisdictions = Object.entries(byJurisdiction).sort((a, b) => b[1].count - a[1].count);
    const sortedAffiliations = Object.entries(byAffiliation).sort((a, b) => b[1] - a[1]);

    // Top jurisdictions for pie chart
    const jurisdictionPieData = sortedJurisdictions.slice(0, 6).map(([name, info]) => ({
      name, value: info.count,
    }));

    // Geographic hotspot: stacked bar by jurisdiction per state
    const allJurisdictions = [...new Set(sortedJurisdictions.slice(0, 5).map(([j]) => j))];
    const hotspotData = Object.entries(stateJurisdiction)
      .map(([state, jurisdictions]) => ({
        state,
        ...jurisdictions,
        total: Object.values(jurisdictions).reduce((a, b) => a + b, 0),
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    return {
      engagementStates,
      sortedJurisdictions,
      sortedAffiliations,
      jurisdictionPieData,
      hotspotData,
      allJurisdictions,
      untapped,
      total: data.length,
      totalMembers,
      stateCount: Object.keys(byState).length,
      jurisdictionCount: Object.keys(byJurisdiction).length,
    };
  }, [data]);

  const scoreBg = (score: number) =>
    score >= 70 ? 'bg-chart-teal/10' : score >= 40 ? 'bg-chart-amber/10' : 'bg-chart-rose/10';
  const scoreColor = (score: number) =>
    score >= 70 ? 'text-chart-teal' : score >= 40 ? 'text-chart-amber' : 'text-chart-rose';

  return (
    <div className="space-y-8">
      {/* ── Hero KPIs ── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Unions', value: analysis.total, icon: Shield, color: 'text-chart-amber' },
          { label: 'Total Members', value: analysis.totalMembers, icon: Users, color: 'text-chart-teal' },
          { label: 'States Covered', value: analysis.stateCount, icon: Globe, color: 'text-chart-blue' },
          { label: 'Jurisdictions', value: analysis.jurisdictionCount, icon: Briefcase, color: 'text-chart-purple' },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{kpi.label}</span>
            </div>
            <span className="text-2xl font-black tabular-nums text-foreground">{kpi.value.toLocaleString()}</span>
          </div>
        ))}
      </section>

      {/* ── Section: Engagement Opportunity Matrix ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-amber" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Engagement Opportunity Matrix</h2>
          <span className="text-[10px] text-muted-foreground ml-auto">Higher score = more union density for outreach</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {analysis.engagementStates.slice(0, 15).map((s) => (
            <div key={s.state} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{s.state}</span>
                </div>
                <span className={cn('text-lg font-black tabular-nums', scoreColor(s.engagementScore))}>{s.engagementScore}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{s.unions} unions · {s.totalMembers.toLocaleString()} members</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500')}
                  style={{
                    width: `${Math.max(s.engagementScore, 5)}%`,
                    background: s.engagementScore >= 70 ? 'hsl(var(--chart-teal))' : s.engagementScore >= 40 ? 'hsl(var(--chart-amber))' : 'hsl(var(--chart-rose))',
                  }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{s.jurisdictionCount} jurisdictions</span>
                <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">avg {s.avgMembers.toLocaleString()} members</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Jurisdiction Segmentation ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-purple" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Jurisdiction Segmentation</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pie chart */}
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={analysis.jurisdictionPieData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                  {analysis.jurisdictionPieData.map((_, i) => (
                    <Cell key={i} fill={JURISDICTION_COLORS[i % JURISDICTION_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-2 mt-2">
              {analysis.jurisdictionPieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: JURISDICTION_COLORS[i % JURISDICTION_COLORS.length] }} />
                  <span className="text-[10px] text-muted-foreground">{d.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {analysis.sortedJurisdictions.slice(0, 6).map(([jurisdiction, info], i) => {
              const pct = analysis.total > 0 ? Math.round((info.count / analysis.total) * 100) : 0;
              const topStates = Object.entries(info.states).sort((a, b) => b[1] - a[1]).slice(0, 3);
              return (
                <div key={jurisdiction} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-bold text-foreground">{jurisdiction}</span>
                    </div>
                    <span className="text-2xl font-black tabular-nums text-foreground">{info.count}</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{
                      width: `${pct}%`,
                      background: JURISDICTION_COLORS[i % JURISDICTION_COLORS.length],
                    }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {pct}% of total · {info.members.toLocaleString()} members · {Object.keys(info.states).length} states
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {topStates.map(([st, c]) => (
                      <span key={st} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{st}: {c}</span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Affiliations */}
        {analysis.sortedAffiliations.length > 0 && (
          <>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">By Affiliation / Federation</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {analysis.sortedAffiliations.slice(0, 8).map(([name, count]) => {
                const pct = analysis.total > 0 ? Math.round((count / analysis.total) * 100) : 0;
                return (
                  <div key={name} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Shield className="w-3 h-3 text-muted-foreground" />
                      <span className="text-lg font-black tabular-nums text-foreground">{count}</span>
                    </div>
                    <p className="text-xs font-medium text-foreground truncate" title={name}>{name}</p>
                    <p className="text-[10px] text-muted-foreground">{pct}% share</p>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Section: Geographic Hotspots ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-teal" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Geographic Hotspots</h2>
        </div>
        <div className="rounded-xl border border-border bg-card p-5">
          <ResponsiveContainer width="100%" height={Math.max(300, analysis.hotspotData.length * 32)}>
            <BarChart data={analysis.hotspotData} layout="vertical" margin={{ left: 60, right: 20, top: 5, bottom: 5 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis type="category" dataKey="state" tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }} width={55} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: 12 }}
                labelStyle={{ fontWeight: 700 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {analysis.allJurisdictions.map((j, i) => (
                <Bar key={j} dataKey={j} stackId="a" fill={JURISDICTION_COLORS[i % JURISDICTION_COLORS.length]}
                  radius={i === analysis.allJurisdictions.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Untapped Markets */}
        {analysis.untapped.length > 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-chart-amber/40 bg-chart-amber/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-chart-amber" />
              <p className="text-xs font-bold text-chart-amber">Emerging Markets</p>
              <span className="text-[10px] text-muted-foreground">Low union count, potential for new partnerships</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.untapped.map(s => (
                <div key={s.state} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-foreground">{s.state}</span>
                  <span className="text-[10px] text-muted-foreground">{s.unions} unions · {s.totalMembers.toLocaleString()} members</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
