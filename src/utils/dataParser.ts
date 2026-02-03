import * as XLSX from 'xlsx';
import { DataColumn, DatasetInfo, US_STATES, STATE_NAME_TO_CODE } from '@/types/analytics';

export function parseExcelFile(file: File): Promise<DatasetInfo> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
          raw: false,
          dateNF: 'yyyy-mm-dd'
        });
        
        if (jsonData.length === 0) {
          throw new Error('No data found in the Excel file');
        }
        
        const columns = detectColumnTypes(jsonData);
        const normalizedData = normalizeData(jsonData, columns);
        
        const datasetInfo: DatasetInfo = {
          id: generateId(),
          fileName: file.name,
          uploadedAt: new Date(),
          rowCount: normalizedData.length,
          columns,
          data: normalizedData
        };
        
        resolve(datasetInfo);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}

function generateId(): string {
  return `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function detectColumnTypes(data: Record<string, unknown>[]): DataColumn[] {
  const columnNames = Object.keys(data[0]);
  const columns: DataColumn[] = [];
  
  for (const name of columnNames) {
    const sampleValues = data.slice(0, 100).map(row => row[name]);
    const column = analyzeColumn(name, sampleValues);
    columns.push(column);
  }
  
  return columns;
}

function analyzeColumn(name: string, values: unknown[]): DataColumn {
  const lowerName = name.toLowerCase();
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
  
  // Detect location columns
  const stateKeywords = ['state', 'st', 'region', 'province'];
  const cityKeywords = ['city', 'town', 'municipality'];
  const zipKeywords = ['zip', 'postal', 'postcode', 'zipcode'];
  
  const isState = stateKeywords.some(k => lowerName.includes(k)) || 
    nonNullValues.some(v => isUSState(String(v)));
  const isCity = cityKeywords.some(k => lowerName.includes(k));
  const isZip = zipKeywords.some(k => lowerName.includes(k));
  
  // Detect ICP columns
  const icpKeywords = ['icp', 'persona', 'tier', 'fit', 'score', 'ideal'];
  const isICP = icpKeywords.some(k => lowerName.includes(k));
  
  // Detect company columns
  const companyKeywords = ['company', 'organization', 'org', 'business', 'employer', 'account'];
  const isCompany = companyKeywords.some(k => lowerName.includes(k));
  
  // Detect status columns
  const statusKeywords = ['status', 'stage', 'phase', 'lead'];
  const isStatus = statusKeywords.some(k => lowerName.includes(k)) && !isState;
  
  // Detect industry columns
  const industryKeywords = ['industry', 'sector', 'vertical', 'category', 'niche', 'segment'];
  const isIndustry = industryKeywords.some(k => lowerName.includes(k));
  
  // Detect level/tier columns
  const levelKeywords = ['level', 'size', 'tier', 'segment', 'audience', 'target', 'market'];
  const isLevel = levelKeywords.some(k => lowerName.includes(k)) && !isICP;
  
  // Detect domain columns
  const domainKeywords = ['domain', 'type', 'model', 'b2b', 'b2c', 'channel'];
  const isDomain = domainKeywords.some(k => lowerName.includes(k));
  
  // Detect data type
  let type: DataColumn['type'] = 'text';
  
  if (nonNullValues.length > 0) {
    const sample = nonNullValues[0];
    
    if (sample instanceof Date) {
      type = 'date';
    } else if (typeof sample === 'number') {
      type = 'number';
    } else if (typeof sample === 'boolean') {
      type = 'boolean';
    } else if (typeof sample === 'string') {
      // Check if it's a date string
      if (isDateString(sample)) {
        type = 'date';
      } else if (isNumericString(sample)) {
        type = 'number';
      } else if (isState || isCity || isZip) {
        type = 'location';
      }
    }
  }
  
  return {
    name,
    type,
    isState,
    isCity,
    isZip,
    isICP,
    isCompany,
    isStatus,
    isIndustry,
    isLevel,
    isDomain,
    sampleValues: nonNullValues.slice(0, 5) as DataColumn['sampleValues']
  };
}

function isUSState(value: string): boolean {
  const trimmed = value.trim().toUpperCase();
  if (US_STATES[trimmed]) return true;
  
  const lowerValue = value.trim().toLowerCase();
  if (STATE_NAME_TO_CODE[lowerValue]) return true;
  
  return false;
}

function isDateString(value: string): boolean {
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/,
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/,
    /^\d{1,2}-\d{1,2}-\d{2,4}$/,
    /^[A-Za-z]+ \d{1,2}, \d{4}$/
  ];
  
  return datePatterns.some(pattern => pattern.test(value));
}

function isNumericString(value: string): boolean {
  const cleaned = value.replace(/[$,]/g, '').trim();
  return !isNaN(Number(cleaned)) && cleaned !== '';
}

export function normalizeStateValue(value: unknown): string | null {
  if (value === null || value === undefined || value === '') return null;
  
  const strValue = String(value).trim();
  const upperValue = strValue.toUpperCase();
  
  // Check if it's already a state code
  if (US_STATES[upperValue]) return upperValue;
  
  // Check if it's a state name
  const lowerValue = strValue.toLowerCase();
  if (STATE_NAME_TO_CODE[lowerValue]) return STATE_NAME_TO_CODE[lowerValue];
  
  return null;
}

function normalizeData(
  data: Record<string, unknown>[],
  columns: DataColumn[]
): Record<string, unknown>[] {
  const stateColumn = columns.find(c => c.isState);
  
  return data.map(row => {
    const normalizedRow: Record<string, unknown> = { ...row };
    
    // Normalize state values
    if (stateColumn) {
      const stateValue = row[stateColumn.name];
      normalizedRow[`${stateColumn.name}_normalized`] = normalizeStateValue(stateValue);
    }
    
    // Convert numeric strings to numbers
    for (const col of columns) {
      if (col.type === 'number') {
        const value = row[col.name];
        if (typeof value === 'string') {
          const cleaned = value.replace(/[$,]/g, '').trim();
          normalizedRow[col.name] = cleaned === '' ? null : Number(cleaned);
        }
      }
      
      if (col.type === 'date') {
        const value = row[col.name];
        if (typeof value === 'string') {
          const date = new Date(value);
          normalizedRow[col.name] = isNaN(date.getTime()) ? null : date;
        }
      }
    }
    
    return normalizedRow;
  });
}

export function getUniqueValues(data: Record<string, unknown>[], columnName: string): unknown[] {
  const values = new Set<unknown>();
  for (const row of data) {
    const value = row[columnName];
    if (value !== null && value !== undefined && value !== '') {
      values.add(value);
    }
  }
  return Array.from(values).sort();
}

export function getNumericRange(
  data: Record<string, unknown>[],
  columnName: string
): { min: number; max: number } {
  let min = Infinity;
  let max = -Infinity;
  
  for (const row of data) {
    const value = row[columnName];
    if (typeof value === 'number' && !isNaN(value)) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  
  return { min: min === Infinity ? 0 : min, max: max === -Infinity ? 0 : max };
}
