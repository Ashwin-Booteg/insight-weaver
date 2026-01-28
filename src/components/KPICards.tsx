import { KPIData } from '@/types/analytics';
import { Users, Target, Building2, MapPin, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KPICardsProps {
  data: KPIData;
  previousData?: KPIData;
}

export function KPICards({ data, previousData }: KPICardsProps) {
  const cards = [
    {
      title: 'Total Records',
      value: data.totalRecords,
      icon: Users,
      variant: 'primary' as const,
      previousValue: previousData?.totalRecords
    },
    {
      title: 'Total Customers',
      value: data.totalCompanies,
      icon: UserCheck,
      variant: 'accent' as const,
      previousValue: previousData?.totalCompanies
    },
    {
      title: 'ICP People',
      value: data.totalICP,
      icon: Target,
      variant: 'amber' as const,
      previousValue: previousData?.totalICP
    },
    {
      title: 'States Covered',
      value: data.stateCount,
      icon: MapPin,
      variant: 'rose' as const,
      previousValue: previousData?.stateCount
    }
  ];
  
  return (
    <div className="space-y-4">
      {/* Prominent Total Customers Display */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-90">Total Customers</p>
            <p className="text-5xl font-black mt-1 tracking-tight">{data.totalCompanies.toLocaleString()}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/20">
            <UserCheck className="w-8 h-8" />
          </div>
        </div>
      </div>
      
      {/* Other KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.filter(c => c.title !== 'Total Customers').map((card) => (
          <KPICard key={card.title} {...card} />
        ))}
      </div>
    </div>
  );
}

interface KPICardProps {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'primary' | 'accent' | 'amber' | 'rose';
  previousValue?: number;
}

import { TrendingUp, TrendingDown } from 'lucide-react';

function KPICard({ title, value, icon: Icon, variant, previousValue }: KPICardProps) {
  const change = previousValue !== undefined && previousValue > 0
    ? ((value - previousValue) / previousValue) * 100
    : null;
  
  return (
    <div className={cn('kpi-card', `kpi-card-${variant}`)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="text-3xl font-bold mt-1">{value.toLocaleString()}</p>
        </div>
        <div className="p-2 rounded-lg bg-white/10">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      
      {change !== null && (
        <div className="flex items-center gap-1.5 mt-3 text-sm">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4" />
          ) : (
            <TrendingDown className="w-4 h-4" />
          )}
          <span className="font-medium">
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
          <span className="opacity-70">vs previous</span>
        </div>
      )}
    </div>
  );
}
