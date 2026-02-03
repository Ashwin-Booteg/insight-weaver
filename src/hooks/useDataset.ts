import { useState, useCallback, useMemo } from 'react';
import { DatasetInfo, FilterState, KPIData, StateMetric, ICPConfig, UploadHistory, US_STATES, INDUSTRY_CATEGORIES, AUDIENCE_LEVELS, DOMAIN_CATEGORIES } from '@/types/analytics';
import { parseExcelFile, getUniqueValues, getNumericRange } from '@/utils/dataParser';

const STORAGE_KEY = 'analytics_datasets';

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
    searchText: '',
    industries: [],
    levels: [],
    domains: []
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
        searchText: '',
        industries: [],
        levels: [],
        domains: []
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
    const industryColumn = activeDataset.columns.find(c => c.isIndustry);
    const levelColumn = activeDataset.columns.find(c => c.isLevel);
    const domainColumn = activeDataset.columns.find(c => c.isDomain);
    
    // Filter by states
    if (filters.states.length > 0 && stateColumn) {
      data = data.filter(row => {
        const normalizedState = row[`${stateColumn.name}_normalized`];
        return filters.states.includes(normalizedState as string);
      });
    }
    
    // Filter by industries
    if (filters.industries.length > 0 && industryColumn) {
      data = data.filter(row => {
        const industry = String(row[industryColumn.name] || '');
        return filters.industries.some(fi => industry.toLowerCase().includes(fi.toLowerCase()));
      });
    }
    
    // Filter by levels
    if (filters.levels.length > 0 && levelColumn) {
      data = data.filter(row => {
        const level = String(row[levelColumn.name] || '');
        return filters.levels.some(fl => level.toLowerCase().includes(fl.toLowerCase()));
      });
    }
    
    // Filter by domains
    if (filters.domains.length > 0 && domainColumn) {
      data = data.filter(row => {
        const domain = String(row[domainColumn.name] || '');
        return filters.domains.some(fd => domain.toLowerCase().includes(fd.toLowerCase()));
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
    const industryColumn = activeDataset.columns.find(c => c.isIndustry);
    const levelColumn = activeDataset.columns.find(c => c.isLevel);
    
    // Get all numeric columns
    const numericColumns = activeDataset.columns.filter(c => c.type === 'number');
    
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
    const industryBreakdown: Record<string, number> = {};
    const levelBreakdown: Record<string, number> = {};
    
    // Sum ALL numeric values across all rows and all numeric columns
    let totalNumericSum = 0;
    
    for (const row of filteredData) {
      if (stateColumn) {
        const state = row[`${stateColumn.name}_normalized`];
        if (state) uniqueStates.add(state as string);
      }
      
      // Sum all numeric values in this row
      for (const col of numericColumns) {
        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          totalNumericSum += value;
        }
      }
      
      if (statusColumn) {
        const status = String(row[statusColumn.name] || 'Unknown');
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      }
      
      if (industryColumn) {
        const industry = String(row[industryColumn.name] || 'Unknown');
        industryBreakdown[industry] = (industryBreakdown[industry] || 0) + 1;
      }
      
      if (levelColumn) {
        const level = String(row[levelColumn.name] || 'Unknown');
        levelBreakdown[level] = (levelBreakdown[level] || 0) + 1;
      }
    }
    
    return {
      totalRecords: filteredData.length,
      totalICP: icpCount,
      totalCompanies: totalNumericSum, // Sum of all numeric values across rows & columns
      stateCount: uniqueStates.size,
      statusBreakdown: Object.keys(statusBreakdown).length > 0 ? statusBreakdown : undefined,
      industryBreakdown: Object.keys(industryBreakdown).length > 0 ? industryBreakdown : undefined,
      levelBreakdown: Object.keys(levelBreakdown).length > 0 ? levelBreakdown : undefined
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
    if (!activeDataset) return { states: [], categories: {}, numericRanges: {}, industries: [], levels: [], domains: [] };
    
    const stateColumn = activeDataset.columns.find(c => c.isState);
    const states = stateColumn 
      ? (getUniqueValues(activeDataset.data, `${stateColumn.name}_normalized`) as string[]).filter(s => s)
      : [];
    
    const categories: Record<string, string[]> = {};
    const numericRanges: Record<string, { min: number; max: number }> = {};
    
    // Get industries from data or use defaults
    const industryColumn = activeDataset.columns.find(c => c.isIndustry);
    const industries = industryColumn 
      ? (getUniqueValues(activeDataset.data, industryColumn.name) as string[]).filter(s => s)
      : [...INDUSTRY_CATEGORIES];
    
    // Get levels from data or use defaults
    const levelColumn = activeDataset.columns.find(c => c.isLevel);
    const levels = levelColumn 
      ? (getUniqueValues(activeDataset.data, levelColumn.name) as string[]).filter(s => s)
      : [...AUDIENCE_LEVELS];
    
    // Get domains from data or use defaults
    const domainColumn = activeDataset.columns.find(c => c.isDomain);
    const domains = domainColumn 
      ? (getUniqueValues(activeDataset.data, domainColumn.name) as string[]).filter(s => s)
      : [...DOMAIN_CATEGORIES];
    
    for (const col of activeDataset.columns) {
      if (col.type === 'text' && !col.isState && !col.isCity && !col.isZip && !col.isIndustry && !col.isLevel && !col.isDomain) {
        const uniqueValues = getUniqueValues(activeDataset.data, col.name) as string[];
        if (uniqueValues.length > 0 && uniqueValues.length <= 50) {
          categories[col.name] = uniqueValues;
        }
      }
      
      if (col.type === 'number') {
        numericRanges[col.name] = getNumericRange(activeDataset.data, col.name);
      }
    }
    
    return { states, categories, numericRanges, industries, levels, domains };
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
