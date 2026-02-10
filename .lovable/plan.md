

# Make Charts Fully Dynamic and Cross-Interactive with Filters

## Current State
The charts already recompute when you change filters in the Global Filter Bar (regions, states, industries, roles). However, the interactivity is one-directional: you set filters in the bar, and charts update. What's missing is **chart-to-filter** interactivity -- clicking a chart element (e.g., a region bar, an industry slice, or a state bar) should instantly apply that as a filter, making all other charts, KPIs, tables, and the map update accordingly.

## What Will Change

### 1. Click-to-Filter on All Charts
Every chart will become interactive -- clicking on a data point applies it as a global filter:

- **Top/Bottom States Bar Charts**: Click a state bar to filter the entire dashboard to that state
- **Industry Donut Chart**: Click a slice to filter by that industry (Movie, Music, or Fashion)
- **Region x Industry Stacked Bar**: Click a region bar to filter by that region
- **Top Roles Bar Chart**: Click a role bar to filter by that role
- **Pareto Chart**: Click a role bar to filter by that role
- **Role x Region Stacked Chart**: Click a role bar to filter by that role
- **Sunburst Chart**: Clicking a region/state segment will apply it as a filter (in addition to the existing drill-down)
- **Heatmap cells**: Click a cell to filter by both the region and industry

### 2. Active Filter Indicator on Charts
Each chart will show a small badge or highlight when the dashboard is being filtered, so you know which filters are active and affecting the displayed data.

### 3. "Filter to this" Button on State Drilldown
The existing state drilldown modal already has a "Filter to State" button. This will continue working and will be enhanced to also pass the selected state to all chart computations.

## Technical Details

### Files to Modify

**`src/components/charts/AdvancedCharts.tsx`**
- Add `onStateClick`, `onIndustryClick`, `onRegionClick`, `onRoleClick` callback props to each chart component
- Wire up `onClick` handlers on Bar, Pie Cell, and Heatmap elements
- Add cursor-pointer styling and hover feedback on interactive elements

**`src/pages/Dashboard.tsx`**
- Create handler functions that translate chart clicks into global filter updates:
  - `handleChartStateClick(stateCode)` -- calls `setStates([stateCode])`
  - `handleChartIndustryClick(industry)` -- calls `setSelectedIndustries([industry])`
  - `handleChartRegionClick(region)` -- calls `setRegions([region])`
  - `handleChartRoleClick(role)` -- calls `setSelectedRoles([role])`
- Pass these handlers as props to all chart components

**`src/components/charts/SunburstChart.tsx`**
- Add optional `onRegionFilter` and `onStateFilter` callbacks
- When a user clicks a region or state segment, optionally apply it as a global filter (with a small filter icon overlay)

### How It Works (User Flow)

1. User sees all data on the dashboard (no filters active)
2. User clicks "California" on the Top States bar chart
3. The global filter updates to `states: ['CA']`
4. All KPIs, charts, map, tables, and AI insights instantly recompute to show only California data
5. The Global Filter Bar shows "CA" as an active state filter with a clear button
6. User can click "Clear All" in the filter bar to reset

No new dependencies required. All changes use existing filter infrastructure.

