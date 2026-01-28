import React, { useState } from 'react';
import { StateMetric, DataColumn, FilterState } from '@/types/analytics';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Building2, Users, Target, MapPin } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const CHART_COLORS = [
  'hsl(224, 76%, 48%)',
  'hsl(168, 76%, 42%)',
  'hsl(38, 92%, 50%)',
  'hsl(346, 77%, 50%)',
  'hsl(262, 83%, 58%)',
  'hsl(160, 84%, 39%)',
];

interface StateDrilldownProps {
  stateCode: string | null;
  stateName: string | null;
  stateMetric: StateMetric | null;
  data: Record<string, unknown>[];
  columns: DataColumn[];
  onClose: () => void;
  onFilter: (stateCode: string) => void;
}

export function StateDrilldown({
  stateCode,
  stateName,
  stateMetric,
  data,
  columns,
  onClose,
  onFilter
}: StateDrilldownProps) {
  if (!stateCode || !stateMetric) return null;
  
  const stateColumn = columns.find(c => c.isState);
  const stateData = stateColumn
    ? data.filter(row => row[`${stateColumn.name}_normalized`] === stateCode)
    : [];
  
  const categoricalColumns = columns.filter(
    c => c.type === 'text' && !c.isState && !c.isCity && !c.isZip
  ).slice(0, 4);
  
  const getDistribution = (columnName: string) => {
    const counts: Record<string, number> = {};
    for (const row of stateData) {
      const value = String(row[columnName] || 'Unknown');
      counts[value] = (counts[value] || 0) + 1;
    }
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  };
  
  return (
    <Dialog open={!!stateCode} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto bg-card">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{stateName} ({stateCode})</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Detailed breakdown for this state
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onFilter(stateCode)}>
              <MapPin className="w-4 h-4 mr-2" />
              Filter to State
            </Button>
          </div>
        </DialogHeader>
        
        {/* State KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <StatKPI
            icon={Users}
            label="Records"
            value={stateMetric.value}
            subValue={`${stateMetric.percentage.toFixed(1)}% of total`}
          />
          <StatKPI
            icon={Target}
            label="ICP People"
            value={stateMetric.icpCount || 0}
            subValue={stateMetric.value > 0 ? `${((stateMetric.icpCount || 0) / stateMetric.value * 100).toFixed(1)}% ICP rate` : '-'}
          />
          <StatKPI
            icon={Building2}
            label="Companies"
            value={stateMetric.companyCount || 0}
          />
          <StatKPI
            icon={MapPin}
            label="Rank"
            value={`#${stateMetric.value}`}
            subValue="by record count"
          />
        </div>
        
        {/* Breakdown Charts */}
        {categoricalColumns.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold mb-4">Breakdowns</h4>
            <Tabs defaultValue={categoricalColumns[0]?.name}>
              <TabsList className="flex-wrap h-auto">
                {categoricalColumns.map((col) => (
                  <TabsTrigger key={col.name} value={col.name} className="text-xs">
                    {formatColumnName(col.name)}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {categoricalColumns.map((col) => (
                <TabsContent key={col.name} value={col.name} className="mt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h5 className="text-sm font-medium mb-4">Distribution</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={getDistribution(col.name)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis
                            dataKey="name"
                            type="category"
                            width={80}
                            tick={{ fontSize: 10 }}
                            tickFormatter={(v) => v.length > 12 ? v.slice(0, 12) + '...' : v}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="value" fill="hsl(224, 76%, 48%)" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="bg-muted/30 rounded-lg p-4">
                      <h5 className="text-sm font-medium mb-4">Breakdown</h5>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={getDistribution(col.name).slice(0, 6)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                          >
                            {getDistribution(col.name).slice(0, 6).map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'hsl(var(--card))',
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StatKPIProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number | string;
  subValue?: string;
}

function StatKPI({ icon: Icon, label, value, subValue }: StatKPIProps) {
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="flex items-center gap-2 text-muted-foreground mb-1">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subValue && (
        <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
      )}
    </div>
  );
}

function formatColumnName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
    .trim();
}
