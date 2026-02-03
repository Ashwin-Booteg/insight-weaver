import React, { useState } from 'react';
import { Sparkles, TrendingUp, Target, AlertTriangle, Lightbulb, ChevronDown, ChevronUp, Loader2, Brain, Zap, MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface AIInsightsProps {
  datasetId: string | null;
  dataSample: Record<string, unknown>[];
  filters: {
    industries: string[];
    states: string[];
  };
  kpis: {
    totalRecords: number;
    totalICP: number;
    stateCount: number;
    industryBreakdown?: Record<string, number>;
    levelBreakdown?: Record<string, number>;
  };
}

interface InsightsData {
  summary: string;
  topIndustries: Array<{ name: string; percentage: number; insight: string }>;
  geographicPatterns: Array<{ region: string; strength: string; observation: string }>;
  keyMetrics: Array<{ metric: string; value: string; trend?: string; significance: string }>;
  dataQualityNotes?: string[];
}

interface RecommendationsData {
  priorityActions: Array<{ action: string; priority: string; expectedImpact: string; effort: string }>;
  industryFocus: Array<{ industry: string; recommendation: string; confidence: number }>;
  geographicFocus: Array<{ state: string; recommendation: string; potential: string }>;
  filterSuggestions?: Array<{ name: string; filters: Record<string, unknown>; rationale: string }>;
}

interface PredictionsData {
  growthSegments: Array<{ segment: string; growthPotential: string; timeframe?: string; reasoning: string }>;
  emergingOpportunities: Array<{ opportunity: string; description: string; actionRequired: string }>;
  riskFactors: Array<{ risk: string; severity: string; mitigation: string }>;
  leadScoringSuggestions?: Array<{ factor: string; weight: number; rationale: string }>;
}

interface AnalysisResults {
  insights?: InsightsData;
  recommendations?: RecommendationsData;
  predictions?: PredictionsData;
}

export function AIInsights({ datasetId, dataSample, filters, kpis }: AIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("insights");
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  const runAnalysis = async () => {
    if (!datasetId || dataSample.length === 0) {
      toast.error("Please upload a dataset first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            datasetId,
            type: "all",
            dataSample: dataSample.slice(0, 50), // Send sample for analysis
            filters,
            kpis,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          toast.error("Rate limit exceeded. Please try again later.");
          return;
        }
        if (response.status === 402) {
          toast.error("AI credits exhausted. Please add credits to continue.");
          return;
        }
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      if (data.success && data.results) {
        setResults(data.results);
        toast.success("AI analysis complete!");
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to run AI analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-chart-rose text-white';
      case 'medium': return 'bg-chart-amber text-black';
      case 'low': return 'bg-chart-teal text-white';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength.toLowerCase()) {
      case 'high': case 'very high': return 'text-chart-emerald';
      case 'medium': case 'moderate': return 'text-chart-amber';
      case 'low': return 'text-chart-rose';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="w-6 h-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold">AI-Powered Insights</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Smart analysis for audience targeting & ICP optimization
              </p>
            </div>
          </div>
          <Button 
            onClick={runAnalysis} 
            disabled={isLoading || !datasetId}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Run AI Analysis
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!results && !isLoading && (
          <div className="text-center py-12 text-muted-foreground">
            <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No analysis yet</p>
            <p className="text-sm">Click "Run AI Analysis" to get intelligent insights about your data</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-primary">Analyzing your data...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Our AI is examining patterns, segments, and opportunities
            </p>
          </div>
        )}

        {results && !isLoading && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="insights" className="gap-2">
                <Lightbulb className="w-4 h-4" />
                Insights
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="gap-2">
                <Target className="w-4 h-4" />
                Recommendations
              </TabsTrigger>
              <TabsTrigger value="predictions" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Predictions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="insights" className="space-y-4">
              {results.insights && (
                <>
                  <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                    <p className="text-sm leading-relaxed">{results.insights.summary}</p>
                  </div>

                  {/* Top Industries */}
                  <CollapsibleSection
                    title="Top Industries"
                    icon={<Zap className="w-4 h-4" />}
                    isOpen={expandedSections['industries'] !== false}
                    onToggle={() => toggleSection('industries')}
                  >
                    <div className="space-y-3">
                      {results.insights.topIndustries?.map((industry, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{industry.name}</span>
                            <Badge variant="secondary">{industry.percentage}%</Badge>
                          </div>
                          <Progress value={industry.percentage} className="h-2 mb-2" />
                          <p className="text-sm text-muted-foreground">{industry.insight}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Geographic Patterns */}
                  <CollapsibleSection
                    title="Geographic Patterns"
                    icon={<MapPin className="w-4 h-4" />}
                    isOpen={expandedSections['geo'] !== false}
                    onToggle={() => toggleSection('geo')}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {results.insights.geographicPatterns?.map((pattern, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{pattern.region}</span>
                            <span className={cn("text-sm font-semibold", getStrengthColor(pattern.strength))}>
                              {pattern.strength}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{pattern.observation}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Key Metrics */}
                  <CollapsibleSection
                    title="Key Metrics"
                    icon={<TrendingUp className="w-4 h-4" />}
                    isOpen={expandedSections['metrics'] !== false}
                    onToggle={() => toggleSection('metrics')}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {results.insights.keyMetrics?.map((metric, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">{metric.metric}</span>
                            {metric.trend && (
                              <TrendingUp className={cn(
                                "w-4 h-4",
                                metric.trend === 'up' ? 'text-chart-emerald' : 
                                metric.trend === 'down' ? 'text-chart-rose rotate-180' : 'text-muted-foreground'
                              )} />
                            )}
                          </div>
                          <p className="text-lg font-bold">{metric.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{metric.significance}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                </>
              )}
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {results.recommendations && (
                <>
                  {/* Priority Actions */}
                  <CollapsibleSection
                    title="Priority Actions"
                    icon={<Target className="w-4 h-4" />}
                    isOpen={expandedSections['actions'] !== false}
                    onToggle={() => toggleSection('actions')}
                  >
                    <div className="space-y-3">
                      {results.recommendations.priorityActions?.map((action, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-muted/50 border-l-4 border-primary">
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <p className="font-medium">{action.action}</p>
                            <Badge className={getPriorityColor(action.priority)}>
                              {action.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{action.expectedImpact}</p>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Effort:</span>
                            <Badge variant="outline">{action.effort}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Industry Focus */}
                  <CollapsibleSection
                    title="Industry Focus"
                    icon={<Zap className="w-4 h-4" />}
                    isOpen={expandedSections['industryFocus'] !== false}
                    onToggle={() => toggleSection('industryFocus')}
                  >
                    <div className="space-y-3">
                      {results.recommendations.industryFocus?.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{item.industry}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">Confidence</span>
                              <Progress value={item.confidence} className="w-16 h-2" />
                              <span className="text-xs font-medium">{item.confidence}%</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Geographic Focus */}
                  <CollapsibleSection
                    title="Geographic Focus"
                    icon={<MapPin className="w-4 h-4" />}
                    isOpen={expandedSections['geoFocus'] !== false}
                    onToggle={() => toggleSection('geoFocus')}
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {results.recommendations.geographicFocus?.map((item, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{item.state}</span>
                            <Badge className={cn(
                              item.potential === 'high' ? 'bg-chart-emerald' :
                              item.potential === 'medium' ? 'bg-chart-amber' : 'bg-chart-rose',
                              'text-white'
                            )}>
                              {item.potential} potential
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.recommendation}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                </>
              )}
            </TabsContent>

            <TabsContent value="predictions" className="space-y-4">
              {results.predictions && (
                <>
                  {/* Growth Segments */}
                  <CollapsibleSection
                    title="High-Growth Segments"
                    icon={<TrendingUp className="w-4 h-4" />}
                    isOpen={expandedSections['growth'] !== false}
                    onToggle={() => toggleSection('growth')}
                  >
                    <div className="space-y-3">
                      {results.predictions.growthSegments?.map((segment, idx) => (
                        <div key={idx} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{segment.segment}</span>
                            <Badge className={cn(
                              'text-white',
                              segment.growthPotential === 'very high' ? 'bg-chart-emerald' :
                              segment.growthPotential === 'high' ? 'bg-chart-teal' :
                              segment.growthPotential === 'moderate' ? 'bg-chart-amber' : 'bg-chart-rose'
                            )}>
                              {segment.growthPotential}
                            </Badge>
                          </div>
                          {segment.timeframe && (
                            <p className="text-xs text-muted-foreground mb-1">Timeframe: {segment.timeframe}</p>
                          )}
                          <p className="text-sm text-muted-foreground">{segment.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Emerging Opportunities */}
                  <CollapsibleSection
                    title="Emerging Opportunities"
                    icon={<Lightbulb className="w-4 h-4" />}
                    isOpen={expandedSections['opportunities'] !== false}
                    onToggle={() => toggleSection('opportunities')}
                  >
                    <div className="space-y-3">
                      {results.predictions.emergingOpportunities?.map((opp, idx) => (
                        <div key={idx} className="p-4 rounded-lg bg-gradient-to-r from-chart-amber/10 to-transparent border border-chart-amber/30">
                          <p className="font-medium text-chart-amber mb-1">{opp.opportunity}</p>
                          <p className="text-sm text-muted-foreground mb-2">{opp.description}</p>
                          <div className="flex items-start gap-2 text-sm">
                            <Target className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                            <span>{opp.actionRequired}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>

                  {/* Risk Factors */}
                  <CollapsibleSection
                    title="Risk Factors"
                    icon={<AlertTriangle className="w-4 h-4" />}
                    isOpen={expandedSections['risks'] !== false}
                    onToggle={() => toggleSection('risks')}
                  >
                    <div className="space-y-3">
                      {results.predictions.riskFactors?.map((risk, idx) => (
                        <div key={idx} className={cn(
                          "p-3 rounded-lg border-l-4",
                          risk.severity === 'high' ? 'bg-destructive/10 border-destructive' :
                          risk.severity === 'medium' ? 'bg-chart-amber/10 border-chart-amber' :
                          'bg-muted/50 border-muted-foreground'
                        )}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{risk.risk}</span>
                            <Badge variant="outline" className={cn(
                              risk.severity === 'high' ? 'border-destructive text-destructive' :
                              risk.severity === 'medium' ? 'border-chart-amber text-chart-amber' : ''
                            )}>
                              {risk.severity} severity
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            <strong>Mitigation:</strong> {risk.mitigation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CollapsibleSection>
                </>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function CollapsibleSection({ title, icon, isOpen, onToggle, children }: CollapsibleSectionProps) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 bg-muted/30 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 font-medium">
          {icon}
          {title}
        </div>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {isOpen && <div className="p-3">{children}</div>}
    </div>
  );
}