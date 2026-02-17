import { GEOGRAPHY_PROFILES } from './geography';

export interface DataColumn {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'location';
  isState?: boolean;
  isCity?: boolean;
  isZip?: boolean;
  isICP?: boolean;
  isCompany?: boolean;
  isStatus?: boolean;
  isIndustry?: boolean;
  isLevel?: boolean;
  isDomain?: boolean;
  sampleValues?: (string | number | Date | boolean | null)[];
}

export interface DatasetInfo {
  id: string;
  fileName: string;
  uploadedAt: Date;
  rowCount: number;
  columns: DataColumn[];
  data: Record<string, unknown>[];
  geographyType?: string; // Profile ID: 'US', 'IN', 'GB', 'CA', 'WORLD', 'GENERIC'
}

export interface UploadHistory {
  id: string;
  fileName: string;
  uploadedAt: Date;
  rowCount: number;
}

export interface FilterState {
  states: string[];
  dateRange: { start: Date | null; end: Date | null };
  categories: Record<string, string[]>;
  numericRanges: Record<string, { min: number; max: number }>;
  searchText: string;
  industries: string[];
  levels: string[];
  domains: string[];
}

export interface KPIData {
  totalRecords: number;
  totalICP: number;
  totalCompanies: number;
  stateCount: number;
  statusBreakdown?: Record<string, number>;
  industryBreakdown?: Record<string, number>;
  levelBreakdown?: Record<string, number>;
}

export interface StateMetric {
  stateCode: string;
  stateName: string;
  value: number;
  percentage: number;
  icpCount?: number;
  companyCount?: number;
}

export interface ICPConfig {
  mode: 'column' | 'threshold' | 'rules';
  columnName?: string;
  threshold?: number;
  thresholdColumn?: string;
  rules?: ICPRule[];
}

export interface ICPRule {
  column: string;
  operator: 'equals' | 'contains' | 'in' | 'greater' | 'less';
  value: string | number | string[];
}

// Industry categories for filtering - Limited to core entertainment verticals
export const INDUSTRY_CATEGORIES = [
  'Movie & Entertainment',
  'Music & Audio',
  'Fashion & Apparel'
] as const;

// Audience levels for segmentation
export const AUDIENCE_LEVELS = [
  'Enterprise',
  'Mid-Market',
  'SMB',
  'Startup',
  'Individual/Consumer'
] as const;

// Domain categories
export const DOMAIN_CATEGORIES = [
  'B2B',
  'B2C',
  'B2B2C',
  'D2C',
  'Marketplace'
] as const;

// Re-export US_STATES for backward compatibility
export const US_STATES: Record<string, string> = GEOGRAPHY_PROFILES.US.locationMap;

export const STATE_NAME_TO_CODE: Record<string, string> = GEOGRAPHY_PROFILES.US.nameToCode;
