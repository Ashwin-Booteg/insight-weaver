

## Plan: Fix NaN Fields in Union Data & Eliminate Section-Switch Popup Flash

### Problem 1: NaN in Union Fields

The union dataset stores numeric columns under generic keys (`__EMPTY`, `__EMPTY_1`, `__EMPTY_2`, etc.) and the state column under a very long emoji-prefixed name. The `DataTable` at the bottom of the Unions page renders these raw keys as column headers and displays the first row (which is actually a header row with text like "Movie Unions", "Music Unions") as data. This causes NaN-like display artifacts when numeric formatting is applied to text values, and column names like `__EMPTY` are meaningless to users.

**Root cause**: The raw Excel parse stores the first row as column headers (`__EMPTY` placeholders) and the actual header labels as the first data row. The `UnionAcquisitionDashboard` handles this internally by detecting and skipping header rows, but the generic `DataTable` component does not.

**Fix**: Replace the generic `DataTable` in the union section with a custom union directory table that:
- Maps `__EMPTY` / `__EMPTY_1` / etc. to proper labels: "Movie Unions", "Music Unions", "Fashion Unions", "Total", "Key Unions", "Notes"
- Maps the long state column to just "State"
- Filters out the header row (where `__EMPTY` contains "Movie Unions" text instead of a number)
- Filters out summary rows ("GRAND TOTAL")
- Displays clean numeric values with proper fallback to 0 instead of NaN

### Problem 2: Popup Flash When Switching Sections

When navigating between routes (e.g., Production to Unions), the `SectorPage` component remounts. The cloud dataset hook starts with no data (`activeDataset = null`), so `hasData` is `false`. This briefly renders the empty state (which includes the large upload prompt with icon and "Upload Data" button) before the async fetch completes and populates the data. This is the "popup" that appears for a second then vanishes.

**Root cause**: Line 292 in `SectorPage.tsx` checks `hasData` which is false during the initial data fetch, immediately showing the empty upload state instead of a loading indicator.

**Fix**: When `isSyncing` is true (data is being fetched from the backend), show a loading skeleton/spinner instead of the empty upload prompt. Only show the empty state when syncing is complete AND there is no data.

### Files to Modify

1. **`src/components/SectorPage.tsx`**
   - Change the empty state condition from `!hasData` to `!hasData && !isSyncing`
   - When `!hasData && isSyncing`, show a loading skeleton instead of the upload prompt
   - Replace the `<DataTable>` in the union section with a new `UnionDirectoryTable` component

2. **`src/components/UnionDirectoryTable.tsx`** (new file)
   - A custom table component for union data that properly maps `__EMPTY_*` columns to human-readable names
   - Filters out header/summary rows
   - Includes search, sort, pagination, and CSV/Excel export (matching the existing `ProductionCompanyTable` pattern)
   - Handles NaN gracefully by defaulting to 0 for numeric fields and "-" for empty text fields

### Technical Details

- The empty-state guard changes from:
  ```
  {!hasData ? (<empty upload UI>) : (<dashboard>)}
  ```
  to:
  ```
  {!hasData && isSyncing ? (<loading skeleton>) : !hasData ? (<empty upload UI>) : (<dashboard>)}
  ```
- The `UnionDirectoryTable` will detect column mappings using the same `detectColumns` logic already in `UnionAcquisitionDashboard`, ensuring consistency
- All `Number()` conversions will use `|| 0` fallback to prevent NaN display

