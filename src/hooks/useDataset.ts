import { useState, useCallback, useMemo } from 'react';
import { DatasetInfo, FilterState, KPIData, StateMetric, ICPConfig, UploadHistory, US_STATES } from '@/types/analytics';
import { parseExcelFile, getUniqueValues, getNumericRange } from '@/utils/dataParser';

const STORAGE_KEY = 'analytics_datasets';
const HISTORY_KEY = 'analytics_upload_history';

export function useDataset() {
  const [datasets, setDatasets] = useState<DatasetInfo[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        return parsed.map((d: DatasetInfo) => ({
          ...d,
          uploadedAt: new Date(d.uploadedAt),
          data: d.data.map((row: Record<string, unknown>) => {
            const newRow = { ...row };
            for (const col of d.columns) {
              if (col.type === 'date' && newRow[col.name]) {
                newRow[col.name] = new Date(newRow[col.name] as string);
              }
            }
            return newRow;
          })
        }));
      } catch {
        return [];
      }
    }
    return [];
  });
  
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(() => {
    return datasets.length > 0 ? datasets[0].id : null;
  });
  
  const [filters, setFilters] = useState<FilterState>({
    states: [],
    dateRange: { start: null, end: null },
    categories: {},
    numericRanges: {},
    searchText: ''
  });
  
  const [icpConfig, setICPConfig] = useState<ICPConfig>({ mode: 'column' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const activeDataset = useMemo(() => {
    return datasets.find(d => d.id === activeDatasetId) || null;
  }, [datasets, activeDatasetId]);
  
  const uploadHistory: UploadHistory[] = useMemo(() => {
    return datasets.map(d => ({
      id: d.id,
      fileName: d.fileName,
      uploadedAt: d.uploadedAt,
      rowCount: d.rowCount
    }));
  }, [datasets]);
  
  const saveToStorage = useCallback((newDatasets: DatasetInfo[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newDatasets));
  }, []);
  
  const uploadFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const datasetInfo = await parseExcelFile(file);
      
      setDatasets(prev => {
        const newDatasets = [datasetInfo, ...prev];
        saveToStorage(newDatasets);
        return newDatasets;
      });
      
      setActiveDatasetId(datasetInfo.id);
      
      // Auto-detect ICP column
      const icpColumn = datasetInfo.columns.find(c => c.isICP);
      if (icpColumn) {
        setICPConfig({ mode: 'column', columnName: icpColumn.name });
      }
      
      // Reset filters
      setFilters({
        states: [],
        dateRange: { start: null, end: null },
        categories: {},
        numericRanges: {},
        searchText: ''
      });
      
      return datasetInfo;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse file';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveToStorage]);
  
  const deleteDataset = useCallback((id: string) => {
    setDatasets(prev => {
      const newDatasets = prev.filter(d => d.id !== id);
      saveToStorage(newDatasets);
      return newDatasets;
    });
    
    if (activeDatasetId === id) {
      setActiveDatasetId(datasets.length > 1 ? datasets.find(d => d.id !== id)?.id || null : null);
    }
  }, [activeDatasetId, datasets, saveToStorage]);
  
  const filteredData = useMemo(() => {
    if (!activeDataset) return [];
    
    let data = activeDataset.data;
    const stateColumn = activeDataset.columns.find(c => c.isState);
    
    // Filter by states
    if (filters.states.length > 0 && stateColumn) {
      data = data.filter(row => {
        const normalizedState = row[`${stateColumn.name}_normalized`];
        return filters.states.includes(normalizedState as string);
      });
    }
    
    // Filter by date range
    const dateColumn = activeDataset.columns.find(c => c.type === 'date');
    if (dateColumn && (filters.dateRange.start || filters.dateRange.end)) {
      data = data.filter(row => {
        const dateValue = row[dateColumn.name];
        if (!(dateValue instanceof Date)) return true;
        
        if (filters.dateRange.start && dateValue < filters.dateRange.start) return false;
        if (filters.dateRange.end && dateValue > filters.dateRange.end) return false;
        return true;
      });
    }
    
    // Filter by categories
    for (const [columnName, selectedValues] of Object.entries(filters.categories)) {
      if (selectedValues.length > 0) {
        data = data.filter(row => {
          const value = String(row[columnName] || '');
          return selectedValues.includes(value);
        });
      }
    }
    
    // Filter by numeric ranges
    for (const [columnName, range] of Object.entries(filters.numericRanges)) {
      data = data.filter(row => {
        const value = row[columnName];
        if (typeof value !== 'number') return true;
        return value >= range.min && value <= range.max;
      });
    }
    
    // Filter by search text
    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      data = data.filter(row => {
        return Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }
    
    return data;
  }, [activeDataset, filters]);
  
  const kpiData: KPIData = useMemo(() => {
    if (!activeDataset || filteredData.length === 0) {
      return { totalRecords: 0, totalICP: 0, totalCompanies: 0, stateCount: 0 };
    }
    
    const stateColumn = activeDataset.columns.find(c => c.isState);
    const statusColumn = activeDataset.columns.find(c => c.isStatus);
    
    // Find role/title column for counting
    const roleColumn = activeDataset.columns.find(c => 
      c.name.toLowerCase().includes('role') || 
      c.name.toLowerCase().includes('title') || 
      c.name.toLowerCase().includes('position') ||
      c.name.toLowerCase().includes('designation')
    );
    
    let icpCount = 0;
    if (icpConfig.mode === 'column' && icpConfig.columnName) {
      icpCount = filteredData.filter(row => {
        const value = row[icpConfig.columnName!];
        return value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === 1 || value === '1';
      }).length;
    } else if (icpConfig.mode === 'threshold' && icpConfig.thresholdColumn && icpConfig.threshold !== undefined) {
      icpCount = filteredData.filter(row => {
        const value = row[icpConfig.thresholdColumn!];
        return typeof value === 'number' && value >= icpConfig.threshold!;
      }).length;
    }
    
    const uniqueStates = new Set<string>();
    const statusBreakdown: Record<string, number> = {};
    
    // Count by role and state - sum of all people/customers
    const roleStateCount: Record<string, Record<string, number>> = {};
    let totalCustomers = 0;
    
    for (const row of filteredData) {
      // Count each record as a customer
      totalCustomers++;
      
      if (stateColumn) {
        const state = row[`${stateColumn.name}_normalized`];
        if (state) uniqueStates.add(state as string);
      }
      
      // Track role by state breakdown
      if (roleColumn && stateColumn) {
        const role = String(row[roleColumn.name] || 'Unknown');
        const state = String(row[`${stateColumn.name}_normalized`] || 'Unknown');
        
        if (!roleStateCount[state]) {
          roleStateCount[state] = {};
        }
        roleStateCount[state][role] = (roleStateCount[state][role] || 0) + 1;
      }
      
      if (statusColumn) {
        const status = String(row[statusColumn.name] || 'Unknown');
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      }
    }
    
    return {
      totalRecords: filteredData.length,
      totalICP: icpCount,
      totalCompanies: totalCustomers, // Total customers = sum of all records (roles across states)
      stateCount: uniqueStates.size,
      statusBreakdown: Object.keys(statusBreakdown).length > 0 ? statusBreakdown : undefined
    };
  }, [activeDataset, filteredData, icpConfig]);
  
  const stateMetrics: StateMetric[] = useMemo(() => {
    if (!activeDataset) return [];
    
    const stateColumn = activeDataset.columns.find(c => c.isState);
    if (!stateColumn) return [];
    
    const stateData: Record<string, { count: number; icpCount: number; companies: Set<string> }> = {};
    const companyColumn = activeDataset.columns.find(c => c.isCompany);
    
    for (const row of filteredData) {
      const stateCode = row[`${stateColumn.name}_normalized`] as string;
      if (!stateCode) continue;
      
      if (!stateData[stateCode]) {
        stateData[stateCode] = { count: 0, icpCount: 0, companies: new Set() };
      }
      
      stateData[stateCode].count++;
      
      // Count ICP
      if (icpConfig.mode === 'column' && icpConfig.columnName) {
        const value = row[icpConfig.columnName];
        if (value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === 1 || value === '1') {
          stateData[stateCode].icpCount++;
        }
      }
      
      // Count companies
      if (companyColumn) {
        const company = row[companyColumn.name];
        if (company) stateData[stateCode].companies.add(String(company));
      }
    }
    
    const total = filteredData.length;
    
    return Object.entries(stateData)
      .map(([stateCode, data]) => ({
        stateCode,
        stateName: US_STATES[stateCode] || stateCode,
        value: data.count,
        percentage: total > 0 ? (data.count / total) * 100 : 0,
        icpCount: data.icpCount,
        companyCount: data.companies.size
      }))
      .sort((a, b) => b.value - a.value);
  }, [activeDataset, filteredData, icpConfig]);
  
  const availableFilters = useMemo(() => {
    if (!activeDataset) return { states: [], categories: {}, numericRanges: {} };
    
    const stateColumn = activeDataset.columns.find(c => c.isState);
    const states = stateColumn 
      ? (getUniqueValues(activeDataset.data, `${stateColumn.name}_normalized`) as string[]).filter(s => s)
      : [];
    
    const categories: Record<string, string[]> = {};
    const numericRanges: Record<string, { min: number; max: number }> = {};
    
    for (const col of activeDataset.columns) {
      if (col.type === 'text' && !col.isState && !col.isCity && !col.isZip) {
        const uniqueValues = getUniqueValues(activeDataset.data, col.name) as string[];
        if (uniqueValues.length > 0 && uniqueValues.length <= 50) {
          categories[col.name] = uniqueValues;
        }
      }
      
      if (col.type === 'number') {
        numericRanges[col.name] = getNumericRange(activeDataset.data, col.name);
      }
    }
    
    return { states, categories, numericRanges };
  }, [activeDataset]);
  
  return {
    datasets,
    activeDataset,
    activeDatasetId,
    setActiveDatasetId,
    uploadFile,
    deleteDataset,
    uploadHistory,
    filters,
    setFilters,
    filteredData,
    kpiData,
    stateMetrics,
    availableFilters,
    icpConfig,
    setICPConfig,
    isLoading,
    error
  };
}
