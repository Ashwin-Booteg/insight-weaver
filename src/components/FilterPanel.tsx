import React from 'react';
import { Search, X, Calendar, Factory, Layers, Globe, MapPin, Tag, SlidersHorizontal } from 'lucide-react';
import { FilterState, DataColumn, INDUSTRY_CATEGORIES, AUDIENCE_LEVELS, DOMAIN_CATEGORIES } from '@/types/analytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FilterSection } from '@/components/filters/FilterSection';
import { IndustryFilter } from '@/components/filters/IndustryFilter';
import { LevelFilter } from '@/components/filters/LevelFilter';
import { DomainFilter } from '@/components/filters/DomainFilter';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableFilters: {
    states: string[];
    categories: Record<string, string[]>;
    numericRanges: Record<string, { min: number; max: number }>;
    industries?: string[];
    levels?: string[];
    domains?: string[];
  };
  columns: DataColumn[];
}

export function FilterPanel({ filters, onFiltersChange, availableFilters, columns }: FilterPanelProps) {
  const activeFilterCount = 
    filters.states.length + 
    filters.industries.length + 
    filters.levels.length + 
    filters.domains.length +
    (filters.searchText ? 1 : 0) + 
    (filters.dateRange.start ? 1 : 0) + 
    (filters.dateRange.end ? 1 : 0) +
    Object.values(filters.categories).reduce((acc, v) => acc + v.length, 0) +
    Object.keys(filters.numericRanges).length;

  const hasFilters = activeFilterCount > 0;
  
  const clearFilters = () => {
    onFiltersChange({
      states: [],
      dateRange: { start: null, end: null },
      categories: {},
      numericRanges: {},
      searchText: '',
      industries: [],
      levels: [],
      domains: []
    });
  };
  
  const dateColumn = columns.find(c => c.type === 'date');
  
  // Get available industries from data or use defaults
  const availableIndustries = availableFilters.industries || [...INDUSTRY_CATEGORIES];
  const availableLevels = availableFilters.levels || [...AUDIENCE_LEVELS];
  const availableDomains = availableFilters.domains || [...DOMAIN_CATEGORIES];
  
  return (
    <div className="filter-sidebar p-4 space-y-5 h-full overflow-y-auto scrollbar-thin">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-primary" />
          <h2 className="font-bold text-foreground">Filters</h2>
          {hasFilters && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {activeFilterCount}
            </Badge>
          )}
        </div>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-destructive h-8 px-2"
          >
            <X className="w-4 h-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search all records..."
          value={filters.searchText}
          onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
          className="pl-9 bg-muted/50 border-0 focus-visible:ring-primary"
        />
      </div>

      {/* Industry Filter - Primary */}
      <FilterSection 
        title="Industry" 
        icon={<Factory className="w-4 h-4" />}
        count={filters.industries.length}
      >
        <IndustryFilter
          selectedIndustries={filters.industries}
          onChange={(industries) => onFiltersChange({ ...filters, industries })}
          availableIndustries={availableIndustries}
        />
      </FilterSection>

      {/* Level Filter */}
      <FilterSection 
        title="Audience Level" 
        icon={<Layers className="w-4 h-4" />}
        count={filters.levels.length}
      >
        <LevelFilter
          selectedLevels={filters.levels}
          onChange={(levels) => onFiltersChange({ ...filters, levels })}
          availableLevels={availableLevels}
        />
      </FilterSection>

      {/* Domain Filter */}
      <FilterSection 
        title="Domain Type" 
        icon={<Globe className="w-4 h-4" />}
        count={filters.domains.length}
      >
        <DomainFilter
          selectedDomains={filters.domains}
          onChange={(domains) => onFiltersChange({ ...filters, domains })}
          availableDomains={availableDomains}
        />
      </FilterSection>
      
      {/* State Filter */}
      {availableFilters.states.length > 0 && (
        <FilterSection 
          title="States" 
          icon={<MapPin className="w-4 h-4" />}
          count={filters.states.length}
        >
          <div className="max-h-48 overflow-y-auto space-y-1 scrollbar-thin">
            {availableFilters.states.map((state) => (
              <label key={state} className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={filters.states.includes(state)}
                  onCheckedChange={(checked) => {
                    const newStates = checked
                      ? [...filters.states, state]
                      : filters.states.filter(s => s !== state);
                    onFiltersChange({ ...filters, states: newStates });
                  }}
                />
                <span className="text-sm">{state}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}
      
      {/* Date Range Filter */}
      {dateColumn && (
        <FilterSection title="Date Range" icon={<Calendar className="w-4 h-4" />}>
          <div className="space-y-2">
            <DatePicker
              label="From"
              value={filters.dateRange.start}
              onChange={(date) => onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, start: date }
              })}
            />
            <DatePicker
              label="To"
              value={filters.dateRange.end}
              onChange={(date) => onFiltersChange({
                ...filters,
                dateRange: { ...filters.dateRange, end: date }
              })}
            />
          </div>
        </FilterSection>
      )}
      
      {/* Category Filters */}
      {Object.entries(availableFilters.categories).slice(0, 5).map(([columnName, values]) => (
        <FilterSection
          key={columnName}
          title={formatColumnName(columnName)}
          icon={<Tag className="w-4 h-4" />}
          count={filters.categories[columnName]?.length || 0}
          defaultOpen={false}
        >
          <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
            {values.slice(0, 15).map((value) => (
              <label key={value} className="flex items-center gap-2 p-1.5 rounded cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={filters.categories[columnName]?.includes(value) || false}
                  onCheckedChange={(checked) => {
                    const currentValues = filters.categories[columnName] || [];
                    const newValues = checked
                      ? [...currentValues, value]
                      : currentValues.filter(v => v !== value);
                    onFiltersChange({
                      ...filters,
                      categories: { ...filters.categories, [columnName]: newValues }
                    });
                  }}
                />
                <span className="text-sm truncate" title={value}>{value}</span>
              </label>
            ))}
            {values.length > 15 && (
              <p className="text-xs text-muted-foreground pt-1 pl-6">
                +{values.length - 15} more
              </p>
            )}
          </div>
        </FilterSection>
      ))}
      
      {/* Numeric Range Filters */}
      {Object.entries(availableFilters.numericRanges).slice(0, 3).map(([columnName, range]) => (
        <FilterSection 
          key={columnName} 
          title={formatColumnName(columnName)}
          defaultOpen={false}
        >
          <NumericRangeFilter
            min={range.min}
            max={range.max}
            value={filters.numericRanges[columnName] || range}
            onChange={(newRange) => {
              onFiltersChange({
                ...filters,
                numericRanges: { ...filters.numericRanges, [columnName]: newRange }
              });
            }}
          />
        </FilterSection>
      ))}
    </div>
  );
}

interface DatePickerProps {
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
}

function DatePicker({ label, value, onChange }: DatePickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'w-full justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
        >
          <Calendar className="mr-2 h-4 w-4" />
          {value ? format(value, 'PPP') : label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-popover" align="start">
        <CalendarComponent
          mode="single"
          selected={value || undefined}
          onSelect={(date) => onChange(date || null)}
          initialFocus
          className="pointer-events-auto"
        />
      </PopoverContent>
    </Popover>
  );
}

interface NumericRangeFilterProps {
  min: number;
  max: number;
  value: { min: number; max: number };
  onChange: (value: { min: number; max: number }) => void;
}

function NumericRangeFilter({ min, max, value, onChange }: NumericRangeFilterProps) {
  return (
    <div className="space-y-3 px-1">
      <Slider
        min={min}
        max={max}
        step={(max - min) / 100 || 1}
        value={[value.min, value.max]}
        onValueChange={([newMin, newMax]) => onChange({ min: newMin, max: newMax })}
        className="w-full"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="font-medium">{formatNumber(value.min)}</span>
        <span className="font-medium">{formatNumber(value.max)}</span>
      </div>
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

function formatNumber(value: number): string {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toLocaleString();
}
