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
    <div className="space-y-6">
      {/* Prominent Total Customers Display */}
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-primary to-chart-purple rounded-3xl p-8 text-primary-foreground shadow-2xl">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />
        
        <div className="relative flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider opacity-80">Total Customers</p>
            <p className="text-6xl font-black mt-2 tracking-tight drop-shadow-lg">{data.totalCompanies.toLocaleString()}</p>
            <p className="text-sm mt-2 opacity-70">Sum of all numeric values</p>
          </div>
          <div className="p-5 rounded-2xl bg-white/20 backdrop-blur-sm shadow-lg">
            <UserCheck className="w-10 h-10" />
          </div>
        </div>
      </div>
      
      {/* Other KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
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
    <div className={cn('kpi-card group', `kpi-card-${variant}`)}>
      {/* Decorative glow effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-white/10 to-transparent rounded-2xl" />
      
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide opacity-80">{title}</p>
          <p className="text-4xl font-black mt-2 tracking-tight">{value.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-inner">
          <Icon className="w-6 h-6" />
        </div>
      </div>
      
      {change !== null && (
        <div className="relative flex items-center gap-2 mt-4 text-sm">
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full",
            change >= 0 ? "bg-white/20" : "bg-black/10"
          )}>
            {change >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span className="font-bold">
              {change >= 0 ? '+' : ''}{change.toFixed(1)}%
            </span>
          </div>
          <span className="opacity-70 text-xs">vs previous</span>
        </div>
      )}
    </div>
  );
}
