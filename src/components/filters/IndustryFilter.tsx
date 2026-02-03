import React from 'react';
import { Film, Music, Shirt } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { INDUSTRY_CATEGORIES } from '@/types/analytics';

interface IndustryFilterProps {
  selectedIndustries: string[];
  onChange: (industries: string[]) => void;
  availableIndustries?: string[];
}

const INDUSTRY_ICONS: Record<string, React.ReactNode> = {
  'Movie & Entertainment': <Film className="w-4 h-4" />,
  'Music & Audio': <Music className="w-4 h-4" />,
  'Fashion & Apparel': <Shirt className="w-4 h-4" />,
};

const INDUSTRY_COLORS: Record<string, string> = {
  'Movie & Entertainment': 'text-chart-rose',
  'Music & Audio': 'text-chart-purple',
  'Fashion & Apparel': 'text-chart-amber',
};

export function IndustryFilter({ selectedIndustries, onChange, availableIndustries }: IndustryFilterProps) {
  const industries = availableIndustries || [...INDUSTRY_CATEGORIES];
  
  const toggleIndustry = (industry: string) => {
    if (selectedIndustries.includes(industry)) {
      onChange(selectedIndustries.filter(i => i !== industry));
    } else {
      onChange([...selectedIndustries, industry]);
    }
  };

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
      {industries.map((industry) => (
        <label
          key={industry}
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <Checkbox
            checked={selectedIndustries.includes(industry)}
            onCheckedChange={() => toggleIndustry(industry)}
          />
          <span className={INDUSTRY_COLORS[industry] || 'text-muted-foreground'}>
            {INDUSTRY_ICONS[industry]}
          </span>
          <span className="text-sm font-medium truncate">{industry}</span>
        </label>
      ))}
    </div>
  );
}
