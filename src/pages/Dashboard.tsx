import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCloudDataset } from '@/hooks/useCloudDataset';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { FileUpload, UploadHistoryList } from '@/components/FileUpload';
import { ExtendedKPICards } from '@/components/ExtendedKPICards';
import { GeoMap, MetricSelector } from '@/components/GeoMap';
import { GlobalFilterBar } from '@/components/filters/GlobalFilterBar';
import { DataTable } from '@/components/DataTable';
import { FilteredStateTable, RoleSummaryTable } from '@/components/FilteredStateTable';
import { ICPConfigDialog } from '@/components/ICPConfigDialog';
import { StateDrilldown } from '@/components/StateDrilldown';
import { FilterAwareAIInsights } from '@/components/FilterAwareAIInsights';
import {
  TopStatesChart, BottomStatesChart, RegionIndustryStackedChart,
  IndustryDonutChart, TopRolesChart, ParetoChart,
  RoleRegionStackedChart, RegionIndustryHeatmap
} from '@/components/charts/AdvancedCharts';
import { SunburstChart } from '@/components/charts/SunburstChart';
import { BarChart3, Map, Table, Upload, LogOut, Loader2, PieChart, TrendingUp, Brain, Cloud, RefreshCw, LayoutGrid, Database, Plus, Settings2, X, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Session } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { StateMetric } from '@/types/analytics';
import { IndustryCategory } from '@/types/filters';
import { getLocationName } from '@/types/geography';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Dashboard = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manageDialogOpen, setManageDialogOpen] = useState(false);

  const {
    activeDataset, activeDatasetId, setActiveDatasetId,
    uploadFile, deleteDataset, uploadHistory,
    mergeAll, setMergeAll, mergeSummary,
    icpConfig, setICPConfig, isLoading, isSyncing, error, refreshFromCloud
  } = useCloudDataset(user?.id || null);
  
  const [mapMetricType, setMapMetricType] = useState<'count' | 'percentage' | 'icp'>('count');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const {
    filters: globalFilters, profile, regionNames,
    setStates, setRegions, setSelectedRoles, setSelectedIndustries,
    setIndustryFilterMode, selectTop20Roles, selectAllStates, clearAllFilters,
    effectiveSelectedStates, effectiveSelectedRoles,
    availableStates, roleMetadata, rolesByIndustry, top20Roles,
    filteredData, extendedKPIs, stateSummaries,
    regionIndustryData, paretoData, roleRegionData
  } = useGlobalFilters({
    data: activeDataset?.data || [],
    columns: activeDataset?.columns || [],
    geographyType: activeDataset?.geographyType
  });

  const stateMetrics: StateMetric[] = useMemo(() => {
    if (!extendedKPIs.stateBreakdown) return [];
    const total = extendedKPIs.totalPeople;
    return Object.entries(extendedKPIs.stateBreakdown)
      .map(([stateCode, count]) => ({
        stateCode,
        stateName: getLocationName(stateCode, profile),
        value: count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        icpCount: 0, companyCount: 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [extendedKPIs, profile]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!authLoading && !user) navigate('/auth');
  }, [authLoading, user, navigate]);

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/auth'); };
  const handleStateClick = (stateCode: string) => { setSelectedState(stateCode); };
  const handleFilterToState = (stateCode: string) => { setStates([stateCode]); setSelectedState(null); };
  const handleChartStateClick = (stateCode: string) => { setStates([stateCode]); };
  const handleChartIndustryClick = (industry: IndustryCategory) => { setSelectedIndustries([industry]); };
  const handleChartRegionClick = (region: string) => { setRegions([region]); };
  const handleChartRoleClick = (role: string) => { setSelectedRoles([role]); };

  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (globalFilters.states.length > 0) labels.push(`${globalFilters.states.length} ${profile.locationLabel?.toLowerCase() || 'locations'}`);
    if (globalFilters.regions.length > 0) labels.push(`${globalFilters.regions.length} ${profile.regionLabel?.toLowerCase() || 'regions'}`);
    if (globalFilters.selectedIndustries.length > 0) labels.push(`${globalFilters.selectedIndustries.length} industry`);
    if (globalFilters.selectedRoles.length > 0) labels.push(`${globalFilters.selectedRoles.length} roles`);
    return labels;
  }, [globalFilters, profile]);
  
  const selectedStateMetric = stateMetrics.find(s => s.stateCode === selectedState);

  // Compute targeting metrics
  const targetingMetrics = useMemo(() => {
    const totalPeople = extendedKPIs.totalPeople;
    const statesIncluded = extendedKPIs.statesIncluded;
    const roleCount = extendedKPIs.roleCoverage;
    
    // Concentration Index: how concentrated is the workforce (top 3 locations / total)
    const sortedStates = Object.entries(extendedKPIs.stateBreakdown).sort((a, b) => b[1] - a[1]);
    const top3Total = sortedStates.slice(0, 3).reduce((sum, [, count]) => sum + count, 0);
    const concentrationIndex = totalPeople > 0 ? Math.round((top3Total / totalPeople) * 100) : 0;
    
    // Market Penetration: avg people per role
    const avgPerRole = roleCount > 0 ? Math.round(totalPeople / roleCount) : 0;
    
    // Diversity Score: how evenly distributed across regions (1 - Herfindahl index)
    const regionValues = Object.values(extendedKPIs.regionBreakdown);
    const regionTotal = regionValues.reduce((a, b) => a + b, 0);
    const herfindahl = regionTotal > 0
      ? regionValues.reduce((sum, v) => sum + Math.pow(v / regionTotal, 2), 0)
      : 0;
    const diversityScore = Math.round((1 - herfindahl) * 100);
    
    // Top 5 roles share
    const sortedRoles = Object.entries(extendedKPIs.roleBreakdown).sort((a, b) => b[1] - a[1]);
    const top5RolesTotal = sortedRoles.slice(0, 5).reduce((sum, [, count]) => sum + count, 0);
    const top5Share = totalPeople > 0 ? Math.round((top5RolesTotal / totalPeople) * 100) : 0;
    
    // Industry leader
    const sortedIndustries = Object.entries(extendedKPIs.industryBreakdown).sort((a, b) => b[1] - a[1]);
    const topIndustryShare = totalPeople > 0 && sortedIndustries.length > 0
      ? Math.round((sortedIndustries[0][1] / totalPeople) * 100) : 0;

    return {
      concentrationIndex,
      avgPerRole,
      diversityScore,
      top5Share,
      topIndustryShare,
      top3Locations: sortedStates.slice(0, 3).map(([code]) => getLocationName(code, profile)),
      top5Roles: sortedRoles.slice(0, 5).map(([role]) => role),
    };
  }, [extendedKPIs, profile]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const hasData = !!activeDataset;
  
  return (
    <div className="dashboard-layout flex flex-col min-h-screen">
      {/* ── Header ── */}
      <header className="glass border-b border-border px-5 py-3 shrink-0 sticky top-0 z-20">
        <div className="flex items-center justify-between gap-4">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-foreground">Starzopp <span className="text-muted-foreground font-normal">ICP Bank</span></h1>
              <div className="flex items-center gap-2 mt-0.5">
                {hasData ? (
                  <span className="text-[11px] text-muted-foreground">
                    {mergeAll && mergeSummary ? mergeSummary.label : `${activeDataset.fileName} · ${filteredData.length.toLocaleString()} rows`}
                    {' · '}<span className="text-primary/80">{profile.displayName}</span>
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground">No data loaded</span>
                )}
                {isSyncing && <RefreshCw className="w-3 h-3 animate-spin text-muted-foreground" />}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {hasData && <ICPConfigDialog config={icpConfig} onConfigChange={setICPConfig} columns={activeDataset.columns} />}

            {/* Append Data Dialog */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1.5 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium shadow-lg shadow-primary/20">
                  <Plus className="w-3.5 h-3.5" /> Append Data
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border border-border bg-card rounded-2xl p-0 overflow-hidden">
                <div className="p-6 border-b border-border">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Append Data</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                      Upload an Excel file to add it to your data bank. Same filenames are replaced automatically.
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-6">
                  <FileUpload onUpload={async (file) => {
                    await uploadFile(file);
                    setMergeAll(true);
                    setUploadDialogOpen(false);
                  }} isLoading={isLoading} />
                  {error && <p className="mt-3 text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">{error}</p>}
                </div>
              </DialogContent>
            </Dialog>

            {/* Manage datasets */}
            <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground">
                  <Settings2 className="w-3.5 h-3.5" />
                  {uploadHistory.length > 0 && <span className="text-[10px] font-bold bg-muted px-1.5 py-0.5 rounded-full">{uploadHistory.length}</span>}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md border border-border bg-card rounded-2xl p-0 overflow-hidden">
                <div className="p-6 border-b border-border">
                  <DialogHeader>
                    <DialogTitle className="text-base font-semibold">Manage Datasets</DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-1">
                      {uploadHistory.length} file{uploadHistory.length !== 1 ? 's' : ''} in your data bank
                    </DialogDescription>
                  </DialogHeader>
                </div>
                <div className="p-4">
                  {uploadHistory.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">No datasets uploaded yet.</p>
                  ) : (
                    <UploadHistoryList
                      history={uploadHistory}
                      activeId={activeDatasetId}
                      onSelect={(id) => { setActiveDatasetId(id); setMergeAll(false); setManageDialogOpen(false); }}
                      onDelete={deleteDataset}
                      mergeAll={mergeAll}
                      onMergeAllChange={setMergeAll}
                      mergeSummary={mergeSummary}
                    />
                  )}
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="ghost" size="sm"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              title="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-8 rounded-lg text-xs text-muted-foreground hover:text-destructive">
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </header>

      {!hasData ? (
        <div className="flex-1 flex items-center justify-center p-8 dot-grid">
          <div className="text-center max-w-sm animate-fade-in">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
              <Database className="w-7 h-7 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground mb-2">Start with your data</h2>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
              Upload an Excel file to begin analyzing workforce data, ICP profiles, and geographic distribution.
            </p>
            <Button onClick={() => setUploadDialogOpen(true)} className="gap-2 rounded-xl px-6 h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 text-sm font-medium">
              <Upload className="w-4 h-4" /> Append Your First Dataset
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Global Filter Bar */}
          <GlobalFilterBar
            filters={globalFilters} availableStates={availableStates}
            roleMetadata={roleMetadata} rolesByIndustry={rolesByIndustry}
            top20Roles={top20Roles} effectiveSelectedStates={effectiveSelectedStates}
            effectiveSelectedRoles={effectiveSelectedRoles}
            onStatesChange={setStates} onRegionsChange={setRegions}
            onRolesChange={setSelectedRoles} onIndustriesChange={setSelectedIndustries}
            onIndustryModeChange={setIndustryFilterMode}
            onSelectTop20Roles={selectTop20Roles} onSelectAllStates={selectAllStates}
            onClearAll={clearAllFilters} profile={profile}
          />
          
          {/* Main Content */}
          <main className="flex-1 overflow-y-auto scrollbar-thin">
            <div className="dashboard-main">
              <section className="mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-1 h-4 rounded-full bg-primary" />
                  <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Key Metrics</h2>
                </div>
                <ExtendedKPICards data={extendedKPIs} profile={profile} targetingMetrics={targetingMetrics} />
              </section>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <div className="flex items-center justify-between gap-4 mb-5">
                  <TabsList className="bg-card border border-border p-1 rounded-xl h-9 gap-0.5">
                    <TabsTrigger value="overview" className="gap-1.5 rounded-lg text-xs h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"><LayoutGrid className="w-3.5 h-3.5" /> Overview</TabsTrigger>
                    <TabsTrigger value="charts" className="gap-1.5 rounded-lg text-xs h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"><PieChart className="w-3.5 h-3.5" /> Charts</TabsTrigger>
                    {profile.mapType !== 'none' && (
                      <TabsTrigger value="map" className="gap-1.5 rounded-lg text-xs h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"><Map className="w-3.5 h-3.5" /> Map</TabsTrigger>
                    )}
                    <TabsTrigger value="tables" className="gap-1.5 rounded-lg text-xs h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"><Table className="w-3.5 h-3.5" /> Tables</TabsTrigger>
                    <TabsTrigger value="ai-insights" className="gap-1.5 rounded-lg text-xs h-7 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none"><Brain className="w-3.5 h-3.5" /> AI</TabsTrigger>
                  </TabsList>
                  {activeTab === 'map' && <MetricSelector value={mapMetricType} onChange={setMapMetricType} />}
                </div>
                
                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopStatesChart kpiData={extendedKPIs} onStateClick={handleChartStateClick} activeFilters={activeFilterLabels} profile={profile} />
                    <IndustryDonutChart data={extendedKPIs.industryBreakdown} onIndustryClick={handleChartIndustryClick} activeFilters={activeFilterLabels} />
                  </div>
                  <SunburstChart stateBreakdown={extendedKPIs.stateBreakdown} roleBreakdown={extendedKPIs.roleBreakdown}
                    onRegionFilter={handleChartRegionClick} onStateFilter={handleChartStateClick} profile={profile} />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RegionIndustryStackedChart data={regionIndustryData} onRegionClick={handleChartRegionClick} activeFilters={activeFilterLabels} />
                    <RegionIndustryHeatmap data={regionIndustryData} onRegionClick={handleChartRegionClick} onIndustryClick={handleChartIndustryClick} activeFilters={activeFilterLabels} />
                  </div>
                  <TopRolesChart roleBreakdown={extendedKPIs.roleBreakdown} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />
                </TabsContent>
                
                {/* Charts Tab */}
                <TabsContent value="charts" className="mt-0 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <TopStatesChart kpiData={extendedKPIs} onStateClick={handleChartStateClick} activeFilters={activeFilterLabels} profile={profile} />
                    <BottomStatesChart kpiData={extendedKPIs} onStateClick={handleChartStateClick} activeFilters={activeFilterLabels} profile={profile} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <RegionIndustryStackedChart data={regionIndustryData} onRegionClick={handleChartRegionClick} activeFilters={activeFilterLabels} />
                    <IndustryDonutChart data={extendedKPIs.industryBreakdown} onIndustryClick={handleChartIndustryClick} activeFilters={activeFilterLabels} />
                  </div>
                  <TopRolesChart roleBreakdown={extendedKPIs.roleBreakdown} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />
                  <ParetoChart data={paretoData} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />
                  <SunburstChart stateBreakdown={extendedKPIs.stateBreakdown} roleBreakdown={extendedKPIs.roleBreakdown}
                    onRegionFilter={handleChartRegionClick} onStateFilter={handleChartStateClick} profile={profile} />
                  <RoleRegionStackedChart data={roleRegionData} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} profile={profile} />
                </TabsContent>
                
                {/* Map Tab */}
                {profile.mapType !== 'none' && (
                  <TabsContent value="map" className="mt-0">
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                      <div className="xl:col-span-2 chart-container">
                        <h3 className="text-sm font-bold text-foreground mb-4">
                          Global Distribution by {mapMetricType === 'count' ? 'People Count' : mapMetricType === 'percentage' ? '% of Total' : 'ICP Count'}
                        </h3>
                        <GeoMap stateMetrics={stateMetrics} metricType={mapMetricType}
                          onStateClick={handleStateClick} selectedState={selectedState} profile={profile} />
                      </div>
                      <div className="chart-container">
                        <h3 className="text-sm font-bold text-foreground mb-4">Top {profile.locationLabel || 'Countries'}</h3>
                        <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
                          {stateMetrics.slice(0, 15).map((state, idx) => (
                            <button key={state.stateCode} onClick={() => handleStateClick(state.stateCode)}
                              className="w-full flex items-center gap-3 p-2.5 rounded-xl hover:bg-muted/50 transition-all text-left group">
                              <span className="text-xs font-bold text-muted-foreground w-6 text-center">{idx + 1}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors">{state.stateName}</p>
                                <p className="text-xs text-muted-foreground">{state.stateCode}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm font-bold">{state.value.toLocaleString()}</p>
                                <p className="text-xs text-muted-foreground">{state.percentage.toFixed(1)}%</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                )}
                
                {/* Tables Tab */}
                <TabsContent value="tables" className="mt-0 space-y-6">
                  <FilteredStateTable stateSummaries={stateSummaries} roleMetadata={roleMetadata}
                    totalPeople={extendedKPIs.totalPeople} onStateClick={handleStateClick} profile={profile} />
                  <RoleSummaryTable roleMetadata={roleMetadata} roleBreakdown={extendedKPIs.roleBreakdown} />
                </TabsContent>
                
                {/* AI Insights Tab */}
                <TabsContent value="ai-insights" className="mt-0">
                  <FilterAwareAIInsights datasetId={activeDatasetId} filters={globalFilters} kpis={extendedKPIs}
                    effectiveStates={effectiveSelectedStates} effectiveRoles={effectiveSelectedRoles} />
                </TabsContent>
              </Tabs>
            </div>
          </main>
          
          <StateDrilldown stateCode={selectedState} stateName={selectedStateMetric?.stateName || null}
            stateMetric={selectedStateMetric || null} data={filteredData}
            columns={activeDataset.columns} onClose={() => setSelectedState(null)} onFilter={handleFilterToState} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
