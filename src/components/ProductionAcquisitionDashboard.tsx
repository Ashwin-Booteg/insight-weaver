import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';
import { Target, Layers, TrendingUp, MapPin, Zap, Building2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  data: Record<string, unknown>[];
  columns: { name: string }[];
}

const INDUSTRY_COLORS: Record<string, string> = {
  Movie: 'hsl(var(--chart-rose))',
  Music: 'hsl(var(--chart-purple))',
  Fashion: 'hsl(var(--chart-amber))',
};
const INDUSTRY_KEYS = ['Movie', 'Music', 'Fashion'];

function extract(row: Record<string, unknown>) {
  return {
    state: ((row['HQ State'] || row['State']) as string) || '',
    type: ((row['Company Type'] || row['Ownership']) as string) || 'Unknown',
    industry: ((row['Industry']) as string) || '',
    specialty: ((row['Focus'] || row['Specialty']) as string) || '',
    company: ((row['Company Name'] || row['Company']) as string) || '',
    city: ((row['HQ City'] || row['City']) as string) || '',
  };
}

export function ProductionAcquisitionDashboard({ data }: Props) {
  const analysis = useMemo(() => {
    const byState: Record<string, { total: number; types: Record<string, number>; industries: Set<string> }> = {};
    const byType: Record<string, { count: number; states: Record<string, number> }> = {};
    const bySpecialty: Record<string, number> = {};
    const stateIndustry: Record<string, Record<string, number>> = {};

    for (const row of data) {
      const { state, type, industry, specialty } = extract(row);
      if (state) {
        if (!byState[state]) byState[state] = { total: 0, types: {}, industries: new Set() };
        byState[state].total++;
        byState[state].types[type] = (byState[state].types[type] || 0) + 1;
        if (industry) byState[state].industries.add(industry);

        if (!stateIndustry[state]) stateIndustry[state] = {};
        if (industry) stateIndustry[state][industry] = (stateIndustry[state][industry] || 0) + 1;
      }
      if (!byType[type]) byType[type] = { count: 0, states: {} };
      byType[type].count++;
      if (state) byType[type].states[state] = (byType[type].states[state] || 0) + 1;

      if (specialty) bySpecialty[specialty] = (bySpecialty[specialty] || 0) + 1;
    }

    const maxCount = Math.max(...Object.values(byState).map(s => s.total), 1);
    const opportunityStates = Object.entries(byState)
      .map(([state, info]) => ({
        state,
        total: info.total,
        types: info.types,
        industryCount: info.industries.size,
        score: Math.round(100 - (info.total / maxCount) * 100),
      }))
      .sort((a, b) => b.score - a.score);

    const sortedTypes = Object.entries(byType).sort((a, b) => b[1].count - a[1].count);
    const sortedSpecialties = Object.entries(bySpecialty).sort((a, b) => b[1] - a[1]);

    // Geographic hotspot chart data
    const hotspotData = Object.entries(stateIndustry)
      .map(([state, inds]) => ({ state, ...inds, total: Object.values(inds).reduce((a, b) => a + b, 0) }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 15);

    // Untapped markets: low company count but multiple industries
    const untapped = opportunityStates
      .filter(s => s.industryCount >= 2 && s.total <= 5)
      .slice(0, 5);

    return { opportunityStates, sortedTypes, sortedSpecialties, hotspotData, untapped, total: data.length };
  }, [data]);

  const scoreColor = (score: number) =>
    score >= 80 ? 'text-chart-teal' : score >= 50 ? 'text-chart-amber' : 'text-chart-rose';
  const scoreBg = (score: number) =>
    score >= 80 ? 'bg-chart-teal/10' : score >= 50 ? 'bg-chart-amber/10' : 'bg-chart-rose/10';

  return (
    <div className="space-y-8">
      {/* ── Section: Acquisition Opportunity Matrix ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-teal" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Acquisition Opportunity Matrix</h2>
          <span className="text-[10px] text-muted-foreground ml-auto">Higher score = less saturated market</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {analysis.opportunityStates.slice(0, 15).map((s) => (
            <div key={s.state} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{s.state}</span>
                </div>
                <span className={cn('text-lg font-black tabular-nums', scoreColor(s.score))}>{s.score}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{s.total} companies · {s.industryCount} industries</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className={cn('h-full rounded-full transition-all duration-500', scoreBg(s.score))}
                  style={{ width: `${Math.max(s.score, 5)}%`, background: s.score >= 80 ? 'hsl(var(--chart-teal))' : s.score >= 50 ? 'hsl(var(--chart-amber))' : 'hsl(var(--chart-rose))' }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(s.types).slice(0, 3).map(([t, c]) => (
                  <span key={t} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{t}: {c}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Target Segmentation ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-purple" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Target Segmentation</h2>
        </div>

        {/* By Company Type */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">By Company Type</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {analysis.sortedTypes.map(([type, info], i) => {
            const pct = analysis.total > 0 ? Math.round((info.count / analysis.total) * 100) : 0;
            const topStates = Object.entries(info.states).sort((a, b) => b[1] - a[1]).slice(0, 3);
            const colors = ['bg-chart-rose', 'bg-chart-purple', 'bg-chart-amber', 'bg-chart-teal'];
            return (
              <div key={type} className="rounded-xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-bold text-foreground">{type}</span>
                  </div>
                  <span className="text-2xl font-black tabular-nums text-foreground">{info.count}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', colors[i % 4])} style={{ width: `${pct}%` }} />
                </div>
                <p className="text-[11px] text-muted-foreground">{pct}% of total · {Object.keys(info.states).length} states</p>
                <div className="flex flex-wrap gap-1">
                  {topStates.map(([st, c]) => (
                    <span key={st} className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{st}: {c}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* By Specialty */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">By Specialty</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {analysis.sortedSpecialties.slice(0, 12).map(([spec, count], i) => {
            const pct = analysis.total > 0 ? Math.round((count / analysis.total) * 100) : 0;
            return (
              <div key={spec} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Layers className="w-3 h-3 text-muted-foreground" />
                  <span className="text-lg font-black tabular-nums text-foreground">{count}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate" title={spec}>{spec}</p>
                <p className="text-[10px] text-muted-foreground">{pct}% share</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section: Geographic Hotspots ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-amber" />
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
              {INDUSTRY_KEYS.map(ind => (
                <Bar key={ind} dataKey={ind} stackId="a" fill={INDUSTRY_COLORS[ind]} radius={ind === 'Fashion' ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Untapped Markets */}
        {analysis.untapped.length > 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-chart-teal/40 bg-chart-teal/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-chart-teal" />
              <p className="text-xs font-bold text-chart-teal">Untapped Markets</p>
              <span className="text-[10px] text-muted-foreground">Low density, multi-industry presence</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.untapped.map(s => (
                <div key={s.state} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-foreground">{s.state}</span>
                  <span className="text-[10px] text-muted-foreground">{s.total} cos · {s.industryCount} ind</span>
                  <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded-full', scoreBg(s.score), scoreColor(s.score))}>
                    {s.score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
