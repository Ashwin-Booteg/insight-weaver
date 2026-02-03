import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'accent' | 'amber' | 'rose';
  className?: string;
}

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  trendValue, 
  icon,
  variant = 'default',
  className 
}: MetricCardProps) {
  const variantClasses = {
    default: 'kpi-card',
    primary: 'kpi-card-primary',
    accent: 'kpi-card-accent',
    amber: 'kpi-card-amber',
    rose: 'kpi-card-rose',
  };
  
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-emerald-500' : trend === 'down' ? 'text-rose-500' : 'text-muted-foreground';
  
  return (
    <div className={cn(variantClasses[variant], className)}>
      <div className="flex items-start justify-between mb-3">
        <span className={cn(
          'text-sm font-medium',
          variant === 'default' ? 'text-muted-foreground' : 'text-white/80'
        )}>
          {title}
        </span>
        {icon && (
          <span className={cn(
            'p-2 rounded-lg',
            variant === 'default' ? 'bg-primary/10 text-primary' : 'bg-white/20 text-white'
          )}>
            {icon}
          </span>
        )}
      </div>
      
      <div className="space-y-1">
        <p className={cn(
          'text-3xl font-black tracking-tight',
          variant === 'default' ? 'text-foreground' : 'text-white'
        )}>
          {typeof value === 'number' ? value.toLocaleString() : value}
        </p>
        
        {(subtitle || trend) && (
          <div className="flex items-center gap-2">
            {trend && (
              <span className={cn('flex items-center gap-1 text-xs font-medium', trendColor)}>
                <TrendIcon className="w-3 h-3" />
                {trendValue}
              </span>
            )}
            {subtitle && (
              <span className={cn(
                'text-xs',
                variant === 'default' ? 'text-muted-foreground' : 'text-white/70'
              )}>
                {subtitle}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
