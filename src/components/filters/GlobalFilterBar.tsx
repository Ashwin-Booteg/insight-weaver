import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Globe2, Briefcase, Factory, Filter, ChevronDown, Check, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  GlobalFilterState, 
  RegionName, 
  IndustryCategory,
  US_REGIONS,
  RoleMetadata
} from '@/types/filters';
import { US_STATES } from '@/types/analytics';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  availableStates: string[];
  roleMetadata: RoleMetadata[];
  rolesByIndustry: Record<IndustryCategory, string[]>;
  top20Roles: string[];
  effectiveSelectedStates: string[];
  effectiveSelectedRoles: string[];
  onStatesChange: (states: string[]) => void;
  onRegionsChange: (regions: RegionName[]) => void;
  onRolesChange: (roles: string[]) => void;
  onIndustriesChange: (industries: IndustryCategory[]) => void;
  onIndustryModeChange: (mode: 'AND' | 'OR') => void;
  onSelectTop20Roles: () => void;
  onSelectAllStates: () => void;
  onClearAll: () => void;
}

export function GlobalFilterBar({
  filters,
  availableStates,
  roleMetadata,
  rolesByIndustry,
  top20Roles,
  effectiveSelectedStates,
  effectiveSelectedRoles,
  onStatesChange,
  onRegionsChange,
  onRolesChange,
  onIndustriesChange,
  onIndustryModeChange,
  onSelectTop20Roles,
  onSelectAllStates,
  onClearAll
}: GlobalFilterBarProps) {
  const hasActiveFilters = 
    filters.states.length > 0 || 
    filters.regions.length > 0 || 
    filters.selectedRoles.length > 0 || 
    filters.selectedIndustries.length > 0;

  const allRegions: RegionName[] = ['Northeast', 'Midwest', 'South', 'West'];
  const allIndustries: IndustryCategory[] = ['Movie & Entertainment', 'Music & Audio', 'Fashion & Apparel'];

  return (
    <div className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
      <div className="p-4">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filter icon and label */}
          <div className="flex items-center gap-2 text-muted-foreground mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-sm font-medium">Filters:</span>
          </div>

          {/* Region Filter */}
          <RegionFilterPopover
            selectedRegions={filters.regions}
            onChange={onRegionsChange}
          />

          {/* State Filter */}
          <StateFilterPopover
            selectedStates={filters.states}
            availableStates={availableStates}
            selectedRegions={filters.regions}
            onChange={onStatesChange}
            onSelectAll={onSelectAllStates}
          />

          <Separator orientation="vertical" className="h-6 mx-1" />

          {/* Industry Filter */}
          <IndustryFilterPopover
            selectedIndustries={filters.selectedIndustries}
            rolesByIndustry={rolesByIndustry}
            industryMode={filters.industryFilterMode}
            onChange={onIndustriesChange}
            onModeChange={onIndustryModeChange}
          />

          {/* Role Filter */}
          <RoleFilterPopover
            selectedRoles={filters.selectedRoles}
            roleMetadata={roleMetadata}
            top20Roles={top20Roles}
            onChange={onRolesChange}
            onSelectTop20={onSelectTop20Roles}
          />

          {/* Clear All */}
          {hasActiveFilters && (
            <>
              <Separator orientation="vertical" className="h-6 mx-1" />
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8"
              >
                <X className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            </>
          )}
        </div>

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Active:</span>
            
            {filters.regions.map(region => (
              <Badge key={region} variant="secondary" className="gap-1 text-xs">
                <Globe2 className="w-3 h-3" />
                {region}
                <button
                  onClick={() => onRegionsChange(filters.regions.filter(r => r !== region))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            {filters.states.length > 0 && filters.states.length <= 3 && filters.states.map(state => (
              <Badge key={state} variant="secondary" className="gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                {state}
                <button
                  onClick={() => onStatesChange(filters.states.filter(s => s !== state))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
            {filters.states.length > 3 && (
              <Badge variant="secondary" className="gap-1 text-xs">
                <MapPin className="w-3 h-3" />
                {filters.states.length} states
              </Badge>
            )}

            {filters.selectedIndustries.map(industry => (
              <Badge key={industry} variant="outline" className="gap-1 text-xs border-primary/50 text-primary">
                <Factory className="w-3 h-3" />
                {industry}
                <button
                  onClick={() => onIndustriesChange(filters.selectedIndustries.filter(i => i !== industry))}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}

            {filters.selectedRoles.length > 0 && (
              <Badge variant="outline" className="gap-1 text-xs">
                <Briefcase className="w-3 h-3" />
                {filters.selectedRoles.length} roles
              </Badge>
            )}

            <span className="text-xs text-muted-foreground ml-2">
              → {effectiveSelectedStates.length} states, {effectiveSelectedRoles.length} roles
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// Region Filter Popover
function RegionFilterPopover({
  selectedRegions,
  onChange
}: {
  selectedRegions: RegionName[];
  onChange: (regions: RegionName[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allRegions: RegionName[] = ['Northeast', 'Midwest', 'South', 'West'];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Globe2 className="w-4 h-4" />
          Region
          {selectedRegions.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selectedRegions.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="p-2 border-b">
          <p className="text-sm font-medium">US Census Regions</p>
          <p className="text-xs text-muted-foreground">Select regions to filter states</p>
        </div>
        <div className="p-2 space-y-1">
          {allRegions.map(region => (
            <label
              key={region}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedRegions.includes(region)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selectedRegions, region]);
                  } else {
                    onChange(selectedRegions.filter(r => r !== region));
                  }
                }}
              />
              <div className="flex-1">
                <span className="text-sm font-medium">{region}</span>
                <p className="text-xs text-muted-foreground">
                  {US_REGIONS[region].length} states
                </p>
              </div>
            </label>
          ))}
        </div>
        <div className="p-2 border-t flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onChange(allRegions)}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// State Filter Popover
function StateFilterPopover({
  selectedStates,
  availableStates,
  selectedRegions,
  onChange,
  onSelectAll
}: {
  selectedStates: string[];
  availableStates: string[];
  selectedRegions: RegionName[];
  onChange: (states: string[]) => void;
  onSelectAll: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredStates = useMemo(() => {
    const searchLower = search.toLowerCase();
    return availableStates.filter(state => {
      const stateName = US_STATES[state] || state;
      return state.toLowerCase().includes(searchLower) || 
             stateName.toLowerCase().includes(searchLower);
    });
  }, [availableStates, search]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <MapPin className="w-4 h-4" />
          States
          {selectedStates.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selectedStates.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search states..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {filteredStates.map(state => (
              <label
                key={state}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedStates.includes(state)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedStates, state]);
                    } else {
                      onChange(selectedStates.filter(s => s !== state));
                    }
                  }}
                />
                <span className="text-sm">{US_STATES[state] || state}</span>
                <span className="text-xs text-muted-foreground ml-auto">{state}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={onSelectAll}
          >
            Select All
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="flex-1"
            onClick={() => onChange([])}
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Industry Filter Popover
function IndustryFilterPopover({
  selectedIndustries,
  rolesByIndustry,
  industryMode,
  onChange,
  onModeChange
}: {
  selectedIndustries: IndustryCategory[];
  rolesByIndustry: Record<IndustryCategory, string[]>;
  industryMode: 'AND' | 'OR';
  onChange: (industries: IndustryCategory[]) => void;
  onModeChange: (mode: 'AND' | 'OR') => void;
}) {
  const [open, setOpen] = useState(false);
  const allIndustries: IndustryCategory[] = ['Movie & Entertainment', 'Music & Audio', 'Fashion & Apparel'];

  const industryIcons: Record<IndustryCategory, string> = {
    'Movie & Entertainment': '🎬',
    'Music & Audio': '🎵',
    'Fashion & Apparel': '👗'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Factory className="w-4 h-4" />
          Industry
          {selectedIndustries.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selectedIndustries.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Filter by Industry</p>
          <p className="text-xs text-muted-foreground">Roles are classified by keywords</p>
        </div>
        <div className="p-2 space-y-1">
          {allIndustries.map(industry => (
            <label
              key={industry}
              className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
            >
              <Checkbox
                checked={selectedIndustries.includes(industry)}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onChange([...selectedIndustries, industry]);
                  } else {
                    onChange(selectedIndustries.filter(i => i !== industry));
                  }
                }}
              />
              <span className="text-lg">{industryIcons[industry]}</span>
              <div className="flex-1">
                <span className="text-sm font-medium">{industry}</span>
                <p className="text-xs text-muted-foreground">
                  {rolesByIndustry[industry].length} roles
                </p>
              </div>
            </label>
          ))}
        </div>
        
        {/* Mode Toggle */}
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Filter Mode</p>
              <p className="text-xs text-muted-foreground">
                {industryMode === 'AND' ? 'Narrow (intersection)' : 'Additive (union)'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onModeChange(industryMode === 'AND' ? 'OR' : 'AND')}
              className="gap-2"
            >
              {industryMode === 'AND' ? (
                <>
                  <ToggleLeft className="w-4 h-4" />
                  AND
                </>
              ) : (
                <>
                  <ToggleRight className="w-4 h-4" />
                  OR
                </>
              )}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Role Filter Popover
function RoleFilterPopover({
  selectedRoles,
  roleMetadata,
  top20Roles,
  onChange,
  onSelectTop20
}: {
  selectedRoles: string[];
  roleMetadata: RoleMetadata[];
  top20Roles: string[];
  onChange: (roles: string[]) => void;
  onSelectTop20: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filteredRoles = useMemo(() => {
    if (!search) return roleMetadata;
    const searchLower = search.toLowerCase();
    return roleMetadata.filter(role => 
      role.columnName.toLowerCase().includes(searchLower)
    );
  }, [roleMetadata, search]);

  const industryColors: Record<IndustryCategory, string> = {
    'Movie & Entertainment': 'text-chart-rose',
    'Music & Audio': 'text-chart-purple',
    'Fashion & Apparel': 'text-chart-amber'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Briefcase className="w-4 h-4" />
          Roles
          {selectedRoles.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {selectedRoles.length}
            </Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search roles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8"
            />
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="p-2 border-b bg-muted/30 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSelectTop20} className="text-xs">
            Top 20 Roles
          </Button>
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={() => onChange(roleMetadata.map(r => r.columnName))}
            className="text-xs"
          >
            Select All
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} className="text-xs">
            Clear
          </Button>
        </div>

        <ScrollArea className="h-72">
          <div className="p-2 space-y-0.5">
            {filteredRoles.map(role => (
              <label
                key={role.columnName}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50"
              >
                <Checkbox
                  checked={selectedRoles.includes(role.columnName)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      onChange([...selectedRoles, role.columnName]);
                    } else {
                      onChange(selectedRoles.filter(r => r !== role.columnName));
                    }
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">
                    {role.columnName}
                  </span>
                  <span className={cn("text-xs", industryColors[role.industry])}>
                    {role.industry}
                  </span>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{role.totalPeople.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{role.percentOfTotal.toFixed(1)}%</p>
                </div>
              </label>
            ))}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
