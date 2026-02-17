

# Make the Dashboard Globally Compatible (Any Country, Any Region)

## Problem
The entire system is hardcoded for US data only:
- `US_STATES` dictionary maps 51 US state codes to names
- `US_REGIONS` groups states into 4 US Census regions (Northeast, Midwest, South, West)
- The USA choropleth map only renders US geography
- Region/state filters, KPIs, and charts all assume US state codes
- The data parser only normalizes US state names/codes
- The `classifyRoleIndustry` function is hardcoded to 3 entertainment industries

When you upload data from India, UK, Brazil, or any other country, the system cannot understand or visualize it.

## Solution: Dynamic Geography Detection

Instead of hardcoding regions and countries, the system will **auto-detect the geographic scope** from the uploaded data and adapt all components accordingly.

### How It Works (User Perspective)

1. You upload an Excel file with a column like "State", "Province", "Country", "Region", or "City"
2. The system scans the values and determines whether it is US states, Indian states, UK counties, countries, or generic text regions
3. All charts, filters, KPIs, and maps automatically adapt to the detected geography
4. If the data contains country names, the map switches from US choropleth to a World map
5. If the data contains Indian states, it groups them into Indian regions (North, South, East, West, Central, Northeast)
6. For any unrecognized geography, the system treats the location column as generic categories and still builds all charts without a map

---

## Technical Plan

### 1. New File: `src/types/geography.ts` -- Universal Geography System

Create a geography registry that replaces the hardcoded `US_STATES` and `US_REGIONS`:

- Define a `GeographyProfile` interface with: `countryCode`, `locationMap` (code-to-name), `regions` (region-to-locations grouping), and `displayName`
- Include built-in profiles for: **US** (51 states, 4 Census regions), **India** (28 states + 8 UTs, 6 regions), **UK** (4 nations), **Canada** (13 provinces/territories, 5 regions), **Generic** (fallback)
- Add a `detectGeography(values: string[])` function that samples the location column values, scores them against each profile, and returns the best match
- Add helper functions: `getRegionFromLocation(code, profile)`, `getLocationsFromRegions(regions, profile)`, `getLocationName(code, profile)`

### 2. Modify: `src/types/filters.ts` -- Remove US-Only Types

- Replace `US_REGIONS` constant with a dynamic `regions` field sourced from the detected `GeographyProfile`
- Change `RegionName` from a hardcoded union type to `string` (dynamic based on detected geography)
- Update `getRegionFromState` and `getStatesFromRegions` to accept a `GeographyProfile` parameter
- Rename "state" references to "location" in type names (e.g., `StateSummary` becomes `LocationSummary`) for clarity

### 3. Modify: `src/types/analytics.ts` -- Generalize Location Types

- Replace `US_STATES` and `STATE_NAME_TO_CODE` with imports from the geography system
- Update `StateMetric` to `LocationMetric` (rename `stateCode`/`stateName` to `locationCode`/`locationName`)
- Keep backward compatibility by re-exporting `US_STATES` from the geography module

### 4. Modify: `src/utils/dataParser.ts` -- Auto-Detect Geography on Upload

- After reading the Excel file and detecting a location column (isState/isCity), sample the values
- Call `detectGeography(sampleValues)` to determine the country/geography profile
- Store the detected `geographyType` (e.g., `"US"`, `"IN"`, `"GENERIC"`) as metadata on the `DatasetInfo` object
- Update `normalizeStateValue` to use the matched profile's location map for normalization
- Add new column detection keywords for international data: "province", "prefecture", "county", "territoire", "bundesland"

### 5. Modify: `src/hooks/useGlobalFilters.ts` -- Dynamic Regions

- Accept the detected `GeographyProfile` as input (derived from dataset metadata)
- Replace all `US_REGIONS` references with `profile.regions`
- Replace all `US_STATES` references with `profile.locationMap`
- `getRegionFromState` and `getStatesFromRegions` will use the profile
- `regionIndustryData` and `roleRegionData` will use dynamic region keys from the profile instead of hardcoded Northeast/Midwest/South/West

### 6. Modify: `src/components/USAMap.tsx` -- Conditional Map Rendering

- Rename to `GeoMap.tsx`
- If detected geography is `"US"`: render current USA choropleth (no change)
- If detected geography is a supported country with a TopoJSON map (world, India, etc.): render that map using `react-simple-maps` with the appropriate TopoJSON URL
- If detected geography is `"GENERIC"`: hide the map tab entirely and show a message like "Map not available for this dataset"
- Add a World map option using `https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json` for country-level data

### 7. Modify: `src/components/charts/AdvancedCharts.tsx` -- Dynamic Region Colors and Labels

- Replace hardcoded `REGION_COLORS` with a dynamic color generator that assigns colors based on the profile's region names
- `RegionIndustryStackedChart` and `RoleRegionStackedChart` will read region keys from the profile instead of hardcoded values
- `TopStatesChart` / `BottomStatesChart` will use `profile.locationMap` for display names

### 8. Modify: `src/components/charts/SunburstChart.tsx` -- Dynamic Hierarchy

- Replace hardcoded `US_REGIONS` and `REGION_COLORS` with the detected profile's regions
- The hierarchy remains Region -> Location -> Roles but with dynamic region/location names
- Color generation will use an algorithmic palette based on region count

### 9. Modify: `src/components/filters/GlobalFilterBar.tsx` -- Dynamic Region/State Labels

- Region filter popover: dynamically list regions from the profile (not hardcoded 4)
- State filter popover: show locations from the profile with proper names
- Update labels: "States" becomes "Locations" or the profile-specific term (e.g., "States" for US, "Provinces" for Canada)

### 10. Modify: `src/pages/Dashboard.tsx` -- Pass Geography Profile Through

- Derive the `GeographyProfile` from the active dataset's metadata
- Pass it to `useGlobalFilters`, `GeoMap`, `GlobalFilterBar`, `SunburstChart`, and `AdvancedCharts`
- Update map tab title from "USA Distribution" to dynamic label (e.g., "Geographic Distribution")

### 11. Modify: `src/components/ExtendedKPICards.tsx` -- Dynamic Labels

- Replace "States Included" with "Locations Included"
- Replace "Regions Included" with dynamic label from profile
- Update top/bottom state labels to use profile terminology

### 12. Database: `dataset_rows` table -- No schema change needed

- The `state_normalized` column already stores normalized location codes as text
- The `industry_category` column remains unchanged
- Geography type will be stored in the `datasets.columns` JSONB metadata

---

## Supported Geography Profiles (Built-in)

| Profile | Locations | Regions | Map |
|---------|-----------|---------|-----|
| United States | 51 (states + DC) | 4 (Census regions) | USA choropleth |
| India | 36 (states + UTs) | 6 (North, South, East, West, Central, NE) | World map highlight |
| Canada | 13 (provinces + territories) | 5 (Atlantic, Central, Prairies, West Coast, North) | World map highlight |
| United Kingdom | 4 (nations) | 4 (England, Scotland, Wales, NI) | World map highlight |
| Countries (World) | 195+ | 7 (continents) | World choropleth |
| Generic | Auto-detected from data | Auto-grouped or none | No map |

---

## Files Changed Summary

| File | Action |
|------|--------|
| `src/types/geography.ts` | **NEW** -- Universal geography profiles and detection |
| `src/types/filters.ts` | Modify -- Use dynamic regions, rename state to location |
| `src/types/analytics.ts` | Modify -- Generalize location types |
| `src/utils/dataParser.ts` | Modify -- Auto-detect geography on upload |
| `src/hooks/useGlobalFilters.ts` | Modify -- Accept geography profile, dynamic regions |
| `src/components/USAMap.tsx` | Modify -- Rename to GeoMap, conditional rendering |
| `src/components/charts/AdvancedCharts.tsx` | Modify -- Dynamic region colors/keys |
| `src/components/charts/SunburstChart.tsx` | Modify -- Dynamic hierarchy |
| `src/components/filters/GlobalFilterBar.tsx` | Modify -- Dynamic region/location lists |
| `src/pages/Dashboard.tsx` | Modify -- Pass geography profile |
| `src/components/ExtendedKPICards.tsx` | Modify -- Dynamic labels |
| `src/components/FilteredStateTable.tsx` | Modify -- Dynamic location names |

