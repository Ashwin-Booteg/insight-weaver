import React, { useState } from 'react';
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
import { BarChart3, Map, Table, Upload, PanelLeftClose, PanelLeft, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const Dashboard = () => {
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
  const [activeTab, setActiveTab] = useState('summary');
  
  const handleStateClick = (stateCode: string) => {
    setSelectedState(stateCode);
  };
  
  const handleFilterToState = (stateCode: string) => {
    setFilters({ ...filters, states: [stateCode] });
    setSelectedState(null);
  };
  
  const selectedStateMetric = stateMetrics.find(s => s.stateCode === selectedState);
  
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
        'w-72 shrink-0 border-r border-border transition-all duration-300 bg-card',
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
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-chart-purple rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-foreground">
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
            </div>
          </div>
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
              <TabsList>
                <TabsTrigger value="summary" className="gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="map" className="gap-2">
                  <Map className="w-4 h-4" />
                  Map
                </TabsTrigger>
                <TabsTrigger value="charts" className="gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Charts
                </TabsTrigger>
                <TabsTrigger value="table" className="gap-2">
                  <Table className="w-4 h-4" />
                  Table
                </TabsTrigger>
              </TabsList>
              
              {activeTab === 'map' && (
                <MetricSelector value={mapMetricType} onChange={setMapMetricType} />
              )}
            </div>
            
            <TabsContent value="summary" className="mt-0">
              <DataSummary data={filteredData} columns={activeDataset.columns} />
            </TabsContent>
            
            <TabsContent value="map" className="mt-0">
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 chart-container">
                  <h3 className="text-sm font-semibold text-foreground mb-4">
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
            
            <TabsContent value="charts" className="mt-0">
              <AutoCharts data={filteredData} columns={activeDataset.columns} />
            </TabsContent>
            
            <TabsContent value="table" className="mt-0">
              <DataTable data={filteredData} columns={activeDataset.columns} />
            </TabsContent>
          </Tabs>
          
          {/* Charts Section (visible when on map tab) */}
          {activeTab === 'map' && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Data Insights</h2>
              <AutoCharts data={filteredData} columns={activeDataset.columns} />
            </section>
          )}
          
          {/* Data Table (visible when on map or charts tab) */}
          {activeTab !== 'table' && (
            <section className="mt-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Records</h2>
              <DataTable data={filteredData} columns={activeDataset.columns} />
            </section>
          )}
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
