import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useCloudDataset } from '@/hooks/useCloudDataset';
import { useGlobalFilters } from '@/hooks/useGlobalFilters';
import { FileUpload, UploadHistoryList } from '@/components/FileUpload';
import { ExtendedKPICards } from '@/components/ExtendedKPICards';
import { USAMap, MetricSelector } from '@/components/USAMap';
import { GlobalFilterBar } from '@/components/filters/GlobalFilterBar';
import { DataTable } from '@/components/DataTable';
import { FilteredStateTable, RoleSummaryTable } from '@/components/FilteredStateTable';
import { ICPConfigDialog } from '@/components/ICPConfigDialog';
import { StateDrilldown } from '@/components/StateDrilldown';
import { FilterAwareAIInsights } from '@/components/FilterAwareAIInsights';
import {
  TopStatesChart,
  BottomStatesChart,
  RegionIndustryStackedChart,
  IndustryDonutChart,
  TopRolesChart,
  ParetoChart,
  RoleRegionStackedChart,
  RegionIndustryHeatmap
} from '@/components/charts/AdvancedCharts';
import { SunburstChart } from '@/components/charts/SunburstChart';
import { BarChart3, Map, Table, Upload, LogOut, Loader2, PieChart, TrendingUp, Brain, Cloud, RefreshCw, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Session } from '@supabase/supabase-js';
import { Badge } from '@/components/ui/badge';
import { StateMetric, US_STATES } from '@/types/analytics';
import { getRegionFromState, RegionName, IndustryCategory } from '@/types/filters';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const {
    activeDataset,
    activeDatasetId,
    setActiveDatasetId,
    uploadFile,
    deleteDataset,
    uploadHistory,
    icpConfig,
    setICPConfig,
    isLoading,
    isSyncing,
    error,
    refreshFromCloud
  } = useCloudDataset(user?.id || null);
  
  const [mapMetricType, setMapMetricType] = useState<'count' | 'percentage' | 'icp'>('count');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Use global filters hook
  const {
    filters: globalFilters,
    setStates,
    setRegions,
    setSelectedRoles,
    setSelectedIndustries,
    setIndustryFilterMode,
    selectTop20Roles,
    selectAllStates,
    clearAllFilters,
    effectiveSelectedStates,
    effectiveSelectedRoles,
    availableStates,
    roleMetadata,
    rolesByIndustry,
    top20Roles,
    filteredData,
    extendedKPIs,
    stateSummaries,
    regionIndustryData,
    paretoData,
    roleRegionData
  } = useGlobalFilters({
    data: activeDataset?.data || [],
    columns: activeDataset?.columns || []
  });

  // Compute state metrics for map (based on filtered data)
  const stateMetrics: StateMetric[] = useMemo(() => {
    if (!extendedKPIs.stateBreakdown) return [];
    
    const total = extendedKPIs.totalPeople;
    return Object.entries(extendedKPIs.stateBreakdown)
      .map(([stateCode, count]) => ({
        stateCode,
        stateName: US_STATES[stateCode] || stateCode,
        value: count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        icpCount: 0,
        companyCount: 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [extendedKPIs]);

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
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [authLoading, user, navigate]);

  // Auto-load bundled dataset if no datasets exist
  useEffect(() => {
    if (!authLoading && user && !activeDataset && !isLoading && !isSyncing && uploadHistory.length === 0) {
      const loadBundledData = async () => {
        try {
          const response = await fetch('/data/estimated_music_roles_by_state.xlsx');
          const blob = await response.blob();
          const file = new File([blob], 'US_Creative_Industry_Approximations_By_State_2.xlsx', {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          });
          await uploadFile(file);
        } catch (err) {
          console.error('Failed to auto-load bundled dataset:', err);
        }
      };
      loadBundledData();
    }
  }, [authLoading, user, activeDataset, isLoading, isSyncing, uploadHistory.length]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  
  const handleStateClick = (stateCode: string) => {
    setSelectedState(stateCode);
  };
  
  const handleFilterToState = (stateCode: string) => {
    setStates([stateCode]);
    setSelectedState(null);
  };

  // Chart click-to-filter handlers
  const handleChartStateClick = (stateCode: string) => {
    setStates([stateCode]);
  };

  const handleChartIndustryClick = (industry: IndustryCategory) => {
    setSelectedIndustries([industry]);
  };

  const handleChartRegionClick = (region: RegionName) => {
    setRegions([region]);
  };

  const handleChartRoleClick = (role: string) => {
    setSelectedRoles([role]);
  };

  // Compute active filter labels for chart badges
  const activeFilterLabels = useMemo(() => {
    const labels: string[] = [];
    if (globalFilters.states.length > 0) labels.push(`${globalFilters.states.length} state${globalFilters.states.length > 1 ? 's' : ''}`);
    if (globalFilters.regions.length > 0) labels.push(`${globalFilters.regions.length} region${globalFilters.regions.length > 1 ? 's' : ''}`);
    if (globalFilters.selectedIndustries.length > 0) labels.push(`${globalFilters.selectedIndustries.length} industry`);
    if (globalFilters.selectedRoles.length > 0) labels.push(`${globalFilters.selectedRoles.length} role${globalFilters.selectedRoles.length > 1 ? 's' : ''}`);
    return labels;
  }, [globalFilters]);
  
  const selectedStateMetric = stateMetrics.find(s => s.stateCode === selectedState);

  // Loading auth state
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
  
  // No data uploaded yet - show upload screen
  if (!activeDataset) {
    return (
      <div className="dashboard-layout flex items-center justify-center p-8 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="max-w-xl w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-br from-primary to-chart-purple rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <BarChart3 className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl font-black text-foreground mb-2 tracking-tight">
              Starzopp <span className="text-primary">ICP Bank</span>
            </h1>
            <p className="text-muted-foreground text-lg mb-2">
              Your Intelligent Customer Profile Data Repository
            </p>
            <Badge variant="outline" className="gap-1.5 text-chart-teal border-chart-teal/30">
              <Cloud className="w-3 h-3" />
              Cloud Synced
            </Badge>
          </div>
          
          <FileUpload onUpload={uploadFile} isLoading={isLoading} />
          
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 text-destructive rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <UploadHistoryList
            history={uploadHistory}
            activeId={activeDatasetId}
            onSelect={setActiveDatasetId}
            onDelete={deleteDataset}
          />
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-layout flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-purple rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground">
                <span className="text-primary">Starzopp</span> ICP Bank
              </h1>
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground">
                  {activeDataset.fileName} • {filteredData.length.toLocaleString()} records
                </p>
                {isSyncing && (
                  <Badge variant="outline" className="gap-1 text-xs">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Syncing
                  </Badge>
                )}
                {!isSyncing && (
                  <Badge variant="outline" className="gap-1 text-xs text-chart-teal border-chart-teal/30">
                    <Cloud className="w-3 h-3" />
                    Cloud
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <ICPConfigDialog
              config={icpConfig}
              onConfigChange={setICPConfig}
              columns={activeDataset.columns}
            />
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) await uploadFile(file);
                  e.target.value = '';
                }}
              />
              <Button variant="outline" size="sm" asChild>
                <span>
                  <Upload className="w-4 h-4 mr-2" />
                  New File
                </span>
              </Button>
            </label>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Global Filter Bar */}
      <GlobalFilterBar
        filters={globalFilters}
        availableStates={availableStates}
        roleMetadata={roleMetadata}
        rolesByIndustry={rolesByIndustry}
        top20Roles={top20Roles}
        effectiveSelectedStates={effectiveSelectedStates}
        effectiveSelectedRoles={effectiveSelectedRoles}
        onStatesChange={setStates}
        onRegionsChange={setRegions}
        onRolesChange={setSelectedRoles}
        onIndustriesChange={setSelectedIndustries}
        onIndustryModeChange={setIndustryFilterMode}
        onSelectTop20Roles={selectTop20Roles}
        onSelectAllStates={selectAllStates}
        onClearAll={clearAllFilters}
      />
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin">
        <div className="dashboard-main">
          {/* KPI Cards */}
          <section className="mb-6">
            <ExtendedKPICards data={extendedKPIs} />
          </section>
          
          {/* Main Visualization Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="overview" className="gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="charts" className="gap-2">
                  <PieChart className="w-4 h-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="w-4 h-4" />
                  Geographic
                </TabsTrigger>
                <TabsTrigger value="tables" className="gap-2">
                  <Table className="w-4 h-4" />
                  Tables
                </TabsTrigger>
                <TabsTrigger value="ai-insights" className="gap-2">
                  <Brain className="w-4 h-4" />
                  AI Insights
                </TabsTrigger>
              </TabsList>
              
              {activeTab === 'map' && (
                <MetricSelector value={mapMetricType} onChange={setMapMetricType} />
              )}
            </div>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopStatesChart kpiData={extendedKPIs} onStateClick={handleChartStateClick} activeFilters={activeFilterLabels} />
                <IndustryDonutChart data={extendedKPIs.industryBreakdown} onIndustryClick={handleChartIndustryClick} activeFilters={activeFilterLabels} />
              </div>
              
              {/* Sunburst Hierarchical Chart */}
              <SunburstChart 
                stateBreakdown={extendedKPIs.stateBreakdown}
                roleBreakdown={extendedKPIs.roleBreakdown}
                onRegionFilter={handleChartRegionClick}
                onStateFilter={handleChartStateClick}
              />
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RegionIndustryStackedChart data={regionIndustryData} onRegionClick={handleChartRegionClick} activeFilters={activeFilterLabels} />
                <RegionIndustryHeatmap data={regionIndustryData} onRegionClick={handleChartRegionClick} onIndustryClick={handleChartIndustryClick} activeFilters={activeFilterLabels} />
              </div>

              <TopRolesChart roleBreakdown={extendedKPIs.roleBreakdown} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />
            </TabsContent>
            
            {/* Charts Tab */}
            <TabsContent value="charts" className="mt-0 space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <TopStatesChart kpiData={extendedKPIs} onStateClick={handleChartStateClick} activeFilters={activeFilterLabels} />
                <BottomStatesChart kpiData={extendedKPIs} onStateClick={handleChartStateClick} activeFilters={activeFilterLabels} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <RegionIndustryStackedChart data={regionIndustryData} onRegionClick={handleChartRegionClick} activeFilters={activeFilterLabels} />
                <IndustryDonutChart data={extendedKPIs.industryBreakdown} onIndustryClick={handleChartIndustryClick} activeFilters={activeFilterLabels} />
              </div>

              <TopRolesChart roleBreakdown={extendedKPIs.roleBreakdown} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />
              
              <ParetoChart data={paretoData} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />

              {/* Sunburst Hierarchical Chart */}
              <SunburstChart 
                stateBreakdown={extendedKPIs.stateBreakdown}
                roleBreakdown={extendedKPIs.roleBreakdown}
                onRegionFilter={handleChartRegionClick}
                onStateFilter={handleChartStateClick}
              />

              <RoleRegionStackedChart data={roleRegionData} onRoleClick={handleChartRoleClick} activeFilters={activeFilterLabels} />
            </TabsContent>
            
            {/* Map Tab */}
            <TabsContent value="map" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 chart-container">
                  <h3 className="text-sm font-bold text-foreground mb-4">
                    USA Distribution by {mapMetricType === 'count' ? 'People Count' : mapMetricType === 'percentage' ? '% of Total' : 'ICP Count'}
                  </h3>
                  <USAMap
                    stateMetrics={stateMetrics}
                    metricType={mapMetricType}
                    onStateClick={handleStateClick}
                    selectedState={selectedState}
                  />
                </div>
                
                <div className="chart-container">
                  <h3 className="text-sm font-bold text-foreground mb-4">Top States</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {stateMetrics.slice(0, 15).map((state, idx) => (
                      <button
                        key={state.stateCode}
                        onClick={() => handleStateClick(state.stateCode)}
                        className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors text-left"
                      >
                        <span className="text-xs font-medium text-muted-foreground w-5">{idx + 1}</span>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{state.stateName}</p>
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
            
            {/* Tables Tab */}
            <TabsContent value="tables" className="mt-0 space-y-6">
              <FilteredStateTable
                stateSummaries={stateSummaries}
                roleMetadata={roleMetadata}
                totalPeople={extendedKPIs.totalPeople}
                onStateClick={handleStateClick}
              />
              
              <RoleSummaryTable
                roleMetadata={roleMetadata}
                roleBreakdown={extendedKPIs.roleBreakdown}
              />
            </TabsContent>
            
            {/* AI Insights Tab */}
            <TabsContent value="ai-insights" className="mt-0">
              <FilterAwareAIInsights
                datasetId={activeDatasetId}
                filters={globalFilters}
                kpis={extendedKPIs}
                effectiveStates={effectiveSelectedStates}
                effectiveRoles={effectiveSelectedRoles}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* State Drilldown Modal */}
      <StateDrilldown
        stateCode={selectedState}
        stateName={selectedStateMetric?.stateName || null}
        stateMetric={selectedStateMetric || null}
        data={filteredData}
        columns={activeDataset.columns}
        onClose={() => setSelectedState(null)}
        onFilter={handleFilterToState}
      />
    </div>
  );
};

export default Dashboard;
