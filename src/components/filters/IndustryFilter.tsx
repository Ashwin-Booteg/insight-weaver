import React from 'react';
import { Film, Music, Shirt, Cpu, HeartPulse, Building2, ShoppingCart, GraduationCap, UtensilsCrossed, Plane, Home, Megaphone, Dumbbell, Gamepad2, Newspaper } from 'lucide-react';
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
  'Technology & Software': <Cpu className="w-4 h-4" />,
  'Healthcare & Medical': <HeartPulse className="w-4 h-4" />,
  'Finance & Banking': <Building2 className="w-4 h-4" />,
  'E-commerce & Retail': <ShoppingCart className="w-4 h-4" />,
  'Education & Training': <GraduationCap className="w-4 h-4" />,
  'Food & Beverage': <UtensilsCrossed className="w-4 h-4" />,
  'Travel & Hospitality': <Plane className="w-4 h-4" />,
  'Real Estate': <Home className="w-4 h-4" />,
  'Marketing & Advertising': <Megaphone className="w-4 h-4" />,
  'Sports & Fitness': <Dumbbell className="w-4 h-4" />,
  'Gaming & Esports': <Gamepad2 className="w-4 h-4" />,
  'Media & Publishing': <Newspaper className="w-4 h-4" />,
};

const INDUSTRY_COLORS: Record<string, string> = {
  'Movie & Entertainment': 'text-chart-rose',
  'Music & Audio': 'text-chart-purple',
  'Fashion & Apparel': 'text-chart-amber',
  'Technology & Software': 'text-chart-blue',
  'Healthcare & Medical': 'text-chart-teal',
  'Finance & Banking': 'text-chart-emerald',
  'E-commerce & Retail': 'text-chart-cyan',
  'Education & Training': 'text-primary',
  'Food & Beverage': 'text-chart-amber',
  'Travel & Hospitality': 'text-chart-blue',
  'Real Estate': 'text-chart-slate',
  'Marketing & Advertising': 'text-chart-rose',
  'Sports & Fitness': 'text-chart-emerald',
  'Gaming & Esports': 'text-chart-purple',
  'Media & Publishing': 'text-chart-slate',
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
