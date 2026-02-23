import React, { useState, useMemo } from 'react';
import { Search, X, MapPin, Globe2, Briefcase, Factory, Filter, ChevronDown, ToggleLeft, ToggleRight, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { GlobalFilterState, IndustryCategory, OrgSector, RoleMetadata } from '@/types/filters';
import { GeographyProfile, getLocationName } from '@/types/geography';

interface GlobalFilterBarProps {
  filters: GlobalFilterState;
  availableStates: string[];
  roleMetadata: RoleMetadata[];
  rolesByIndustry: Record<IndustryCategory, string[]>;
  rolesBySector: Record<OrgSector, string[]>;
  top20Roles: string[];
  effectiveSelectedStates: string[];
  effectiveSelectedRoles: string[];
  onStatesChange: (states: string[]) => void;
  onRegionsChange: (regions: string[]) => void;
  onRolesChange: (roles: string[]) => void;
  onIndustriesChange: (industries: IndustryCategory[]) => void;
  onIndustryModeChange: (mode: 'AND' | 'OR') => void;
  onSectorsChange: (sectors: OrgSector[]) => void;
  onSelectTop20Roles: () => void;
  onSelectAllStates: () => void;
  onClearAll: () => void;
  profile?: GeographyProfile;
}

export function GlobalFilterBar({
  filters, availableStates, roleMetadata, rolesByIndustry, rolesBySector, top20Roles,
  effectiveSelectedStates, effectiveSelectedRoles,
  onStatesChange, onRegionsChange, onRolesChange, onIndustriesChange,
  onIndustryModeChange, onSectorsChange, onSelectTop20Roles, onSelectAllStates, onClearAll,
  profile
}: GlobalFilterBarProps) {
  const hasActiveFilters = 
    filters.states.length > 0 || filters.regions.length > 0 || 
    filters.selectedRoles.length > 0 || filters.selectedIndustries.length > 0 ||
    filters.selectedSectors.length > 0;

  const regionNames = useMemo(() => profile ? Object.keys(profile.regions) : [], [profile]);
  const locationLabel = profile?.locationLabel || 'States';
  const regionLabel = profile?.regionLabel || 'Regions';

  return (
    <div className="glass border-b border-border px-5 py-2.5 sticky top-[57px] z-30">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mr-1">Filter</span>

        {regionNames.length > 0 && (
          <RegionFilterPopover selectedRegions={filters.regions} regionNames={regionNames} profile={profile} onChange={onRegionsChange} />
        )}
        <LocationFilterPopover selectedStates={filters.states} availableStates={availableStates} onChange={onStatesChange} onSelectAll={onSelectAllStates} profile={profile} />
        <div className="w-px h-4 bg-border mx-0.5" />
        <IndustryFilterPopover selectedIndustries={filters.selectedIndustries} rolesByIndustry={rolesByIndustry} industryMode={filters.industryFilterMode} onChange={onIndustriesChange} onModeChange={onIndustryModeChange} />
        <SectorFilterPopover selectedSectors={filters.selectedSectors} rolesBySector={rolesBySector} onChange={onSectorsChange} />
        <RoleFilterPopover selectedRoles={filters.selectedRoles} roleMetadata={roleMetadata} top20Roles={top20Roles} onChange={onRolesChange} onSelectTop20={onSelectTop20Roles} />

        {hasActiveFilters && (
          <>
            <div className="w-px h-4 bg-border mx-0.5" />
            {filters.regions.map(r => (
              <Badge key={r} variant="secondary" className="gap-1 text-[11px] h-6 rounded-lg">
                <Globe2 className="w-2.5 h-2.5" />{r}
                <button onClick={() => onRegionsChange(filters.regions.filter(x => x !== r))} className="ml-0.5 hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            ))}
            {filters.states.length > 0 && filters.states.length <= 3 && filters.states.map(s => (
              <Badge key={s} variant="secondary" className="gap-1 text-[11px] h-6 rounded-lg">
                <MapPin className="w-2.5 h-2.5" />{profile ? getLocationName(s, profile) : s}
                <button onClick={() => onStatesChange(filters.states.filter(x => x !== s))} className="ml-0.5 hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            ))}
            {filters.states.length > 3 && (
              <Badge variant="secondary" className="gap-1 text-[11px] h-6 rounded-lg"><MapPin className="w-2.5 h-2.5" />{filters.states.length} {locationLabel.toLowerCase()}</Badge>
            )}
            {filters.selectedIndustries.map(ind => (
              <Badge key={ind} variant="outline" className="gap-1 text-[11px] h-6 rounded-lg border-primary/40 text-primary">
                {ind.split(' ')[0]}
                <button onClick={() => onIndustriesChange(filters.selectedIndustries.filter(i => i !== ind))} className="ml-0.5 hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            ))}
            {filters.selectedRoles.length > 0 && (
              <Badge variant="outline" className="text-[11px] h-6 rounded-lg"><Briefcase className="w-2.5 h-2.5 mr-1" />{filters.selectedRoles.length} roles</Badge>
            )}
            {filters.selectedSectors.map(sec => (
              <Badge key={sec} variant="outline" className="gap-1 text-[11px] h-6 rounded-lg border-accent/40 text-accent-foreground">
                {sec}
                <button onClick={() => onSectorsChange(filters.selectedSectors.filter(s => s !== sec))} className="ml-0.5 hover:text-destructive"><X className="w-2.5 h-2.5" /></button>
              </Badge>
            ))}
            <button onClick={onClearAll} className="text-[11px] text-destructive/70 hover:text-destructive transition-colors ml-1">Clear all</button>
          </>
        )}
      </div>
    </div>
  );
}

// Region Filter Popover (dynamic)
function RegionFilterPopover({
  selectedRegions, regionNames, profile, onChange
}: {
  selectedRegions: string[];
  regionNames: string[];
  profile?: GeographyProfile;
  onChange: (regions: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const regionLabel = profile?.regionLabel || 'Regions';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className={cn('pill-btn', selectedRegions.length > 0 && 'active')}>
          <Globe2 className="w-3 h-3" />{regionLabel}
          {selectedRegions.length > 0 && <span className="ml-0.5 font-bold">{selectedRegions.length}</span>}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0 bg-card border-border rounded-xl" align="start">
        <div className="p-3 border-b border-border">
          <p className="text-xs font-semibold">{regionLabel}</p>
        </div>
        <ScrollArea className="max-h-56">
          <div className="p-2 space-y-0.5">
            {regionNames.map(region => (
              <label key={region} className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer hover:bg-muted/50 text-xs">
                <Checkbox checked={selectedRegions.includes(region)}
                  onCheckedChange={(c) => { if (c) onChange([...selectedRegions, region]); else onChange(selectedRegions.filter(r => r !== region)); }} />
                {region}
                {profile?.regions[region] && <span className="ml-auto text-[11px] text-muted-foreground">{profile.regions[region].length}</span>}
              </label>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t border-border flex gap-1.5">
          <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => onChange(regionNames)}>All</Button>
          <Button variant="ghost" size="sm" className="flex-1 h-7 text-xs" onClick={() => onChange([])}>Clear</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Location Filter Popover (dynamic)
function LocationFilterPopover({
  selectedStates, availableStates, onChange, onSelectAll, profile
}: {
  selectedStates: string[];
  availableStates: string[];
  onChange: (states: string[]) => void;
  onSelectAll: () => void;
  profile?: GeographyProfile;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const locationLabel = profile?.locationLabel || 'States';

  const filteredStates = useMemo(() => {
    const searchLower = search.toLowerCase();
    return availableStates.filter(state => {
      const name = profile ? getLocationName(state, profile) : state;
      return state.toLowerCase().includes(searchLower) || name.toLowerCase().includes(searchLower);
    });
  }, [availableStates, search, profile]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <MapPin className="w-4 h-4" />
          {locationLabel}
          {selectedStates.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedStates.length}</Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder={`Search ${locationLabel.toLowerCase()}...`} value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8" />
          </div>
        </div>
        <ScrollArea className="h-64">
          <div className="p-2 space-y-1">
            {filteredStates.map(state => (
              <label key={state} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={selectedStates.includes(state)}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...selectedStates, state]);
                    else onChange(selectedStates.filter(s => s !== state));
                  }}
                />
                <span className="text-sm">{profile ? getLocationName(state, profile) : state}</span>
                <span className="text-xs text-muted-foreground ml-auto">{state}</span>
              </label>
            ))}
          </div>
        </ScrollArea>
        <div className="p-2 border-t flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={onSelectAll}>Select All</Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onChange([])}>Clear</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Industry Filter Popover (unchanged logic)
function IndustryFilterPopover({
  selectedIndustries, rolesByIndustry, industryMode, onChange, onModeChange
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
    'Movie & Entertainment': '🎬', 'Music & Audio': '🎵', 'Fashion & Apparel': '👗'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Factory className="w-4 h-4" /> Industry
          {selectedIndustries.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedIndustries.length}</Badge>
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
            <label key={industry} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50">
              <Checkbox
                checked={selectedIndustries.includes(industry)}
                onCheckedChange={(checked) => {
                  if (checked) onChange([...selectedIndustries, industry]);
                  else onChange(selectedIndustries.filter(i => i !== industry));
                }}
              />
              <span className="text-lg">{industryIcons[industry]}</span>
              <div className="flex-1">
                <span className="text-sm font-medium">{industry}</span>
                <p className="text-xs text-muted-foreground">{rolesByIndustry[industry].length} roles</p>
              </div>
            </label>
          ))}
        </div>
        <div className="p-3 border-t bg-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Filter Mode</p>
              <p className="text-xs text-muted-foreground">
                {industryMode === 'AND' ? 'Narrow (intersection)' : 'Additive (union)'}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => onModeChange(industryMode === 'AND' ? 'OR' : 'AND')} className="gap-2">
              {industryMode === 'AND' ? <><ToggleLeft className="w-4 h-4" /> AND</> : <><ToggleRight className="w-4 h-4" /> OR</>}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Role Filter Popover (unchanged)
function RoleFilterPopover({
  selectedRoles, roleMetadata, top20Roles, onChange, onSelectTop20
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
    return roleMetadata.filter(role => role.columnName.toLowerCase().includes(searchLower));
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
          <Briefcase className="w-4 h-4" /> Roles
          {selectedRoles.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedRoles.length}</Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-2 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search roles..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="pl-8 h-8" />
          </div>
        </div>
        <div className="p-2 border-b bg-muted/30 flex gap-2">
          <Button variant="secondary" size="sm" onClick={onSelectTop20} className="text-xs">Top 20 Roles</Button>
          <Button variant="secondary" size="sm" onClick={() => onChange(roleMetadata.map(r => r.columnName))} className="text-xs">Select All</Button>
          <Button variant="ghost" size="sm" onClick={() => onChange([])} className="text-xs">Clear</Button>
        </div>
        <ScrollArea className="h-72">
          <div className="p-2 space-y-0.5">
            {filteredRoles.map(role => (
              <label key={role.columnName} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50">
                <Checkbox
                  checked={selectedRoles.includes(role.columnName)}
                  onCheckedChange={(checked) => {
                    if (checked) onChange([...selectedRoles, role.columnName]);
                    else onChange(selectedRoles.filter(r => r !== role.columnName));
                  }}
                />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium truncate block">{role.columnName}</span>
                  <span className={cn("text-xs", industryColors[role.industry])}>{role.industry}</span>
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

// Sector Filter Popover
function SectorFilterPopover({
  selectedSectors, rolesBySector, onChange
}: {
  selectedSectors: OrgSector[];
  rolesBySector: Record<OrgSector, string[]>;
  onChange: (sectors: OrgSector[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const allSectors: OrgSector[] = ['Production Companies', 'Unions', 'Guilds & Associations'];
  const sectorIcons: Record<OrgSector, string> = {
    'Production Companies': '🏭', 'Unions': '🤝', 'Guilds & Associations': '🏅'
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Shield className="w-4 h-4" /> Sector
          {selectedSectors.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{selectedSectors.length}</Badge>
          )}
          <ChevronDown className="w-3 h-3 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <p className="text-sm font-medium">Filter by Sector</p>
          <p className="text-xs text-muted-foreground">Organizational classification</p>
        </div>
        <div className="p-2 space-y-1">
          {allSectors.map(sector => (
            <label key={sector} className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-muted/50">
              <Checkbox
                checked={selectedSectors.includes(sector)}
                onCheckedChange={(checked) => {
                  if (checked) onChange([...selectedSectors, sector]);
                  else onChange(selectedSectors.filter(s => s !== sector));
                }}
              />
              <span className="text-lg">{sectorIcons[sector]}</span>
              <div className="flex-1">
                <span className="text-sm font-medium">{sector}</span>
                <p className="text-xs text-muted-foreground">{rolesBySector[sector].length} roles</p>
              </div>
            </label>
          ))}
        </div>
        <div className="p-2 border-t flex gap-2">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onChange(allSectors)}>All</Button>
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => onChange([])}>Clear</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
