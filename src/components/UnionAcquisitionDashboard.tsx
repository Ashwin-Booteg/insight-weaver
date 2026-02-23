import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { MapPin, Zap, Users, Shield, Briefcase, Globe } from 'lucide-react';
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

function detectColumns(data: Record<string, unknown>[]) {
  const fallback = { state: '', stateNormalized: '', movie: '__EMPTY', music: '__EMPTY_1', fashion: '__EMPTY_2', total: '__EMPTY_3', keyUnions: '__EMPTY_4', notes: '__EMPTY_5' };
  if (data.length === 0) return fallback;
  const keys = Object.keys(data[0]);

  // Find state column: the long name that doesn't have normalized/category suffix and isn't __EMPTY
  const stateCol = keys.find(k => !k.startsWith('__EMPTY') && !k.startsWith('_') && !k.includes('normalized') && !k.includes('category') && !k.toLowerCase().includes('movie') && !k.toLowerCase().includes('music') && !k.toLowerCase().includes('fashion')) || '';
  const stateNorm = keys.find(k => k.includes('normalized') && !k.startsWith('_')) || '_state_normalized';

  // For the numeric columns (movie/music/fashion/total), check all rows to find ones with numeric __EMPTY values
  // The __EMPTY columns hold Movie Unions, Music Unions, Fashion Unions, TOTAL
  // Try to detect by sampling: find a row where __EMPTY is numeric
  const sampleRow = data.find(r => {
    const v = r['__EMPTY'];
    return v !== undefined && v !== null && !isNaN(Number(v)) && Number(v) > 0;
  });

  if (sampleRow) {
    // __EMPTY columns are the numeric data columns - use them directly
    return {
      state: stateCol,
      stateNormalized: stateNorm,
      movie: '__EMPTY',
      music: '__EMPTY_1',
      fashion: '__EMPTY_2',
      total: '__EMPTY_3',
      keyUnions: '__EMPTY_4',
      notes: '__EMPTY_5',
    };
  }

  return { ...fallback, state: stateCol, stateNormalized: stateNorm };
}

export function UnionAcquisitionDashboard({ data }: Props) {
  const analysis = useMemo(() => {
    const cols = detectColumns(data);

    // Filter out header rows, summary rows, and invalid rows
    const validRows = data.filter(r => {
      const stateCode = (r[cols.stateNormalized] || '') as string;
      const stateVal = (r[cols.state] || '') as string;
      const totalVal = Number(r[cols.total] || 0);
      // Skip header rows (non-numeric total), summary rows like "GRAND TOTAL", empty state codes
      if (isNaN(totalVal) || totalVal <= 0) return false;
      if (stateVal.toLowerCase().includes('total') || stateVal.toLowerCase().includes('state')) return false;
      if (!stateCode && !stateVal) return false;
      // Must have a valid 2-letter state code or a state name
      if (stateCode && stateCode.length === 2) return true;
      if (stateVal && stateVal.length > 1) return true;
      return false;
    });


    // Deduplicate by state code (merged datasets may have duplicates)
    const stateMap: Record<string, {
      state: string; stateCode: string; movie: number; music: number; fashion: number;
      total: number; keyUnions: string; notes: string;
    }> = {};

    for (const row of validRows) {
      const state = (row[cols.state] || '') as string;
      const stateCode = (row[cols.stateNormalized] || '') as string;
      const movie = Number(row[cols.movie]) || 0;
      const music = Number(row[cols.music]) || 0;
      const fashion = Number(row[cols.fashion]) || 0;
      const total = Number(row[cols.total]) || (movie + music + fashion);
      const keyUnions = (row[cols.keyUnions] || '') as string;
      const notes = (row[cols.notes] || '') as string;

      if (total === 0) continue;

      const key = stateCode || state;
      if (!stateMap[key] || total > stateMap[key].total) {
        stateMap[key] = { state, stateCode, movie, music, fashion, total, keyUnions, notes };
      }
    }

    const stateData = Object.values(stateMap);
    let grandTotalUnions = 0, totalMovie = 0, totalMusic = 0, totalFashion = 0;
    for (const s of stateData) {
      grandTotalUnions += s.total;
      totalMovie += s.movie;
      totalMusic += s.music;
      totalFashion += s.fashion;
    }

    // Sort by total descending for engagement
    const sortedByTotal = [...stateData].sort((a, b) => b.total - a.total);
    const maxTotal = sortedByTotal.length > 0 ? sortedByTotal[0].total : 1;

    // Engagement score: higher total = higher engagement potential
    const engagementStates = sortedByTotal.map(s => ({
      ...s,
      engagementScore: Math.round((s.total / maxTotal) * 100),
      industryCount: [s.movie > 0, s.music > 0, s.fashion > 0].filter(Boolean).length,
    }));

    // Untapped: low total but multi-industry
    const untapped = [...stateData]
      .filter(s => s.total <= 10 && [s.movie > 0, s.music > 0, s.fashion > 0].filter(Boolean).length >= 2)
      .sort((a, b) => b.total - a.total)
      .slice(0, 6);

    // Industry pie
    const industryPie = [
      { name: 'Movie', value: totalMovie },
      { name: 'Music', value: totalMusic },
      { name: 'Fashion', value: totalFashion },
    ].filter(d => d.value > 0);

    // Hotspot chart data (top 15 states)
    const hotspotData = sortedByTotal.slice(0, 15).map(s => ({
      state: s.stateCode || s.state,
      Movie: s.movie,
      Music: s.music,
      Fashion: s.fashion,
      total: s.total,
    }));

    // Key unions extraction: find unique union names across all rows
    const unionMentions: Record<string, number> = {};
    for (const s of stateData) {
      if (s.keyUnions) {
        const parts = s.keyUnions.split(/[,;]/).map(u => u.trim()).filter(Boolean);
        for (const u of parts) {
          // Normalize: take just the base name (e.g., "IATSE 479" -> "IATSE")
          const base = u.replace(/\s*\d+.*$/, '').trim();
          if (base) unionMentions[base] = (unionMentions[base] || 0) + 1;
        }
      }
    }
    const topUnions = Object.entries(unionMentions).sort((a, b) => b[1] - a[1]).slice(0, 10);

    return {
      engagementStates,
      industryPie,
      hotspotData,
      untapped,
      topUnions,
      grandTotalUnions,
      totalMovie,
      totalMusic,
      totalFashion,
      stateCount: stateData.length,
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
          { label: 'Total Union Locals', value: analysis.grandTotalUnions, icon: Shield, color: 'text-chart-amber' },
          { label: 'Movie Unions', value: analysis.totalMovie, icon: Users, color: 'text-chart-rose' },
          { label: 'Music Unions', value: analysis.totalMusic, icon: Users, color: 'text-chart-purple' },
          { label: 'Fashion Unions', value: analysis.totalFashion, icon: Users, color: 'text-chart-amber' },
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

      <section className="grid grid-cols-2 sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-chart-blue" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">States Covered</span>
          </div>
          <span className="text-2xl font-black tabular-nums text-foreground">{analysis.stateCount}</span>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-chart-teal" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Avg Unions / State</span>
          </div>
          <span className="text-2xl font-black tabular-nums text-foreground">
            {analysis.stateCount > 0 ? Math.round(analysis.grandTotalUnions / analysis.stateCount) : 0}
          </span>
        </div>
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
            <div key={s.stateCode || s.state} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-2 hover:border-primary/30 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-muted-foreground" />
                  <span className="text-sm font-bold text-foreground">{s.stateCode || s.state}</span>
                </div>
                <span className={cn('text-lg font-black tabular-nums', scoreColor(s.engagementScore))}>{s.engagementScore}</span>
              </div>
              <p className="text-[11px] text-muted-foreground">{s.total} unions · {s.industryCount} industries</p>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${Math.max(s.engagementScore, 5)}%`,
                    background: s.engagementScore >= 70 ? 'hsl(var(--chart-teal))' : s.engagementScore >= 40 ? 'hsl(var(--chart-amber))' : 'hsl(var(--chart-rose))',
                  }} />
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {s.movie > 0 && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">🎬 {s.movie}</span>}
                {s.music > 0 && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">🎵 {s.music}</span>}
                {s.fashion > 0 && <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">👗 {s.fashion}</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section: Industry Breakdown ── */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-1 h-4 rounded-full bg-chart-purple" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Union Coverage by Industry</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Pie chart */}
          <div className="rounded-xl border border-border bg-card p-5 lg:col-span-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Distribution</p>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={analysis.industryPie} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={40} paddingAngle={2} strokeWidth={0}>
                  {analysis.industryPie.map((entry) => (
                    <Cell key={entry.name} fill={INDUSTRY_COLORS[entry.name] || 'hsl(var(--muted))'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex flex-wrap gap-3 mt-2 justify-center">
              {analysis.industryPie.map((d) => (
                <div key={d.name} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: INDUSTRY_COLORS[d.name] }} />
                  <span className="text-[10px] text-muted-foreground">{d.name}: {d.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Industry cards */}
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { name: 'Movie', count: analysis.totalMovie, icon: '🎬', color: 'border-chart-rose/30' },
              { name: 'Music', count: analysis.totalMusic, icon: '🎵', color: 'border-chart-purple/30' },
              { name: 'Fashion', count: analysis.totalFashion, icon: '👗', color: 'border-chart-amber/30' },
            ].map((ind) => {
              const pct = analysis.grandTotalUnions > 0 ? Math.round((ind.count / analysis.grandTotalUnions) * 100) : 0;
              return (
                <div key={ind.name} className={cn("rounded-xl border bg-card p-4 space-y-3", ind.color)}>
                  <div className="flex items-start justify-between">
                    <span className="text-2xl">{ind.icon}</span>
                    <span className="text-3xl font-black tabular-nums text-foreground">{ind.count}</span>
                  </div>
                  <p className="text-sm font-bold text-foreground">{ind.name} Unions</p>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: INDUSTRY_COLORS[ind.name] }} />
                  </div>
                  <p className="text-[11px] text-muted-foreground">{pct}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Key Unions Presence ── */}
      {analysis.topUnions.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-4 rounded-full bg-chart-rose" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Top National Unions</h2>
            <span className="text-[10px] text-muted-foreground ml-auto">By state presence</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {analysis.topUnions.map(([name, count]) => (
              <div key={name} className="rounded-xl border border-border bg-card p-3 flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Shield className="w-3 h-3 text-muted-foreground" />
                  <span className="text-lg font-black tabular-nums text-foreground">{count}</span>
                </div>
                <p className="text-xs font-medium text-foreground truncate" title={name}>{name}</p>
                <p className="text-[10px] text-muted-foreground">{count} states</p>
              </div>
            ))}
          </div>
        </section>
      )}

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
              <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '0.75rem', fontSize: 12 }} labelStyle={{ fontWeight: 700 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {INDUSTRY_KEYS.map((ind, i) => (
                <Bar key={ind} dataKey={ind} stackId="a" fill={INDUSTRY_COLORS[ind]}
                  radius={i === INDUSTRY_KEYS.length - 1 ? [0, 4, 4, 0] : [0, 0, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Emerging Markets */}
        {analysis.untapped.length > 0 && (
          <div className="mt-4 rounded-xl border border-dashed border-chart-amber/40 bg-chart-amber/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4 text-chart-amber" />
              <p className="text-xs font-bold text-chart-amber">Emerging Markets</p>
              <span className="text-[10px] text-muted-foreground">Low union count, multi-industry presence</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {analysis.untapped.map(s => (
                <div key={s.stateCode || s.state} className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2">
                  <span className="text-sm font-bold text-foreground">{s.stateCode || s.state}</span>
                  <span className="text-[10px] text-muted-foreground">{s.total} unions</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
