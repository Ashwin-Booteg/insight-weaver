import React from 'react';
import { Building2, Building, Store, Rocket, User } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { AUDIENCE_LEVELS } from '@/types/analytics';
import { cn } from '@/lib/utils';

interface LevelFilterProps {
  selectedLevels: string[];
  onChange: (levels: string[]) => void;
  availableLevels?: string[];
}

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  'Enterprise': <Building2 className="w-4 h-4" />,
  'Mid-Market': <Building className="w-4 h-4" />,
  'SMB': <Store className="w-4 h-4" />,
  'Startup': <Rocket className="w-4 h-4" />,
  'Individual/Consumer': <User className="w-4 h-4" />,
};

const LEVEL_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Enterprise': { bg: 'bg-chart-purple/10', text: 'text-chart-purple', border: 'border-chart-purple/30' },
  'Mid-Market': { bg: 'bg-chart-blue/10', text: 'text-chart-blue', border: 'border-chart-blue/30' },
  'SMB': { bg: 'bg-chart-teal/10', text: 'text-chart-teal', border: 'border-chart-teal/30' },
  'Startup': { bg: 'bg-chart-amber/10', text: 'text-chart-amber', border: 'border-chart-amber/30' },
  'Individual/Consumer': { bg: 'bg-chart-rose/10', text: 'text-chart-rose', border: 'border-chart-rose/30' },
};

export function LevelFilter({ selectedLevels, onChange, availableLevels }: LevelFilterProps) {
  const levels = availableLevels || [...AUDIENCE_LEVELS];
  
  const toggleLevel = (level: string) => {
    if (selectedLevels.includes(level)) {
      onChange(selectedLevels.filter(l => l !== level));
    } else {
      onChange([...selectedLevels, level]);
    }
  };

  return (
    <div className="space-y-2">
      {levels.map((level) => {
        const colors = LEVEL_COLORS[level] || { bg: 'bg-muted', text: 'text-foreground', border: 'border-border' };
        const isSelected = selectedLevels.includes(level);
        
        return (
          <label
            key={level}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all',
              isSelected ? `${colors.bg} ${colors.border}` : 'border-transparent hover:bg-muted/50'
            )}
          >
            <Checkbox
              checked={isSelected}
              onCheckedChange={() => toggleLevel(level)}
            />
            <span className={colors.text}>
              {LEVEL_ICONS[level]}
            </span>
            <span className="text-sm font-medium">{level}</span>
          </label>
        );
      })}
    </div>
  );
}
