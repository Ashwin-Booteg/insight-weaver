// Global Filter Types for Wide-Format Data Analytics

// US Census Regions
export const US_REGIONS = {
  Northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
  Midwest: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
  South: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'DC', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA', 'OK', 'TX'],
  West: ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA']
} as const;

export type RegionName = keyof typeof US_REGIONS;

// Industry classification keywords
export const INDUSTRY_KEYWORDS = {
  'Fashion & Apparel': [
    'Fashion', 'Apparel', 'Textile', 'Tailor', 'Dressmaker', 'Stylist', 'Model', 
    'Runway', 'Merchandiser', 'Bridal', 'Jewelry', 'Swimwear', 'Activewear', 
    'Costume', 'Wardrobe', 'Makeup', 'Hair'
  ],
  'Music & Audio': [
    'Songwriter', 'Composer', 'Arranger', 'Musician', 'Vocal', 'Beat', 'Mixing', 
    'Engineer', 'Pro Tools', 'MIDI', 'Tour', 'FOH', 'Backline', 'A&R', 
    'Music Supervisor', 'Booking', 'Sync', 'Royalty', 'Podcast', 'DJ', 'Audio'
  ],
  'Movie & Entertainment': [] // Default - everything else falls here
} as const;

export type IndustryCategory = keyof typeof INDUSTRY_KEYWORDS;

// Global Filter State
export interface GlobalFilterState {
  // State filters
  states: string[];
  regions: RegionName[];
  
  // Role filters (columns in wide-format data)
  selectedRoles: string[];
  
  // Industry filters
  selectedIndustries: IndustryCategory[];
  industryFilterMode: 'AND' | 'OR'; // AND = intersection, OR = additive
  
  // Search
  searchText: string;
  
  // Date range
  dateRange: { start: Date | null; end: Date | null };
}

// Role metadata for classification
export interface RoleMetadata {
  columnName: string;
  industry: IndustryCategory;
  totalPeople: number;
  percentOfTotal: number;
}

// State summary for table view
export interface StateSummary {
  stateCode: string;
  stateName: string;
  region: RegionName;
  selectedRolesTotal: number;
  percentOfTotal: number;
  topRoles: { name: string; count: number }[];
}

// Extended KPI data for global filters
export interface ExtendedKPIData {
  totalPeople: number;
  statesIncluded: number;
  regionsIncluded: number;
  avgPeoplePerState: number;
  topStateByPeople: { state: string; count: number } | null;
  bottomStateByPeople: { state: string; count: number } | null;
  topRoleByPeople: { role: string; count: number } | null;
  topIndustryByPeople: { industry: IndustryCategory; count: number } | null;
  roleCoverage: number;
  roleBreakdown: Record<string, number>;
  industryBreakdown: Record<IndustryCategory, number>;
  regionBreakdown: Record<RegionName, number>;
  stateBreakdown: Record<string, number>;
}

// Chart data types
export interface RegionIndustryData {
  region: RegionName;
  'Movie & Entertainment': number;
  'Music & Audio': number;
  'Fashion & Apparel': number;
  total: number;
}

export interface RoleRegionData {
  role: string;
  Northeast: number;
  Midwest: number;
  South: number;
  West: number;
  total: number;
}

export interface ParetoDataPoint {
  role: string;
  count: number;
  cumulative: number;
  cumulativePercent: number;
}

// Helper function to get region from state code
export function getRegionFromState(stateCode: string): RegionName | null {
  for (const [region, states] of Object.entries(US_REGIONS)) {
    if ((states as readonly string[]).includes(stateCode)) {
      return region as RegionName;
    }
  }
  return null;
}

// Helper function to get states from regions
export function getStatesFromRegions(regions: RegionName[]): string[] {
  const states: string[] = [];
  for (const region of regions) {
    states.push(...US_REGIONS[region]);
  }
  return [...new Set(states)];
}

// Helper function to classify role into industry
export function classifyRoleIndustry(roleName: string): IndustryCategory {
  const lowerRole = roleName.toLowerCase();
  
  // Check Fashion & Apparel
  for (const keyword of INDUSTRY_KEYWORDS['Fashion & Apparel']) {
    if (lowerRole.includes(keyword.toLowerCase())) {
      return 'Fashion & Apparel';
    }
  }
  
  // Check Music & Audio
  for (const keyword of INDUSTRY_KEYWORDS['Music & Audio']) {
    if (lowerRole.includes(keyword.toLowerCase())) {
      return 'Music & Audio';
    }
  }
  
  // Default to Movie & Entertainment
  return 'Movie & Entertainment';
}

// Initial filter state
export const initialGlobalFilterState: GlobalFilterState = {
  states: [],
  regions: [],
  selectedRoles: [],
  selectedIndustries: [],
  industryFilterMode: 'AND',
  searchText: '',
  dateRange: { start: null, end: null }
};
