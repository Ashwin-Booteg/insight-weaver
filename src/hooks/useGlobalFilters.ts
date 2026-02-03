import { useState, useMemo, useCallback } from 'react';
import { DataColumn, US_STATES } from '@/types/analytics';
import {
  GlobalFilterState,
  ExtendedKPIData,
  RoleMetadata,
  StateSummary,
  RegionIndustryData,
  RoleRegionData,
  ParetoDataPoint,
  RegionName,
  IndustryCategory,
  US_REGIONS,
  getRegionFromState,
  getStatesFromRegions,
  classifyRoleIndustry,
  initialGlobalFilterState
} from '@/types/filters';

interface UseGlobalFiltersProps {
  data: Record<string, unknown>[];
  columns: DataColumn[];
}

export function useGlobalFilters({ data, columns }: UseGlobalFiltersProps) {
  const [filters, setFilters] = useState<GlobalFilterState>(initialGlobalFilterState);

  // Detect state column and role columns (numeric columns except state)
  const { stateColumn, roleColumns } = useMemo(() => {
    const stateCol = columns.find(c => c.isState);
    // Role columns are all columns that are NOT the state column
    // In wide-format, roles are represented as columns with numeric values
    const roleCols = columns.filter(c => 
      c.type === 'number' && 
      !c.isState && 
      !c.isCity && 
      !c.isZip
    );
    return { stateColumn: stateCol, roleColumns: roleCols };
  }, [columns]);

  // Get all role names with their industry classification
  const roleMetadata: RoleMetadata[] = useMemo(() => {
    if (roleColumns.length === 0) return [];

    const metadata: RoleMetadata[] = [];
    let grandTotal = 0;

    // Calculate total for each role across all data
    for (const col of roleColumns) {
      let roleTotal = 0;
      for (const row of data) {
        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          roleTotal += value;
        }
      }
      grandTotal += roleTotal;
      metadata.push({
        columnName: col.name,
        industry: classifyRoleIndustry(col.name),
        totalPeople: roleTotal,
        percentOfTotal: 0 // Will calculate after we have grandTotal
      });
    }

    // Calculate percentages
    for (const role of metadata) {
      role.percentOfTotal = grandTotal > 0 ? (role.totalPeople / grandTotal) * 100 : 0;
    }

    return metadata.sort((a, b) => b.totalPeople - a.totalPeople);
  }, [data, roleColumns]);

  // Get top 20 roles by total count
  const top20Roles = useMemo(() => {
    return roleMetadata.slice(0, 20).map(r => r.columnName);
  }, [roleMetadata]);

  // Get roles by industry
  const rolesByIndustry = useMemo(() => {
    const byIndustry: Record<IndustryCategory, string[]> = {
      'Movie & Entertainment': [],
      'Music & Audio': [],
      'Fashion & Apparel': []
    };
    
    for (const role of roleMetadata) {
      byIndustry[role.industry].push(role.columnName);
    }
    
    return byIndustry;
  }, [roleMetadata]);

  // Available states from data
  const availableStates = useMemo(() => {
    if (!stateColumn) return [];
    const states = new Set<string>();
    for (const row of data) {
      const stateValue = row[`${stateColumn.name}_normalized`] || row['_state_normalized'];
      if (stateValue && typeof stateValue === 'string') {
        states.add(stateValue);
      }
    }
    return Array.from(states).sort();
  }, [data, stateColumn]);

  // Compute effective selected roles based on industry filter mode
  const effectiveSelectedRoles = useMemo(() => {
    if (filters.selectedIndustries.length === 0 && filters.selectedRoles.length === 0) {
      // No filters = all roles
      return roleColumns.map(c => c.name);
    }

    let industryRoles: string[] = [];
    if (filters.selectedIndustries.length > 0) {
      for (const industry of filters.selectedIndustries) {
        industryRoles.push(...rolesByIndustry[industry]);
      }
    }

    if (filters.selectedRoles.length === 0) {
      // Only industry filter
      return industryRoles;
    }

    if (filters.selectedIndustries.length === 0) {
      // Only role filter
      return filters.selectedRoles;
    }

    // Both filters active
    if (filters.industryFilterMode === 'AND') {
      // Intersection
      return filters.selectedRoles.filter(r => industryRoles.includes(r));
    } else {
      // Union
      return [...new Set([...filters.selectedRoles, ...industryRoles])];
    }
  }, [filters.selectedIndustries, filters.selectedRoles, filters.industryFilterMode, rolesByIndustry, roleColumns]);

  // Compute effective selected states based on region filter
  const effectiveSelectedStates = useMemo(() => {
    let statesFromRegions: string[] = [];
    if (filters.regions.length > 0) {
      statesFromRegions = getStatesFromRegions(filters.regions);
    }

    if (filters.states.length === 0 && filters.regions.length === 0) {
      // No filter = all available states
      return availableStates;
    }

    if (filters.states.length === 0) {
      // Only region filter
      return statesFromRegions.filter(s => availableStates.includes(s));
    }

    if (filters.regions.length === 0) {
      // Only state filter
      return filters.states;
    }

    // Both filters - union of region states and custom states
    return [...new Set([...statesFromRegions, ...filters.states])].filter(s => availableStates.includes(s));
  }, [filters.states, filters.regions, availableStates]);

  // Filtered data based on state selection
  const filteredData = useMemo(() => {
    if (!stateColumn) return data;
    if (effectiveSelectedStates.length === 0 || effectiveSelectedStates.length === availableStates.length) {
      return data;
    }

    return data.filter(row => {
      const stateValue = row[`${stateColumn.name}_normalized`] || row['_state_normalized'];
      return effectiveSelectedStates.includes(stateValue as string);
    });
  }, [data, stateColumn, effectiveSelectedStates, availableStates]);

  // Calculate SelectedRolesTotal for each state
  const stateRoleTotals = useMemo(() => {
    if (!stateColumn) return new Map<string, number>();

    const totals = new Map<string, number>();
    const selectedRoleSet = new Set(effectiveSelectedRoles);

    for (const row of filteredData) {
      const stateValue = (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string;
      if (!stateValue) continue;

      let rowTotal = totals.get(stateValue) || 0;
      for (const col of roleColumns) {
        if (selectedRoleSet.has(col.name)) {
          const value = row[col.name];
          if (typeof value === 'number' && !isNaN(value)) {
            rowTotal += value;
          }
        }
      }
      totals.set(stateValue, rowTotal);
    }

    return totals;
  }, [filteredData, stateColumn, roleColumns, effectiveSelectedRoles]);

  // Extended KPI calculations
  const extendedKPIs: ExtendedKPIData = useMemo(() => {
    const selectedRoleSet = new Set(effectiveSelectedRoles);
    
    // Total people across selected roles and states
    let totalPeople = 0;
    const stateBreakdown: Record<string, number> = {};
    const roleBreakdown: Record<string, number> = {};
    const industryTotals: Record<IndustryCategory, number> = {
      'Movie & Entertainment': 0,
      'Music & Audio': 0,
      'Fashion & Apparel': 0
    };
    const regionTotals: Record<RegionName, number> = {
      Northeast: 0,
      Midwest: 0,
      South: 0,
      West: 0
    };

    // Initialize role breakdown
    for (const role of effectiveSelectedRoles) {
      roleBreakdown[role] = 0;
    }

    for (const row of filteredData) {
      const stateValue = stateColumn 
        ? (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string
        : null;

      for (const col of roleColumns) {
        if (!selectedRoleSet.has(col.name)) continue;

        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          totalPeople += value;
          roleBreakdown[col.name] = (roleBreakdown[col.name] || 0) + value;
          
          // Industry breakdown
          const industry = classifyRoleIndustry(col.name);
          industryTotals[industry] += value;

          // State and region breakdown
          if (stateValue) {
            stateBreakdown[stateValue] = (stateBreakdown[stateValue] || 0) + value;
            const region = getRegionFromState(stateValue);
            if (region) {
              regionTotals[region] += value;
            }
          }
        }
      }
    }

    const statesIncluded = Object.keys(stateBreakdown).length;
    const regionsSet = new Set<RegionName>();
    for (const state of Object.keys(stateBreakdown)) {
      const region = getRegionFromState(state);
      if (region) regionsSet.add(region);
    }

    // Find top and bottom states
    const sortedStates = Object.entries(stateBreakdown).sort((a, b) => b[1] - a[1]);
    const topState = sortedStates[0] ? { state: sortedStates[0][0], count: sortedStates[0][1] } : null;
    const bottomState = sortedStates.length > 0 
      ? { state: sortedStates[sortedStates.length - 1][0], count: sortedStates[sortedStates.length - 1][1] }
      : null;

    // Find top role
    const sortedRoles = Object.entries(roleBreakdown).sort((a, b) => b[1] - a[1]);
    const topRole = sortedRoles[0] ? { role: sortedRoles[0][0], count: sortedRoles[0][1] } : null;

    // Find top industry
    const sortedIndustries = Object.entries(industryTotals).sort((a, b) => b[1] - a[1]) as [IndustryCategory, number][];
    const topIndustry = sortedIndustries[0] 
      ? { industry: sortedIndustries[0][0], count: sortedIndustries[0][1] }
      : null;

    return {
      totalPeople,
      statesIncluded,
      regionsIncluded: regionsSet.size,
      avgPeoplePerState: statesIncluded > 0 ? Math.round(totalPeople / statesIncluded) : 0,
      topStateByPeople: topState,
      bottomStateByPeople: bottomState,
      topRoleByPeople: topRole,
      topIndustryByPeople: topIndustry,
      roleCoverage: effectiveSelectedRoles.length,
      roleBreakdown,
      industryBreakdown: industryTotals,
      regionBreakdown: regionTotals,
      stateBreakdown
    };
  }, [filteredData, stateColumn, roleColumns, effectiveSelectedRoles]);

  // State summaries for table view
  const stateSummaries: StateSummary[] = useMemo(() => {
    if (!stateColumn) return [];

    const selectedRoleSet = new Set(effectiveSelectedRoles);
    const stateData: Record<string, { total: number; roles: Record<string, number> }> = {};

    for (const row of filteredData) {
      const stateValue = (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string;
      if (!stateValue) continue;

      if (!stateData[stateValue]) {
        stateData[stateValue] = { total: 0, roles: {} };
      }

      for (const col of roleColumns) {
        if (!selectedRoleSet.has(col.name)) continue;
        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          stateData[stateValue].total += value;
          stateData[stateValue].roles[col.name] = (stateData[stateValue].roles[col.name] || 0) + value;
        }
      }
    }

    const grandTotal = extendedKPIs.totalPeople;

    return Object.entries(stateData)
      .map(([stateCode, data]) => {
        const sortedRoles = Object.entries(data.roles)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, count]) => ({ name, count }));

        return {
          stateCode,
          stateName: US_STATES[stateCode] || stateCode,
          region: getRegionFromState(stateCode) || 'West' as RegionName,
          selectedRolesTotal: data.total,
          percentOfTotal: grandTotal > 0 ? (data.total / grandTotal) * 100 : 0,
          topRoles: sortedRoles
        };
      })
      .sort((a, b) => b.selectedRolesTotal - a.selectedRolesTotal);
  }, [filteredData, stateColumn, roleColumns, effectiveSelectedRoles, extendedKPIs.totalPeople]);

  // Region × Industry heatmap data
  const regionIndustryData: RegionIndustryData[] = useMemo(() => {
    const selectedRoleSet = new Set(effectiveSelectedRoles);
    const data: Record<RegionName, Record<IndustryCategory, number>> = {
      Northeast: { 'Movie & Entertainment': 0, 'Music & Audio': 0, 'Fashion & Apparel': 0 },
      Midwest: { 'Movie & Entertainment': 0, 'Music & Audio': 0, 'Fashion & Apparel': 0 },
      South: { 'Movie & Entertainment': 0, 'Music & Audio': 0, 'Fashion & Apparel': 0 },
      West: { 'Movie & Entertainment': 0, 'Music & Audio': 0, 'Fashion & Apparel': 0 }
    };

    for (const row of filteredData) {
      const stateValue = stateColumn 
        ? (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string
        : null;
      if (!stateValue) continue;

      const region = getRegionFromState(stateValue);
      if (!region) continue;

      for (const col of roleColumns) {
        if (!selectedRoleSet.has(col.name)) continue;
        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          const industry = classifyRoleIndustry(col.name);
          data[region][industry] += value;
        }
      }
    }

    return Object.entries(data).map(([region, industries]) => ({
      region: region as RegionName,
      ...industries,
      total: Object.values(industries).reduce((a, b) => a + b, 0)
    }));
  }, [filteredData, stateColumn, roleColumns, effectiveSelectedRoles]);

  // Pareto chart data (80/20 rule)
  const paretoData: ParetoDataPoint[] = useMemo(() => {
    const sortedRoles = Object.entries(extendedKPIs.roleBreakdown)
      .sort((a, b) => b[1] - a[1]);
    
    const total = sortedRoles.reduce((sum, [, count]) => sum + count, 0);
    let cumulative = 0;

    return sortedRoles.map(([role, count]) => {
      cumulative += count;
      return {
        role,
        count,
        cumulative,
        cumulativePercent: total > 0 ? (cumulative / total) * 100 : 0
      };
    });
  }, [extendedKPIs.roleBreakdown]);

  // Role × Region data
  const roleRegionData: RoleRegionData[] = useMemo(() => {
    const selectedRoleSet = new Set(effectiveSelectedRoles);
    const data: Record<string, Record<RegionName, number>> = {};

    for (const role of effectiveSelectedRoles) {
      data[role] = { Northeast: 0, Midwest: 0, South: 0, West: 0 };
    }

    for (const row of filteredData) {
      const stateValue = stateColumn 
        ? (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string
        : null;
      if (!stateValue) continue;

      const region = getRegionFromState(stateValue);
      if (!region) continue;

      for (const col of roleColumns) {
        if (!selectedRoleSet.has(col.name)) continue;
        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          data[col.name][region] += value;
        }
      }
    }

    return Object.entries(data)
      .map(([role, regions]) => ({
        role,
        ...regions,
        total: Object.values(regions).reduce((a, b) => a + b, 0)
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  }, [filteredData, stateColumn, roleColumns, effectiveSelectedRoles]);

  // Filter actions
  const setStates = useCallback((states: string[]) => {
    setFilters(prev => ({ ...prev, states }));
  }, []);

  const setRegions = useCallback((regions: RegionName[]) => {
    setFilters(prev => ({ ...prev, regions }));
  }, []);

  const setSelectedRoles = useCallback((roles: string[]) => {
    setFilters(prev => ({ ...prev, selectedRoles: roles }));
  }, []);

  const setSelectedIndustries = useCallback((industries: IndustryCategory[]) => {
    setFilters(prev => ({ ...prev, selectedIndustries: industries }));
  }, []);

  const setIndustryFilterMode = useCallback((mode: 'AND' | 'OR') => {
    setFilters(prev => ({ ...prev, industryFilterMode: mode }));
  }, []);

  const selectTop20Roles = useCallback(() => {
    setFilters(prev => ({ ...prev, selectedRoles: top20Roles }));
  }, [top20Roles]);

  const selectAllStates = useCallback(() => {
    setFilters(prev => ({ ...prev, states: availableStates, regions: [] }));
  }, [availableStates]);

  const clearAllFilters = useCallback(() => {
    setFilters(initialGlobalFilterState);
  }, []);

  return {
    filters,
    setFilters,
    
    // Filter setters
    setStates,
    setRegions,
    setSelectedRoles,
    setSelectedIndustries,
    setIndustryFilterMode,
    
    // Quick actions
    selectTop20Roles,
    selectAllStates,
    clearAllFilters,
    
    // Computed values
    effectiveSelectedStates,
    effectiveSelectedRoles,
    availableStates,
    roleMetadata,
    rolesByIndustry,
    top20Roles,
    
    // Data
    filteredData,
    stateRoleTotals,
    
    // KPIs
    extendedKPIs,
    
    // Chart data
    stateSummaries,
    regionIndustryData,
    paretoData,
    roleRegionData
  };
}
