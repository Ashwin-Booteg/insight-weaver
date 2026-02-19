import { useState, useCallback, useMemo, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { DatasetInfo, FilterState, KPIData, StateMetric, ICPConfig, UploadHistory, INDUSTRY_CATEGORIES } from '@/types/analytics';
import { GEOGRAPHY_PROFILES } from '@/types/geography';
import { parseExcelFile, getUniqueValues, getNumericRange, categorizeIndustry, normalizeStateValue } from '@/utils/dataParser';
import { toast } from 'sonner';

// Fetch ALL rows for a dataset using pagination (no 1000-row limit)
async function fetchAllRows(datasetId: string): Promise<Array<{ row_data: unknown; state_normalized: string | null; industry_category: string | null }>> {
  const pageSize = 1000;
  let from = 0;
  const allRows: Array<{ row_data: unknown; state_normalized: string | null; industry_category: string | null }> = [];

  while (true) {
    const { data, error } = await supabase
      .from('dataset_rows')
      .select('row_data, state_normalized, industry_category')
      .eq('dataset_id', datasetId)
      .range(from, from + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;

    allRows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }

  return allRows;
}

export function useCloudDataset(userId: string | null) {
  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);
  const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);
  const [mergeAll, setMergeAll] = useState(false);
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
      const { data: cloudDatasets, error: fetchError } = await supabase
        .from('datasets')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      if (cloudDatasets && cloudDatasets.length > 0) {
        const datasetsWithRows: DatasetInfo[] = await Promise.all(
          cloudDatasets.map(async (ds) => {
            // Use paginated fetch — no row limit
            const rows = await fetchAllRows(ds.id);

            const rawCols = ds.columns as any;
            const cols = Array.isArray(rawCols) ? rawCols : rawCols?.columns || [];
            const geographyType = Array.isArray(rawCols) ? 'WORLD' : (rawCols?.geographyType || 'WORLD');

            return {
              id: ds.id,
              fileName: ds.file_name,
              uploadedAt: new Date(ds.created_at),
              rowCount: ds.row_count,
              columns: cols,
              data: rows.map(r => ({
                ...r.row_data as Record<string, unknown>,
                _state_normalized: r.state_normalized,
                _industry_category: r.industry_category
              })),
              geographyType
            };
          })
        );

        setDatasets(datasetsWithRows);
        if (datasetsWithRows.length > 0) {
          setActiveDatasetId(datasetsWithRows[0].id);
          // Auto-merge all datasets so the full appended view is always active
          if (datasetsWithRows.length > 1) {
            setMergeAll(true);
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch cloud datasets:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Merged dataset: combine all datasets into one virtual dataset
  const mergedDataset = useMemo((): DatasetInfo | null => {
    if (datasets.length === 0) return null;
    if (datasets.length === 1) return datasets[0];

    // Find a common set of columns across all datasets (by name)
    const allColumnSets = datasets.map(d => new Set((d.columns as any[]).map((c: any) => c.name)));
    const commonColumnNames = [...allColumnSets[0]].filter(name =>
      allColumnSets.every(set => set.has(name))
    );

    // Use columns from first dataset that exist in all
    const mergedColumns = (datasets[0].columns as any[]).filter((c: any) =>
      commonColumnNames.includes(c.name)
    );

    // Merge all rows, tagging each with source file
    const mergedData = datasets.flatMap(ds =>
      ds.data.map(row => ({
        ...row,
        _source_file: ds.fileName
      }))
    );

    const totalRows = mergedData.length;
    const geographyType = datasets[0].geographyType || 'WORLD';

    return {
      id: '__merged__',
      fileName: `${datasets.length} files merged`,
      uploadedAt: new Date(),
      rowCount: totalRows,
      columns: mergedColumns,
      data: mergedData,
      geographyType
    };
  }, [datasets]);

  const activeDataset = useMemo(() => {
    if (mergeAll) return mergedDataset;

    const ds = datasets.find(d => d.id === activeDatasetId) || null;
    if (ds && !Array.isArray(ds.columns)) {
      const raw = ds.columns as any;
      ds.columns = raw?.columns || [];
      if (raw?.geographyType) ds.geographyType = raw.geographyType;
    }
    return ds;
  }, [datasets, activeDatasetId, mergeAll, mergedDataset]);

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
      const datasetInfo = await parseExcelFile(file);

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

      const columnsPayload = { columns: slimColumns, geographyType: datasetInfo.geographyType || 'WORLD' };
      const { data: insertedDataset, error: insertError } = await supabase
        .from('datasets')
        .insert({
          user_id: userId,
          file_name: file.name,
          row_count: datasetInfo.rowCount,
          columns: columnsPayload
        } as any)
        .select()
        .single();

      if (insertError) {
        console.error('Dataset insert error:', insertError);
        throw insertError;
      }

      const stateColumn = datasetInfo.columns.find(c => c.isState);
      const industryColumn = datasetInfo.columns.find(c => c.isIndustry);

      const detectedProfile = datasetInfo.geographyType && GEOGRAPHY_PROFILES[datasetInfo.geographyType]
        ? GEOGRAPHY_PROFILES[datasetInfo.geographyType]
        : GEOGRAPHY_PROFILES.WORLD;

      const rowsToInsert = datasetInfo.data.map(row => ({
        dataset_id: insertedDataset.id,
        row_data: JSON.parse(JSON.stringify(row)),
        state_normalized: stateColumn ? normalizeStateValue(row[stateColumn.name], detectedProfile) : null,
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

      const newDataset: DatasetInfo = {
        id: insertedDataset.id,
        fileName: file.name,
        uploadedAt: new Date(insertedDataset.created_at),
        rowCount: datasetInfo.rowCount,
        columns: datasetInfo.columns,
        data: datasetInfo.data,
        geographyType: datasetInfo.geographyType
      };

      setDatasets(prev => {
        const updated = [newDataset, ...prev];
        // Auto-enable merge if more than one dataset is present
        if (updated.length > 1) setMergeAll(true);
        return updated;
      });
      setActiveDatasetId(newDataset.id);

      const icpColumn = datasetInfo.columns.find(c => c.isICP);
      if (icpColumn) {
        setICPConfig({ mode: 'column', columnName: icpColumn.name });
      }

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

      toast.success(`Appended ${datasetInfo.rowCount.toLocaleString()} records — all data merged`);
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

    if (filters.states.length > 0 && stateColumn) {
      data = data.filter(row => {
        const normalizedState = row[`${stateColumn.name}_normalized`] || row['_state_normalized'];
        return filters.states.includes(normalizedState as string);
      });
    }

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

    if (filters.searchText) {
      const searchLower = filters.searchText.toLowerCase();
      data = data.filter(row =>
        Object.values(row).some(value => {
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        })
      );
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
        if (typeof value === 'number' && !isNaN(value)) totalNumericSum += value;
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
      if (!stateData[stateCode]) stateData[stateCode] = { count: 0, icpCount: 0, companies: new Set() };
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
    const geoType = activeDataset?.geographyType;
    const geoProfile = geoType && GEOGRAPHY_PROFILES[geoType] ? GEOGRAPHY_PROFILES[geoType] : GEOGRAPHY_PROFILES.WORLD;

    return Object.entries(stateData)
      .map(([stateCode, data]) => ({
        stateCode,
        stateName: geoProfile.locationMap[stateCode] || stateCode,
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
    const industries = [...INDUSTRY_CATEGORIES];

    for (const col of activeDataset.columns) {
      if (col.type === 'text' && !col.isState && !col.isCity && !col.isZip && !col.isIndustry && !col.isLevel && !col.isDomain) {
        const uniqueValues = getUniqueValues(activeDataset.data, col.name) as string[];
        if (uniqueValues.length > 0 && uniqueValues.length <= 50) categories[col.name] = uniqueValues;
      }
      if (col.type === 'number') numericRanges[col.name] = getNumericRange(activeDataset.data, col.name);
    }

    return { states, categories, numericRanges, industries, levels: [], domains: [] };
  }, [activeDataset]);

  // Merge summary for UI display
  const mergeSummary = useMemo(() => {
    if (!mergeAll || !mergedDataset) return null;
    return {
      fileCount: datasets.length,
      totalRows: mergedDataset.rowCount,
      label: `${datasets.length} files merged · ${mergedDataset.rowCount.toLocaleString()} rows total`
    };
  }, [mergeAll, mergedDataset, datasets]);

  return {
    datasets,
    activeDataset,
    activeDatasetId,
    setActiveDatasetId,
    mergeAll,
    setMergeAll,
    mergeSummary,
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
