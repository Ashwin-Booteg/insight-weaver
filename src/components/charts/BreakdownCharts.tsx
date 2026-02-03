import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { KPIData } from '@/types/analytics';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(243, 75%, 59%)',
  'hsl(172, 66%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(340, 82%, 52%)',
  'hsl(262, 83%, 58%)',
  'hsl(160, 84%, 39%)',
  'hsl(189, 94%, 43%)',
  'hsl(215, 16%, 47%)',
];

interface IndustryBreakdownChartProps {
  data: KPIData['industryBreakdown'];
  className?: string;
}

export function IndustryBreakdownChart({ data, className }: IndustryBreakdownChartProps) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);
  
  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className={cn('chart-container', className)}>
      <h3 className="text-sm font-bold text-foreground mb-4">Industry Breakdown</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => [
              `${value.toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
              'Count'
            ]}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            formatter={(value) => <span className="text-xs">{value}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

interface LevelBreakdownChartProps {
  data: KPIData['levelBreakdown'];
  className?: string;
}

export function LevelBreakdownChart({ data, className }: LevelBreakdownChartProps) {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }
  
  const chartData = Object.entries(data)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
  
  const total = chartData.reduce((sum, d) => sum + d.value, 0);
  
  return (
    <div className={cn('chart-container', className)}>
      <h3 className="text-sm font-bold text-foreground mb-4">Audience Level Distribution</h3>
      <div className="space-y-3">
        {chartData.map((item, index) => {
          const percentage = (item.value / total) * 100;
          return (
            <div key={item.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{item.name}</span>
                <span className="text-muted-foreground">
                  {item.value.toLocaleString()} ({percentage.toFixed(1)}%)
                </span>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: COLORS[index % COLORS.length]
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
