import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatasetInfo, FilterState, KPIData, StateMetric, ICPConfig, UploadHistory, US_STATES, INDUSTRY_CATEGORIES } from '@/types/analytics';
import { parseExcelFile, getUniqueValues, getNumericRange, categorizeIndustry, normalizeStateValue } from '@/utils/dataParser';
import { toast } from 'sonner';

export function useCloudDataset(userId: string | null) {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch datasets from cloud on mount
  useEffect(() => {
    if (userId) {
      fetchCloudDatasets();
    }
  }, [userId]);

  const fetchCloudDatasets = async () => {
    if (!userId) return;
    
    setIsSyncing(true);
    try {
      // Fetch datasets
      const { data: cloudDatasets, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (cloudDatasets && cloudDatasets.length > 0) {
        // Fetch rows for each dataset
        const datasetsWithRows: DatasetInfo[] = await Promise.all(
          cloudDatasets.map(async (ds) => {
            const { data: rows } = await supabase
              .from('dataset_rows')
              .select('row_data, state_normalized, industry_category')
              .eq('dataset_id', ds.id)
              .limit(1000); // Limit for performance

            return {
              id: ds.id,
              fileName: ds.file_name,
              uploadedAt: new Date(ds.created_at),
              rowCount: ds.row_count,
              columns: ds.columns as any[],
              data: (rows || []).map(r => ({
                ...r.row_data as Record<string, unknown>,
                _state_normalized: r.state_normalized,
                _industry_category: r.industry_category
              }))
            };
          })
        );

        setDatasets(datasetsWithRows);
        if (!activeDatasetId && datasetsWithRows.length > 0) {
          setActiveDatasetId(datasetsWithRows[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch cloud datasets:', err);
    } finally {
      setIsSyncing(false);
    }
  };

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

  const uploadFile = useCallback(async (file: File) => {
    if (!userId) {
      toast.error('Please log in to upload files');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Parse Excel file locally first
      const datasetInfo = await parseExcelFile(file);

      // Slim down columns metadata to reduce payload size (remove sample values)
      const slimColumns = datasetInfo.columns.map(col => ({
        name: col.name,
        type: col.type,
        isState: col.isState,
        isCity: col.isCity,
        isZip: col.isZip,
        isICP: col.isICP,
        isCompany: col.isCompany,
        isStatus: col.isStatus,
        isIndustry: col.isIndustry,
        isLevel: col.isLevel,
        isDomain: col.isDomain
      }));

      // Insert dataset record
      const { data: insertedDataset, error: insertError } = await supabase
        .from('datasets')
        .insert({
          user_id: userId,
          file_name: file.name,
          row_count: datasetInfo.rowCount,
          columns: slimColumns
        } as any)
        .select()
        .single();

      if (insertError) {
        console.error('Dataset insert error:', insertError);
        throw insertError;
      }

      // Prepare rows for insertion
      const stateColumn = datasetInfo.columns.find(c => c.isState);
      const industryColumn = datasetInfo.columns.find(c => c.isIndustry);

      const rowsToInsert = datasetInfo.data.map(row => ({
        dataset_id: insertedDataset.id,
        row_data: JSON.parse(JSON.stringify(row)),
        state_normalized: stateColumn ? normalizeStateValue(row[stateColumn.name]) : null,
        industry_category: industryColumn ? categorizeIndustry(row[industryColumn.name]) : null
      }));

      // Insert in batches of 100
      const batchSize = 100;
      for (let i = 0; i < rowsToInsert.length; i += batchSize) {
        const batch = rowsToInsert.slice(i, i + batchSize);
        const { error: rowsError } = await supabase
          .from('dataset_rows')
          .insert(batch as any);

        if (rowsError) throw rowsError;
      }

      // Update local state
      const newDataset: DatasetInfo = {
        id: insertedDataset.id,
        fileName: file.name,
        uploadedAt: new Date(insertedDataset.created_at),
        rowCount: datasetInfo.rowCount,
        columns: datasetInfo.columns,
        data: datasetInfo.data
      };

      setDatasets(prev => [newDataset, ...prev]);
      setActiveDatasetId(newDataset.id);

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

      toast.success(`Uploaded ${datasetInfo.rowCount.toLocaleString()} records to cloud`);
      return newDataset;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const deleteDataset = useCallback(async (id: string) => {
    try {
      const { error } = await supabase
        .from('datasets')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDatasets(prev => prev.filter(d => d.id !== id));
      
      if (activeDatasetId === id) {
        const remaining = datasets.filter(d => d.id !== id);
        setActiveDatasetId(remaining.length > 0 ? remaining[0].id : null);
      }

      toast.success('Dataset deleted');
    } catch (err) {
      toast.error('Failed to delete dataset');
    }
  }, [activeDatasetId, datasets]);

  const filteredData = useMemo(() => {
    if (!activeDataset) return [];

    let data = activeDataset.data;
    const stateColumn = activeDataset.columns.find(c => c.isState);
    const industryColumn = activeDataset.columns.find(c => c.isIndustry);

    // Filter by states
    if (filters.states.length > 0 && stateColumn) {
      data = data.filter(row => {
        const normalizedState = row[`${stateColumn.name}_normalized`] || row['_state_normalized'];
        return filters.states.includes(normalizedState as string);
      });
    }

    // Filter by industries
    if (filters.industries.length > 0 && industryColumn) {
      data = data.filter(row => {
        const normalizedCategory = row[`${industryColumn.name}_category`] || row['_industry_category'];
        if (normalizedCategory && filters.industries.includes(normalizedCategory as string)) {
          return true;
        }

        const industryValue = String(row[industryColumn.name] || '').toLowerCase();
        return filters.industries.some(selectedIndustry => {
          const category = selectedIndustry.toLowerCase();
          if (category.includes('movie') || category.includes('entertainment')) {
            return industryValue.includes('movie') || industryValue.includes('film') || 
                   industryValue.includes('entertainment') || industryValue.includes('cinema');
          }
          if (category.includes('music') || category.includes('audio')) {
            return industryValue.includes('music') || industryValue.includes('audio') || 
                   industryValue.includes('sound') || industryValue.includes('recording');
          }
          if (category.includes('fashion') || category.includes('apparel')) {
            return industryValue.includes('fashion') || industryValue.includes('apparel') || 
                   industryValue.includes('clothing') || industryValue.includes('textile');
          }
          return industryValue.includes(category);
        });
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
    const industryColumn = activeDataset.columns.find(c => c.isIndustry);
    const levelColumn = activeDataset.columns.find(c => c.isLevel);
    const numericColumns = activeDataset.columns.filter(c => c.type === 'number');

    let icpCount = 0;
    if (icpConfig.mode === 'column' && icpConfig.columnName) {
      icpCount = filteredData.filter(row => {
        const value = row[icpConfig.columnName!];
        return value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === 1 || value === '1';
      }).length;
    }

    const uniqueStates = new Set<string>();
    const industryBreakdown: Record<string, number> = {};
    const levelBreakdown: Record<string, number> = {};
    let totalNumericSum = 0;

    for (const row of filteredData) {
      if (stateColumn) {
        const state = row[`${stateColumn.name}_normalized`] || row['_state_normalized'];
        if (state) uniqueStates.add(state as string);
      }

      for (const col of numericColumns) {
        const value = row[col.name];
        if (typeof value === 'number' && !isNaN(value)) {
          totalNumericSum += value;
        }
      }

      if (industryColumn) {
        const industry = row['_industry_category'] || row[`${industryColumn.name}_category`] || String(row[industryColumn.name] || 'Unknown');
        industryBreakdown[industry as string] = (industryBreakdown[industry as string] || 0) + 1;
      }

      if (levelColumn) {
        const level = String(row[levelColumn.name] || 'Unknown');
        levelBreakdown[level] = (levelBreakdown[level] || 0) + 1;
      }
    }

    return {
      totalRecords: filteredData.length,
      totalICP: icpCount,
      totalCompanies: totalNumericSum,
      stateCount: uniqueStates.size,
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
      const stateCode = (row[`${stateColumn.name}_normalized`] || row['_state_normalized']) as string;
      if (!stateCode) continue;

      if (!stateData[stateCode]) {
        stateData[stateCode] = { count: 0, icpCount: 0, companies: new Set() };
      }

      stateData[stateCode].count++;

      if (icpConfig.mode === 'column' && icpConfig.columnName) {
        const value = row[icpConfig.columnName];
        if (value === true || value === 'true' || value === 'yes' || value === 'Yes' || value === 1 || value === '1') {
          stateData[stateCode].icpCount++;
        }
      }

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

    const industryColumn = activeDataset.columns.find(c => c.isIndustry);
    const industries = industryColumn
      ? [...INDUSTRY_CATEGORIES]
      : [...INDUSTRY_CATEGORIES];

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

    return { states, categories, numericRanges, industries, levels: [], domains: [] };
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
    isSyncing,
    error,
    refreshFromCloud: fetchCloudDatasets
  };
}