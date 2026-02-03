import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useDataset } from '@/hooks/useDataset';
import { FileUpload, UploadHistoryList } from '@/components/FileUpload';
import { KPICards } from '@/components/KPICards';
import { USAMap, MetricSelector } from '@/components/USAMap';
import { FilterPanel } from '@/components/FilterPanel';
import { AutoCharts } from '@/components/AutoCharts';
import { DataTable } from '@/components/DataTable';
import { DataSummary } from '@/components/DataSummary';
import { TopStatesTable } from '@/components/TopStatesTable';
import { ICPConfigDialog } from '@/components/ICPConfigDialog';
import { StateDrilldown } from '@/components/StateDrilldown';
import { IndustryBreakdownChart, LevelBreakdownChart } from '@/components/charts/BreakdownCharts';
import { ActiveFiltersBar } from '@/components/charts/ActiveFiltersBar';
import { BarChart3, Map, Table, Upload, PanelLeftClose, PanelLeft, FileSpreadsheet, LogOut, Loader2, PieChart, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { User, Session } from '@supabase/supabase-js';

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
    filters,
    setFilters,
    filteredData,
    kpiData,
    stateMetrics,
    availableFilters,
    icpConfig,
    setICPConfig,
    isLoading,
    error
  } = useDataset();
  
  const [mapMetricType, setMapMetricType] = useState<'count' | 'percentage' | 'icp'>('count');
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Build active filters list for display
  const activeFiltersList = useMemo(() => {
    const list: { type: 'industry' | 'level' | 'domain' | 'state' | 'category'; value: string }[] = [];
    
    filters.industries.forEach(i => list.push({ type: 'industry', value: i }));
    filters.levels.forEach(l => list.push({ type: 'level', value: l }));
    filters.domains.forEach(d => list.push({ type: 'domain', value: d }));
    filters.states.forEach(s => list.push({ type: 'state', value: s }));
    Object.entries(filters.categories).forEach(([_, values]) => {
      values.forEach(v => list.push({ type: 'category', value: v }));
    });
    
    return list;
  }, [filters]);

  const handleRemoveFilter = (filter: { type: string; value: string }) => {
    switch (filter.type) {
      case 'industry':
        setFilters({ ...filters, industries: filters.industries.filter(i => i !== filter.value) });
        break;
      case 'level':
        setFilters({ ...filters, levels: filters.levels.filter(l => l !== filter.value) });
        break;
      case 'domain':
        setFilters({ ...filters, domains: filters.domains.filter(d => d !== filter.value) });
        break;
      case 'state':
        setFilters({ ...filters, states: filters.states.filter(s => s !== filter.value) });
        break;
      case 'category':
        const newCategories = { ...filters.categories };
        Object.keys(newCategories).forEach(key => {
          newCategories[key] = newCategories[key].filter(v => v !== filter.value);
        });
        setFilters({ ...filters, categories: newCategories });
        break;
    }
  };

  const handleClearAllFilters = () => {
    setFilters({
      states: [],
      dateRange: { start: null, end: null },
      categories: {},
      numericRanges: {},
      searchText: '',
      industries: [],
      levels: [],
      domains: []
    });
  };

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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };
  
  const handleStateClick = (stateCode: string) => {
    setSelectedState(stateCode);
  };
  
  const handleFilterToState = (stateCode: string) => {
    setFilters({ ...filters, states: [stateCode] });
    setSelectedState(null);
  };
  
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
            <p className="text-muted-foreground text-lg">
              Your Intelligent Customer Profile Data Repository
            </p>
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
    <div className="dashboard-layout flex min-h-screen">
      {/* Filter Sidebar */}
      <aside className={cn(
        'w-80 shrink-0 border-r border-border transition-all duration-300 bg-card',
        !showFilters && 'w-0 overflow-hidden'
      )}>
        {showFilters && (
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            availableFilters={availableFilters}
            columns={activeDataset.columns}
          />
        )}
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-card border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className="shrink-0"
              >
                {showFilters ? (
                  <PanelLeftClose className="w-5 h-5" />
                ) : (
                  <PanelLeft className="w-5 h-5" />
                )}
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary to-chart-purple rounded-xl flex items-center justify-center shadow-lg">
                  <BarChart3 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-black text-foreground">
                    <span className="text-primary">Starzopp</span> ICP Bank
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    {activeDataset.fileName} • {filteredData.length.toLocaleString()} of {activeDataset.rowCount.toLocaleString()} records
                  </p>
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
          
          {/* Active Filters Bar */}
          {activeFiltersList.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <ActiveFiltersBar
                filters={activeFiltersList}
                onRemove={handleRemoveFilter}
                onClearAll={handleClearAllFilters}
              />
            </div>
          )}
        </header>
        
        {/* Dashboard Content */}
        <div className="dashboard-main flex-1 overflow-y-auto scrollbar-thin">
          {/* KPI Cards */}
          <section className="mb-6">
            <KPICards data={kpiData} />
          </section>
          
          {/* Main Visualization Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
            <div className="flex items-center justify-between gap-4 mb-4">
              <TabsList className="bg-muted/50">
                <TabsTrigger value="overview" className="gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="charts" className="gap-2">
                  <PieChart className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="w-4 h-4" />
                  Geographic
                </TabsTrigger>
                <TabsTrigger value="summary" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <Table className="w-4 h-4" />
                  Data
                </TabsTrigger>
              </TabsList>
              
              {activeTab === 'map' && (
                <MetricSelector value={mapMetricType} onChange={setMapMetricType} />
              )}
            </div>
            
            {/* Overview Tab - Main Dashboard */}
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Quick Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {/* Industry Breakdown */}
                {kpiData.industryBreakdown && (
                  <IndustryBreakdownChart data={kpiData.industryBreakdown} />
                )}
                
                {/* Level Breakdown */}
                {kpiData.levelBreakdown && (
                  <LevelBreakdownChart data={kpiData.levelBreakdown} />
                )}
                
                {/* Top States Quick View */}
                <div className="chart-container">
                  <h3 className="text-sm font-bold text-foreground mb-4">Top Regions</h3>
                  <TopStatesTable
                    stateMetrics={stateMetrics}
                    onStateClick={handleStateClick}
                    selectedState={selectedState}
                    limit={5}
                  />
                </div>
              </div>
              
              {/* Main Charts */}
              <AutoCharts data={filteredData} columns={activeDataset.columns} />
              
              {/* Data Table Preview */}
              <section>
                <h2 className="text-lg font-bold text-foreground mb-4">Recent Records</h2>
                <DataTable data={filteredData.slice(0, 10)} columns={activeDataset.columns} />
              </section>
            </TabsContent>
            
            {/* Charts Tab - Full Analytics */}
            <TabsContent value="charts" className="mt-0">
              <AutoCharts data={filteredData} columns={activeDataset.columns} />
            </TabsContent>
            
            {/* Map Tab */}
            <TabsContent value="map" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 chart-container">
                  <h3 className="text-sm font-bold text-foreground mb-4">
                    USA Distribution by {mapMetricType === 'count' ? 'Record Count' : mapMetricType === 'percentage' ? '% of Total' : 'ICP Count'}
                  </h3>
                  <USAMap
                    stateMetrics={stateMetrics}
                    metricType={mapMetricType}
                    onStateClick={handleStateClick}
                    selectedState={selectedState}
                  />
                </div>
                
                <TopStatesTable
                  stateMetrics={stateMetrics}
                  onStateClick={handleStateClick}
                  selectedState={selectedState}
                  limit={10}
                />
              </div>
            </TabsContent>
            
            {/* Summary Tab */}
            <TabsContent value="summary" className="mt-0">
              <DataSummary data={filteredData} columns={activeDataset.columns} />
            </TabsContent>
            
            {/* Table Tab */}
            <TabsContent value="table" className="mt-0">
              <DataTable data={filteredData} columns={activeDataset.columns} />
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
