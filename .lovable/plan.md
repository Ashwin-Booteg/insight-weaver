

# Three-Section Industry Classification: Production Companies, Unions, and Guilds

## Overview
Restructure the dashboard to display data across three distinct organizational sections -- **Production Companies**, **Unions**, and **Guilds & Associations** -- each with its own KPI cards, charts, and breakdowns. Roles will be auto-classified using keyword matching.

---

## Section Breakdown

### 1. Production Companies
The existing three sub-categories stay:
- Movie & Entertainment
- Music & Audio
- Fashion & Apparel

### 2. Unions
Labor unions and trade organizations representing workers:
- Keywords: `Union`, `Local`, `IATSE`, `Teamster`, `Stagehand`, `Grip`, `Electrician`, `Carpenter`, `Prop`, `Scenic`, `Paint`, `Rigger`, `Loader`

### 3. Guilds & Associations
Professional guilds and membership associations:
- Keywords: `Guild`, `SAG`, `AFTRA`, `DGA`, `WGA`, `PGA`, `Academy`, `Society`, `Association`, `Member`, `Fellow`, `Chapter`, `Council`

Roles not matching Union or Guild keywords fall into Production Companies (current default behavior).

---

## Changes

### A. Type System (`src/types/filters.ts`)
- Add a new top-level type `OrgSector = 'Production Companies' | 'Unions' | 'Guilds & Associations'`
- Add `SECTOR_KEYWORDS` dictionary with keywords for Unions and Guilds (Production remains the default)
- Add `classifyRoleSector(roleName)` function
- Extend `RoleMetadata` with a `sector: OrgSector` field
- Extend `ExtendedKPIData` with `sectorBreakdown: Record<OrgSector, number>`
- Extend `GlobalFilterState` with `selectedSectors: OrgSector[]`

### B. Filter Hook (`src/hooks/useGlobalFilters.ts`)
- Compute `rolesBySector` grouping (similar to existing `rolesByIndustry`)
- Add `sectorBreakdown` to `extendedKPIs` computation
- Add `setSectors` filter action
- When sectors are selected, filter `effectiveSelectedRoles` to only roles in those sectors

### C. New Component: `SectorDashboardSections.tsx`
A component rendering 3 collapsible/tabbed sections, each containing:
- A section header with icon, sector name, total people count, and role count
- A mini KPI row (total people, top role, top location, industry split for Production)
- A horizontal bar chart of top 10 roles in that sector
- A region breakdown bar for that sector's data

### D. Dashboard Integration (`src/pages/Dashboard.tsx`)
- Add `SectorDashboardSections` between the KPI cards and the Tabs
- Pass filtered data, role metadata, and KPIs per sector
- Add sector filter chips to the `GlobalFilterBar`

### E. Filter Bar Update (`src/components/filters/GlobalFilterBar.tsx`)
- Add a "Sector" filter section with 3 checkboxes (Production Companies, Unions, Guilds & Associations)
- Selecting a sector filters roles/KPIs to only that sector's roles

### F. Analytics Type Update (`src/types/analytics.ts`)
- Add `SECTOR_CATEGORIES` constant for the 3 sectors

---

## Technical Notes

- The keyword-based classification runs in the same `classifyRoleSector()` pattern as the existing `classifyRoleIndustry()` -- it checks Union keywords first, then Guild keywords, then defaults to Production Companies.
- For Production Company roles, the existing industry sub-classification (Movie/Music/Fashion) still applies and is shown as a nested breakdown within the Production section.
- All existing charts, maps, and tables continue to work unchanged -- the new sections are additive.
- No database changes required; classification is computed client-side from column names.

