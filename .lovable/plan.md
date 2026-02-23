

## Plan: Redesign Production Companies Dashboard for Customer Acquisition

### Problem
The Production Companies page currently shares the same tab structure (Overview, Charts, Maps, Tables) and many workforce-oriented charts (TopStatesChart, IndustryDonutChart, RegionIndustryStackedChart, etc.) that were designed for talent/workforce data. These are irrelevant to a sales/acquisition perspective on production companies.

### Data Available
The dataset contains ~191 production companies across 3 industries (Movie, Music, Fashion) with columns: State, Company Name, City, Specialty, Company Type (Major Studio, Independent, Studio Facility, Private, Public, etc.), and Notable Titles/Artists.

### New Design: Customer Acquisition Dashboard

Replace the 5-tab layout (Overview, Charts, Maps, Tables, AI) for production companies with a **single scrollable page** that has distinct sections focused on acquisition intelligence:

**Section 1: Key Metrics (existing ProductionKPICards, refined)**
- Keep the hero card, industry breakdown, gauges, and highlight picks
- Remove the "Ownership Type", "Geographic Distribution", and "Specialty/Focus" breakdown panels (Row 4) since they duplicate what the new sections below will show better

**Section 2: Acquisition Opportunity Matrix**
- A grid showing each state as a card with: total companies, breakdown by type (Major/Indie/Facility), and an "opportunity score" (states with fewer companies = higher opportunity for new customer outreach)
- Sorted by opportunity score descending

**Section 3: Target Segmentation**
- **By Company Type**: Visual cards showing Major Studios, Independents, Studio Facilities, etc. with count, percentage, top states for each, and a "prospect density" indicator
- **By Specialty**: What specialties exist (Film/TV Production, Animation, Distribution, etc.) and how many companies per specialty -- helps identify niche acquisition targets

**Section 4: Geographic Hotspots**
- Horizontal bar chart of companies per state, color-coded by industry mix
- "Untapped Markets" callout: states with low company counts but high industry diversity

**Section 5: Company Directory** (existing ProductionCompanyTable)
- The full searchable/sortable table, kept as the final section

### Files to Modify

1. **`src/components/SectorPage.tsx`**
   - For `isProduction`, remove the entire `<Tabs>` block (Overview, Charts, Maps, Tables, AI tabs)
   - Replace with a single scrollable layout: ProductionKPICards -> new `ProductionAcquisitionDashboard` component -> ProductionCompanyTable
   - Keep the GlobalFilterBar and header as-is

2. **`src/components/ProductionKPICards.tsx`**
   - Remove Row 4 (the three BreakdownPanel components for Ownership, Geographic, Specialty) since this info moves to the new acquisition sections
   - Keep Rows 1-3 (Hero, Industry cards, Gauges, Highlight Picks) as the top-level KPIs

3. **`src/components/ProductionAcquisitionDashboard.tsx`** (new file)
   - **Acquisition Opportunity Matrix**: For each state, compute an opportunity score (inverse of company density), show as ranked cards with sparkline-style indicators
   - **Target Segmentation**: Company Type cards with state distribution per type; Specialty breakdown with counts
   - **Geographic Hotspots**: Stacked bar chart (recharts) showing companies per state split by Movie/Music/Fashion
   - **Untapped Markets**: Auto-identify states with fewer companies but present across multiple industries
   - Receives `data` and `columns` as props (same as ProductionKPICards)

### Technical Details

- The new `ProductionAcquisitionDashboard` component will reuse the same `computeMetrics`-style approach from ProductionKPICards, extracting State, Company Type, Industry, Specialty, City from each row
- Recharts `BarChart` with stacked bars for the Geographic Hotspots section
- Opportunity score formula: `100 - (stateCompanyCount / maxStateCount * 100)` -- higher score = less saturated market
- All sections are filter-aware (they consume `filteredData` from the parent)
- The AI Insights tab is preserved as a floating button or small section at the bottom for production too

