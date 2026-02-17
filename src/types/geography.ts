// Universal Geography System - Dynamic country/region detection

export interface GeographyProfile {
  id: string;
  displayName: string;
  locationLabel: string; // "States", "Provinces", "Countries", etc.
  regionLabel: string; // "Regions", "Zones", etc.
  locationMap: Record<string, string>; // code -> display name
  nameToCode: Record<string, string>; // lowercase name -> code
  regions: Record<string, string[]>; // region name -> location codes
  mapType: 'usa' | 'world' | 'none';
  topoJsonUrl?: string;
}

// ── US Profile ──────────────────────────────────────────────
const US_LOCATION_MAP: Record<string, string> = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia'
};

const US_REGIONS: Record<string, string[]> = {
  Northeast: ['CT', 'ME', 'MA', 'NH', 'RI', 'VT', 'NJ', 'NY', 'PA'],
  Midwest: ['IL', 'IN', 'MI', 'OH', 'WI', 'IA', 'KS', 'MN', 'MO', 'NE', 'ND', 'SD'],
  South: ['DE', 'FL', 'GA', 'MD', 'NC', 'SC', 'VA', 'DC', 'WV', 'AL', 'KY', 'MS', 'TN', 'AR', 'LA', 'OK', 'TX'],
  West: ['AZ', 'CO', 'ID', 'MT', 'NV', 'NM', 'UT', 'WY', 'AK', 'CA', 'HI', 'OR', 'WA']
};

// ── India Profile ──────────────────────────────────────────
const INDIA_LOCATION_MAP: Record<string, string> = {
  'AN': 'Andaman and Nicobar Islands', 'AP': 'Andhra Pradesh', 'AR': 'Arunachal Pradesh',
  'AS': 'Assam', 'BR': 'Bihar', 'CH': 'Chandigarh', 'CT': 'Chhattisgarh',
  'DD': 'Dadra and Nagar Haveli and Daman and Diu', 'DL': 'Delhi', 'GA': 'Goa',
  'GJ': 'Gujarat', 'HR': 'Haryana', 'HP': 'Himachal Pradesh', 'JK': 'Jammu and Kashmir',
  'JH': 'Jharkhand', 'KA': 'Karnataka', 'KL': 'Kerala', 'LA': 'Ladakh',
  'LD': 'Lakshadweep', 'MP': 'Madhya Pradesh', 'MH': 'Maharashtra', 'MN': 'Manipur',
  'ML': 'Meghalaya', 'MZ': 'Mizoram', 'NL': 'Nagaland', 'OR': 'Odisha',
  'PY': 'Puducherry', 'PB': 'Punjab', 'RJ': 'Rajasthan', 'SK': 'Sikkim',
  'TN': 'Tamil Nadu', 'TG': 'Telangana', 'TR': 'Tripura', 'UP': 'Uttar Pradesh',
  'UK': 'Uttarakhand', 'WB': 'West Bengal'
};

const INDIA_REGIONS: Record<string, string[]> = {
  North: ['DL', 'HR', 'HP', 'JK', 'PB', 'RJ', 'UP', 'UK', 'CH', 'LA'],
  South: ['AP', 'KA', 'KL', 'TN', 'TG', 'PY', 'AN', 'LD'],
  East: ['BR', 'JH', 'OR', 'WB'],
  West: ['GA', 'GJ', 'MH', 'MP', 'CT', 'DD'],
  Central: ['MP', 'CT'],
  Northeast: ['AR', 'AS', 'MN', 'ML', 'MZ', 'NL', 'SK', 'TR']
};

// ── UK Profile ─────────────────────────────────────────────
const UK_LOCATION_MAP: Record<string, string> = {
  'ENG': 'England', 'SCT': 'Scotland', 'WLS': 'Wales', 'NIR': 'Northern Ireland'
};

const UK_REGIONS: Record<string, string[]> = {
  England: ['ENG'],
  Scotland: ['SCT'],
  Wales: ['WLS'],
  'Northern Ireland': ['NIR']
};

// ── Canada Profile ─────────────────────────────────────────
const CANADA_LOCATION_MAP: Record<string, string> = {
  'AB': 'Alberta', 'BC': 'British Columbia', 'MB': 'Manitoba',
  'NB': 'New Brunswick', 'NL': 'Newfoundland and Labrador', 'NS': 'Nova Scotia',
  'NT': 'Northwest Territories', 'NU': 'Nunavut', 'ON': 'Ontario',
  'PE': 'Prince Edward Island', 'QC': 'Quebec', 'SK': 'Saskatchewan', 'YT': 'Yukon'
};

const CANADA_REGIONS: Record<string, string[]> = {
  Atlantic: ['NB', 'NL', 'NS', 'PE'],
  Central: ['ON', 'QC'],
  Prairies: ['AB', 'MB', 'SK'],
  'West Coast': ['BC'],
  North: ['NT', 'NU', 'YT']
};

// ── World (Countries) Profile ──────────────────────────────
const WORLD_LOCATION_MAP: Record<string, string> = {
  // North America
  'US': 'United States', 'CA': 'Canada', 'MX': 'Mexico', 'GT': 'Guatemala', 'CU': 'Cuba',
  'HT': 'Haiti', 'DO': 'Dominican Republic', 'HN': 'Honduras', 'NI': 'Nicaragua',
  'CR': 'Costa Rica', 'PA': 'Panama', 'JM': 'Jamaica', 'TT': 'Trinidad and Tobago',
  // Europe
  'GB': 'United Kingdom', 'FR': 'France', 'DE': 'Germany', 'IT': 'Italy', 'ES': 'Spain',
  'PT': 'Portugal', 'NL': 'Netherlands', 'BE': 'Belgium', 'CH': 'Switzerland',
  'AT': 'Austria', 'SE': 'Sweden', 'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland',
  'IE': 'Ireland', 'PL': 'Poland', 'CZ': 'Czech Republic', 'RO': 'Romania',
  'GR': 'Greece', 'HU': 'Hungary', 'SK': 'Slovakia', 'BG': 'Bulgaria',
  'HR': 'Croatia', 'RS': 'Serbia', 'UA': 'Ukraine', 'RU': 'Russia',
  'LT': 'Lithuania', 'LV': 'Latvia', 'EE': 'Estonia', 'SI': 'Slovenia',
  'BA': 'Bosnia and Herzegovina', 'MK': 'North Macedonia', 'AL': 'Albania',
  'ME': 'Montenegro', 'MD': 'Moldova', 'BY': 'Belarus', 'IS': 'Iceland', 'LU': 'Luxembourg',
  'MT': 'Malta', 'CY': 'Cyprus',
  // Asia
  'IN': 'India', 'CN': 'China', 'JP': 'Japan', 'KR': 'South Korea', 'KP': 'North Korea',
  'ID': 'Indonesia', 'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines',
  'MY': 'Malaysia', 'SG': 'Singapore', 'TW': 'Taiwan', 'BD': 'Bangladesh',
  'PK': 'Pakistan', 'LK': 'Sri Lanka', 'NP': 'Nepal', 'MM': 'Myanmar',
  'KH': 'Cambodia', 'LA': 'Laos', 'MN': 'Mongolia', 'AF': 'Afghanistan',
  'UZ': 'Uzbekistan', 'KZ': 'Kazakhstan', 'TM': 'Turkmenistan', 'KG': 'Kyrgyzstan',
  'TJ': 'Tajikistan', 'BN': 'Brunei',
  // Oceania
  'AU': 'Australia', 'NZ': 'New Zealand', 'PG': 'Papua New Guinea', 'FJ': 'Fiji',
  // South America
  'BR': 'Brazil', 'AR': 'Argentina', 'CL': 'Chile', 'CO': 'Colombia',
  'PE': 'Peru', 'VE': 'Venezuela', 'EC': 'Ecuador', 'UY': 'Uruguay',
  'PY': 'Paraguay', 'BO': 'Bolivia', 'GY': 'Guyana', 'SR': 'Suriname',
  // Africa
  'ZA': 'South Africa', 'NG': 'Nigeria', 'KE': 'Kenya', 'EG': 'Egypt',
  'GH': 'Ghana', 'ET': 'Ethiopia', 'TZ': 'Tanzania', 'MA': 'Morocco',
  'DZ': 'Algeria', 'TN': 'Tunisia', 'LY': 'Libya', 'SD': 'Sudan',
  'AO': 'Angola', 'MZ': 'Mozambique', 'MG': 'Madagascar', 'CM': 'Cameroon',
  'CI': "Côte d'Ivoire", 'NE': 'Niger', 'BF': 'Burkina Faso', 'ML': 'Mali',
  'SN': 'Senegal', 'ZW': 'Zimbabwe', 'ZM': 'Zambia', 'MW': 'Malawi',
  'RW': 'Rwanda', 'UG': 'Uganda', 'CD': 'Congo', 'CG': 'Republic of Congo',
  'BW': 'Botswana', 'NA': 'Namibia', 'LS': 'Lesotho', 'SZ': 'Eswatini',
  'GM': 'Gambia', 'GN': 'Guinea', 'SL': 'Sierra Leone', 'LR': 'Liberia',
  'TG': 'Togo', 'BJ': 'Benin', 'MR': 'Mauritania', 'ER': 'Eritrea',
  'DJ': 'Djibouti', 'SO': 'Somalia', 'SS': 'South Sudan', 'CF': 'Central African Republic',
  'TD': 'Chad', 'GA': 'Gabon', 'GQ': 'Equatorial Guinea', 'MU': 'Mauritius',
  // Middle East
  'AE': 'United Arab Emirates', 'SA': 'Saudi Arabia', 'IL': 'Israel',
  'TR': 'Turkey', 'QA': 'Qatar', 'KW': 'Kuwait', 'BH': 'Bahrain',
  'OM': 'Oman', 'JO': 'Jordan', 'LB': 'Lebanon', 'IQ': 'Iraq', 'IR': 'Iran',
  'YE': 'Yemen', 'SY': 'Syria', 'PS': 'Palestine', 'GE': 'Georgia', 'AM': 'Armenia', 'AZ': 'Azerbaijan'
};

const WORLD_REGIONS: Record<string, string[]> = {
  'North America': ['US', 'CA', 'MX', 'GT', 'CU', 'HT', 'DO', 'HN', 'NI', 'CR', 'PA', 'JM', 'TT'],
  'Europe': ['GB', 'FR', 'DE', 'IT', 'ES', 'PT', 'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI', 'IE', 'PL', 'CZ', 'RO', 'GR', 'HU', 'SK', 'BG', 'HR', 'RS', 'UA', 'RU', 'LT', 'LV', 'EE', 'SI', 'BA', 'MK', 'AL', 'ME', 'MD', 'BY', 'IS', 'LU', 'MT', 'CY'],
  'Asia': ['IN', 'CN', 'JP', 'KR', 'KP', 'ID', 'TH', 'VN', 'PH', 'MY', 'SG', 'TW', 'BD', 'PK', 'LK', 'NP', 'MM', 'KH', 'LA', 'MN', 'AF', 'UZ', 'KZ', 'TM', 'KG', 'TJ', 'BN'],
  'Oceania': ['AU', 'NZ', 'PG', 'FJ'],
  'South America': ['BR', 'AR', 'CL', 'CO', 'PE', 'VE', 'EC', 'UY', 'PY', 'BO', 'GY', 'SR'],
  'Africa': ['ZA', 'NG', 'KE', 'EG', 'GH', 'ET', 'TZ', 'MA', 'DZ', 'TN', 'LY', 'SD', 'AO', 'MZ', 'MG', 'CM', 'CI', 'NE', 'BF', 'ML', 'SN', 'ZW', 'ZM', 'MW', 'RW', 'UG', 'CD', 'CG', 'BW', 'NA', 'LS', 'SZ', 'GM', 'GN', 'SL', 'LR', 'TG', 'BJ', 'MR', 'ER', 'DJ', 'SO', 'SS', 'CF', 'TD', 'GA', 'GQ', 'MU'],
  'Middle East': ['AE', 'SA', 'IL', 'TR', 'QA', 'KW', 'BH', 'OM', 'JO', 'LB', 'IQ', 'IR', 'YE', 'SY', 'PS', 'GE', 'AM', 'AZ']
};

// ── Build profiles ─────────────────────────────────────────
function buildNameToCode(locationMap: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [code, name] of Object.entries(locationMap)) {
    result[name.toLowerCase()] = code;
  }
  return result;
}

export const GEOGRAPHY_PROFILES: Record<string, GeographyProfile> = {
  US: {
    id: 'US',
    displayName: 'United States',
    locationLabel: 'States',
    regionLabel: 'Regions',
    locationMap: US_LOCATION_MAP,
    nameToCode: buildNameToCode(US_LOCATION_MAP),
    regions: US_REGIONS,
    mapType: 'usa',
    topoJsonUrl: 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json'
  },
  IN: {
    id: 'IN',
    displayName: 'India',
    locationLabel: 'States',
    regionLabel: 'Zones',
    locationMap: INDIA_LOCATION_MAP,
    nameToCode: buildNameToCode(INDIA_LOCATION_MAP),
    regions: INDIA_REGIONS,
    mapType: 'world'
  },
  GB: {
    id: 'GB',
    displayName: 'United Kingdom',
    locationLabel: 'Nations',
    regionLabel: 'Nations',
    locationMap: UK_LOCATION_MAP,
    nameToCode: buildNameToCode(UK_LOCATION_MAP),
    regions: UK_REGIONS,
    mapType: 'world'
  },
  CA: {
    id: 'CA',
    displayName: 'Canada',
    locationLabel: 'Provinces',
    regionLabel: 'Regions',
    locationMap: CANADA_LOCATION_MAP,
    nameToCode: buildNameToCode(CANADA_LOCATION_MAP),
    regions: CANADA_REGIONS,
    mapType: 'world'
  },
  WORLD: {
    id: 'WORLD',
    displayName: 'World',
    locationLabel: 'Countries',
    regionLabel: 'Continents',
    locationMap: WORLD_LOCATION_MAP,
    nameToCode: buildNameToCode(WORLD_LOCATION_MAP),
    regions: WORLD_REGIONS,
    mapType: 'world',
    topoJsonUrl: 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
  },
  GENERIC: {
    id: 'GENERIC',
    displayName: 'Generic',
    locationLabel: 'Locations',
    regionLabel: 'Groups',
    locationMap: {},
    nameToCode: {},
    regions: {},
    mapType: 'none'
  }
};

// ── Detection ──────────────────────────────────────────────
export function detectGeography(values: string[]): GeographyProfile {
  const cleaned = values
    .filter(v => v != null && v !== '')
    .map(v => String(v).trim())
    .slice(0, 200); // sample

  if (cleaned.length === 0) return GEOGRAPHY_PROFILES.GENERIC;

  const scores: Record<string, number> = {};

  for (const [profileId, profile] of Object.entries(GEOGRAPHY_PROFILES)) {
    if (profileId === 'GENERIC') continue;
    let matches = 0;
    for (const val of cleaned) {
      const upper = val.toUpperCase();
      const lower = val.toLowerCase();
      if (profile.locationMap[upper] || profile.nameToCode[lower]) {
        matches++;
      }
    }
    scores[profileId] = matches / cleaned.length;
  }

  // Find best match (>30% threshold)
  let bestId = 'GENERIC';
  let bestScore = 0.3;
  for (const [id, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestId = id;
    }
  }

  if (bestId === 'GENERIC') {
    // Build a generic profile from the data
    const uniqueVals = [...new Set(cleaned)];
    const genericMap: Record<string, string> = {};
    for (const val of uniqueVals) {
      genericMap[val] = val;
    }
    return {
      ...GEOGRAPHY_PROFILES.GENERIC,
      locationMap: genericMap,
      nameToCode: Object.fromEntries(uniqueVals.map(v => [v.toLowerCase(), v]))
    };
  }

  return GEOGRAPHY_PROFILES[bestId];
}

// ── Helpers ────────────────────────────────────────────────
export function getRegionFromLocation(locationCode: string, profile: GeographyProfile): string | null {
  for (const [region, locations] of Object.entries(profile.regions)) {
    if (locations.includes(locationCode)) return region;
  }
  return null;
}

export function getLocationsFromRegions(regionNames: string[], profile: GeographyProfile): string[] {
  const locations: string[] = [];
  for (const region of regionNames) {
    if (profile.regions[region]) {
      locations.push(...profile.regions[region]);
    }
  }
  return [...new Set(locations)];
}

export function getLocationName(code: string, profile: GeographyProfile): string {
  return profile.locationMap[code] || code;
}

export function normalizeLocationValue(value: unknown, profile: GeographyProfile): string | null {
  if (value == null || value === '') return null;
  const strValue = String(value).trim();
  const upper = strValue.toUpperCase();
  if (profile.locationMap[upper]) return upper;
  const lower = strValue.toLowerCase();
  if (profile.nameToCode[lower]) return profile.nameToCode[lower];
  // For generic, just return the trimmed value
  if (profile.id === 'GENERIC') return strValue;
  return null;
}

// Generate dynamic colors for regions
const REGION_COLOR_PALETTE = [
  'hsl(172, 66%, 50%)', // teal
  'hsl(262, 83%, 58%)', // purple
  'hsl(340, 82%, 52%)', // rose
  'hsl(38, 92%, 50%)',  // amber
  'hsl(200, 80%, 50%)', // blue
  'hsl(150, 60%, 45%)', // green
  'hsl(30, 90%, 55%)',  // orange
  'hsl(280, 70%, 55%)', // violet
  'hsl(10, 80%, 55%)',  // red
  'hsl(190, 70%, 45%)', // cyan
];

export function getRegionColors(profile: GeographyProfile): Record<string, string> {
  const regionNames = Object.keys(profile.regions);
  const colors: Record<string, string> = {};
  for (let i = 0; i < regionNames.length; i++) {
    colors[regionNames[i]] = REGION_COLOR_PALETTE[i % REGION_COLOR_PALETTE.length];
  }
  return colors;
}
