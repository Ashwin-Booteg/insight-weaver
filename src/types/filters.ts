// Global Filter Types for Wide-Format Data Analytics
// Now supports dynamic geography via GeographyProfile

import { GeographyProfile, GEOGRAPHY_PROFILES, getRegionFromLocation, getLocationsFromRegions as geoGetLocationsFromRegions } from './geography';

// Re-export US_REGIONS for backward compat (but prefer profile.regions)
export const US_REGIONS = GEOGRAPHY_PROFILES.US.regions;

export type RegionName = string; // Dynamic based on detected geography
export type IndustryCategory = 'Movie & Entertainment' | 'Music & Audio' | 'Fashion & Apparel';

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

// Global Filter State
export interface GlobalFilterState {
  states: string[];
  regions: string[];
  selectedRoles: string[];
  selectedIndustries: IndustryCategory[];
  industryFilterMode: 'AND' | 'OR';
  searchText: string;
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
  region: string;
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
  regionBreakdown: Record<string, number>;
  stateBreakdown: Record<string, number>;
}

// Chart data types
export interface RegionIndustryData {
  region: string;
  'Movie & Entertainment': number;
  'Music & Audio': number;
  'Fashion & Apparel': number;
  total: number;
}

export interface RoleRegionData {
  role: string;
  [regionName: string]: string | number; // dynamic region keys + total
}

export interface ParetoDataPoint {
  role: string;
  count: number;
  cumulative: number;
  cumulativePercent: number;
}

// Helper function to get region from state code (uses profile)
export function getRegionFromState(stateCode: string, profile?: GeographyProfile): string | null {
  const p = profile || GEOGRAPHY_PROFILES.US;
  return getRegionFromLocation(stateCode, p);
}

// Helper function to get states from regions (uses profile)
export function getStatesFromRegions(regions: string[], profile?: GeographyProfile): string[] {
  const p = profile || GEOGRAPHY_PROFILES.US;
  return geoGetLocationsFromRegions(regions, p);
}

// Helper function to classify role into industry
export function classifyRoleIndustry(roleName: string): IndustryCategory {
  const lowerRole = roleName.toLowerCase();
  
  for (const keyword of INDUSTRY_KEYWORDS['Fashion & Apparel']) {
    if (lowerRole.includes(keyword.toLowerCase())) {
      return 'Fashion & Apparel';
    }
  }
  
  for (const keyword of INDUSTRY_KEYWORDS['Music & Audio']) {
    if (lowerRole.includes(keyword.toLowerCase())) {
      return 'Music & Audio';
    }
  }
  
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
