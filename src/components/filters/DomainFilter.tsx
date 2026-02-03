import React from 'react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { DOMAIN_CATEGORIES } from '@/types/analytics';

interface DomainFilterProps {
  selectedDomains: string[];
  onChange: (domains: string[]) => void;
  availableDomains?: string[];
}

export function DomainFilter({ selectedDomains, onChange, availableDomains }: DomainFilterProps) {
  const domains = availableDomains || [...DOMAIN_CATEGORIES];

  return (
    <ToggleGroup
      type="multiple"
      value={selectedDomains}
      onValueChange={onChange}
      className="flex flex-wrap gap-2"
    >
      {domains.map((domain) => (
        <ToggleGroupItem
          key={domain}
          value={domain}
          className="px-3 py-1.5 text-xs font-semibold rounded-full border data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
        >
          {domain}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
