
# Unified Multi-Dataset Backend — Append All Excels Into One View

## What The User Is Asking For

Right now, each Excel file you upload is stored separately in the backend. You can only view **one file at a time** — you have to switch between them manually. The user wants all uploaded Excel files to be **combined into a single unified dataset** so the dashboard shows data from every file at once, with full filtering and map support.

---

## Current State (Problems to Fix)

1. **One dataset at a time**: The dashboard shows only the "active" dataset. Switching loses context of other files.
2. **Row limit of 1,000**: When loading from the backend, only 1,000 rows are fetched per dataset — larger files get cut off.
3. **Duplicate datasets**: The database currently has many duplicates from previous uploads of the same file (multiple copies of the Europe and US files).
4. **No merge logic**: There's no concept of combining datasets that share the same column structure (e.g., two Excel files with the same role columns but different countries).

---

## What Will Be Built

### 1. Backend — Smarter Data Loading
- Remove the 1,000-row limit when fetching dataset rows from the backend, using pagination to load all rows correctly.
- Add a **"Source Dataset"** tag to each row in the combined view (so you know which file each row came from).

### 2. Combined Dataset View — "Merge All Compatible"
- Add a **"Merge All"** toggle/button in the dataset manager dialog.
- When enabled, all datasets that share the same column structure get merged into one unified view in the dashboard.
- The system checks if column names match before merging (compatible = same role/location columns).
- Each merged row is tagged with its source filename.

### 3. Dataset Manager UI — Enhanced Dialog
- The current "Upload Dataset" dialog becomes a full **Dataset Manager**:
  - Shows all uploaded files with row counts and upload dates.
  - "Active" badge on the currently selected dataset.
  - **Merge All** button that combines compatible datasets.
  - **Delete** button per file.
  - Upload zone for new files.
- A clear indicator in the header showing: "3 files merged · 122 rows total".

### 4. Dashboard Updates
- The header now shows **merged dataset info** when multiple files are combined.
- KPI cards, maps, and charts all reflect the merged data automatically.
- The filter bar shows all countries/locations from all merged files.

### 5. Fix the Row Limit
- Replace the `limit(1000)` query with paginated loading: fetch rows in batches of 1,000 until all are loaded.
- This ensures large files (e.g., 10,000+ rows) are fully visible.

---

## Technical Details

### Files to Change

```text
src/hooks/useCloudDataset.ts     — Remove row limit, add merge logic, paginated fetch
src/pages/Dashboard.tsx          — Update header to show merged state, pass merged data
src/components/FileUpload.tsx    — Enhance UploadHistoryList with merge toggle + active state
```

### Merge Logic
When the user clicks "Merge All":
- All datasets in their account are fetched from the backend.
- The system checks which ones share a common set of column names (intersection of role columns).
- Compatible datasets are merged by concatenating their rows.
- A `_source_file` field is added to each row for traceability.
- The merged result is used as the active data source for all dashboard components.

### Pagination Fix
```
Current:  .limit(1000)   ← truncates large files
Fixed:    fetch in batches of 1000, loop until no more rows returned
```

### No Database Schema Changes Needed
All data is already stored correctly in `datasets` and `dataset_rows` tables. This is purely a frontend data-loading and merging change.

---

## What You'll See After

- Upload the European Excel → it appears in the dataset manager.
- Click "Merge All" → the dashboard immediately shows all rows from all compatible files combined.
- The world map shows every country from every file.
- KPI cards show totals across all files.
- The header reads: e.g., "2 files merged · 72 rows · World".
- Individual files can still be viewed solo by clicking them in the manager.
