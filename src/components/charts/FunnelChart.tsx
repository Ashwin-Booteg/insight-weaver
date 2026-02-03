import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '@/lib/utils';

const COLORS = [
  'hsl(243, 75%, 59%)',
  'hsl(172, 66%, 50%)',
  'hsl(38, 92%, 50%)',
  'hsl(340, 82%, 52%)',
  'hsl(262, 83%, 58%)',
];

interface FunnelChartProps {
  data: { name: string; value: number }[];
  title: string;
  className?: string;
}

export function FunnelChart({ data, title, className }: FunnelChartProps) {
  if (!data || data.length === 0) {
    return null;
  }
  
  const maxValue = Math.max(...data.map(d => d.value));
  const chartData = data.map((item, index) => ({
    ...item,
    percentage: ((item.value / maxValue) * 100).toFixed(1),
    fill: COLORS[index % COLORS.length]
  }));
  
  return (
    <div className={cn('chart-container', className)}>
      <h3 className="text-sm font-bold text-foreground mb-4">{title}</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart 
          data={chartData} 
          layout="vertical"
          margin={{ left: 10, right: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis
            dataKey="name"
            type="category"
            width={100}
            tick={{ fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '12px'
            }}
            formatter={(value: number) => [value.toLocaleString(), 'Count']}
          />
          <Bar dataKey="value" radius={[0, 8, 8, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
