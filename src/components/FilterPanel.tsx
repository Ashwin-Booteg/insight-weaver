import React from 'react';
import { Search, X, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { FilterState, DataColumn } from '@/types/analytics';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FilterPanelProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableFilters: {
    states: string[];
    categories: Record<string, string[]>;
    numericRanges: Record<string, { min: number; max: number }>;
  };
  columns: DataColumn[];
}

export function FilterPanel({ filters, onFiltersChange, availableFilters, columns }: FilterPanelProps) {
  const hasFilters = filters.states.length > 0 || 
    filters.searchText || 
    filters.dateRange.start || 
    filters.dateRange.end ||
    Object.values(filters.categories).some(v => v.length > 0) ||
    Object.keys(filters.numericRanges).length > 0;
  
  const clearFilters = () => {
    onFiltersChange({
      states: [],
      dateRange: { start: null, end: null },
      categories: {},
      numericRanges: {},
      searchText: ''
    });
  };
  
  const dateColumn = columns.find(c => c.type === 'date');
  
  return (
    <div className="filter-sidebar p-4 space-y-6 h-full">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-foreground">Filters</h2>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-muted-foreground hover:text-foreground h-8 px-2"
          >
            <X className="w-4 h-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search records..."
          value={filters.searchText}
          onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
          className="pl-9"
        />
      </div>
      
      {/* State Filter */}
      {availableFilters.states.length > 0 && (
        <FilterSection title="States" count={filters.states.length}>
          <div className="max-h-48 overflow-y-auto space-y-2 scrollbar-thin">
            {availableFilters.states.map((state) => (
              <label key={state} className="flex items-center gap-2 cursor-pointer">
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
        <FilterSection title="Date Range">
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
          count={filters.categories[columnName]?.length || 0}
        >
          <div className="max-h-40 overflow-y-auto space-y-2 scrollbar-thin">
            {values.slice(0, 15).map((value) => (
              <label key={value} className="flex items-center gap-2 cursor-pointer">
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
              <p className="text-xs text-muted-foreground pt-1">
                +{values.length - 15} more
              </p>
            )}
          </div>
        </FilterSection>
      ))}
      
      {/* Numeric Range Filters */}
      {Object.entries(availableFilters.numericRanges).slice(0, 3).map(([columnName, range]) => (
        <FilterSection key={columnName} title={formatColumnName(columnName)}>
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

interface FilterSectionProps {
  title: string;
  count?: number;
  children: React.ReactNode;
}

function FilterSection({ title, count, children }: FilterSectionProps) {
  const [isOpen, setIsOpen] = React.useState(true);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-1 group">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{title}</span>
          {count !== undefined && count > 0 && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
              {count}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        {children}
      </CollapsibleContent>
    </Collapsible>
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
    <div className="space-y-3">
      <Slider
        min={min}
        max={max}
        step={(max - min) / 100 || 1}
        value={[value.min, value.max]}
        onValueChange={([newMin, newMax]) => onChange({ min: newMin, max: newMax })}
        className="w-full"
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatNumber(value.min)}</span>
        <span>{formatNumber(value.max)}</span>
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
