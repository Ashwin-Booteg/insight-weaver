import React, { useState } from 'react';
import { Sparkles, TrendingUp, Target, AlertTriangle, Lightbulb, Loader2, Brain, Zap, MapPin, Filter, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { GlobalFilterState, ExtendedKPIData, RegionName, IndustryCategory } from '@/types/filters';

interface FilterAwareAIInsightsProps {
  datasetId: string | null;
  filters: GlobalFilterState;
  kpis: ExtendedKPIData;
  effectiveStates: string[];
  effectiveRoles: string[];
  filteredData?: Record<string, unknown>[];
  columns?: { name: string; type: string }[];
}

interface AIResults {
  insights?: {
    summary: string;
    topIndustries: { name: string; percentage: number; insight: string }[];
    geographicPatterns: { region: string; strength: string; observation: string }[];
    keyMetrics: { metric: string; value: string; significance: string; trend?: string }[];
    dataQualityNotes?: string[];
  };
  recommendations?: {
    priorityActions: { action: string; priority: string; expectedImpact: string; effort: string }[];
    industryFocus: { industry: string; recommendation: string; confidence: number }[];
    geographicFocus: { state: string; recommendation: string; potential: string }[];
    filterSuggestions?: { name: string; filters: Record<string, unknown>; rationale: string }[];
  };
  predictions?: {
    growthSegments: { segment: string; growthPotential: string; reasoning: string; timeframe?: string }[];
    emergingOpportunities: { opportunity: string; description: string; actionRequired: string }[];
    riskFactors: { risk: string; severity: string; mitigation: string }[];
    leadScoringSuggestions?: { factor: string; weight: number; rationale: string }[];
  };
}

export function FilterAwareAIInsights({
  datasetId,
  filters,
  kpis,
  effectiveStates,
  effectiveRoles,
  filteredData,
  columns
}: FilterAwareAIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AIResults | null>(null);
  const [activeSection, setActiveSection] = useState<'insights' | 'recommendations' | 'predictions'>('insights');

  const runAnalysis = async () => {
    if (!datasetId) {
      toast.error("Please upload a dataset first");
      return;
    }

    setIsLoading(true);
    
    try {
      // Prepare a sample of filtered data for the AI
      const dataSample = (filteredData || []).slice(0, 50).map(row => {
        const clean: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (!k.startsWith('_')) clean[k] = v;
        }
        return clean;
      });

      const { data, error } = await supabase.functions.invoke('analyze-data', {
        body: {
          datasetId,
          type: 'all',
          dataSample,
          filters: {
            industries: filters.selectedIndustries,
            states: effectiveStates.slice(0, 20),
          },
          kpis: {
            totalRecords: kpis.totalPeople,
            totalICP: 0,
            stateCount: kpis.statesIncluded,
            industryBreakdown: kpis.industryBreakdown,
          }
        }
      });

      if (error) throw error;
      
      if (data?.error) {
        if (data.error.includes('Rate limit')) {
          toast.error('AI rate limit reached. Please try again in a moment.');
        } else if (data.error.includes('Payment')) {
          toast.error('AI credits exhausted. Please add credits.');
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setResults(data.results || {});
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to run AI analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const insights = results?.insights;
  const recommendations = results?.recommendations;
  const predictions = results?.predictions;

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
                Powered by Lovable AI · Analyzes your filtered data
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
                {results ? 'Re-analyze' : 'Run AI Analysis'}
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
            <p className="text-sm">AI will read your Excel data and provide deep insights, recommendations, and predictions</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-primary">AI is reading your data...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Analyzing {kpis.totalPeople.toLocaleString()} records across {kpis.statesIncluded} locations
            </p>
          </div>
        )}

        {results && !isLoading && (
          <div className="space-y-6">
            {/* Section tabs */}
            <div className="flex gap-2 border-b border-border pb-3">
              {[
                { key: 'insights' as const, label: 'Insights', icon: Lightbulb, color: 'text-chart-amber', available: !!insights },
                { key: 'recommendations' as const, label: 'Recommendations', icon: Target, color: 'text-chart-teal', available: !!recommendations },
                { key: 'predictions' as const, label: 'Predictions', icon: TrendingUp, color: 'text-chart-purple', available: !!predictions },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveSection(tab.key)}
                  disabled={!tab.available}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                    activeSection === tab.key
                      ? "bg-primary/10 text-primary"
                      : tab.available
                        ? "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        : "text-muted-foreground/40 cursor-not-allowed"
                  )}
                >
                  <tab.icon className={cn("w-3.5 h-3.5", activeSection === tab.key && tab.color)} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Insights Section */}
            {activeSection === 'insights' && insights && (
              <div className="space-y-5 animate-fade-in">
                {/* Summary */}
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm leading-relaxed">{insights.summary}</p>
                  </div>
                </div>

                {/* Top Industries */}
                {insights.topIndustries?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-chart-amber" /> Industry Analysis
                    </h4>
                    <div className="grid gap-3">
                      {insights.topIndustries.map((ind, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium">{ind.name}</span>
                            <Badge variant="secondary" className="text-[10px]">{ind.percentage}%</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{ind.insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Geographic Patterns */}
                {insights.geographicPatterns?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-chart-teal" /> Geographic Patterns
                    </h4>
                    <div className="grid gap-2">
                      {insights.geographicPatterns.map((geo, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                          <Badge variant={geo.strength === 'high' ? 'default' : 'secondary'} className="text-[10px] shrink-0 mt-0.5">
                            {geo.strength}
                          </Badge>
                          <div>
                            <p className="text-sm font-medium">{geo.region}</p>
                            <p className="text-xs text-muted-foreground">{geo.observation}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Metrics */}
                {insights.keyMetrics?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Zap className="w-4 h-4 text-chart-purple" /> Key Metrics
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {insights.keyMetrics.map((m, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{m.metric}</span>
                            {m.trend && (
                              <Badge variant="outline" className={cn("text-[9px]",
                                m.trend === 'up' ? 'border-chart-emerald/50 text-chart-emerald' :
                                m.trend === 'down' ? 'border-chart-rose/50 text-chart-rose' :
                                'border-border text-muted-foreground'
                              )}>
                                {m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} {m.trend}
                              </Badge>
                            )}
                          </div>
                          <p className="text-lg font-bold">{m.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{m.significance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Data Quality Notes */}
                {insights.dataQualityNotes?.length > 0 && (
                  <div className="p-4 rounded-xl bg-chart-amber/5 border border-chart-amber/20">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-4 h-4 text-chart-amber" />
                      <h4 className="text-sm font-semibold">Data Quality Notes</h4>
                    </div>
                    <ul className="space-y-1">
                      {insights.dataQualityNotes.map((note, idx) => (
                        <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                          <span className="text-chart-amber mt-0.5">•</span> {note}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Recommendations Section */}
            {activeSection === 'recommendations' && recommendations && (
              <div className="space-y-5 animate-fade-in">
                {/* Priority Actions */}
                {recommendations.priorityActions?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Target className="w-4 h-4 text-chart-teal" /> Priority Actions
                    </h4>
                    <div className="space-y-2">
                      {recommendations.priorityActions.map((action, idx) => (
                        <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={cn("text-[10px]",
                              action.priority === 'critical' ? 'bg-chart-rose text-white' :
                              action.priority === 'high' ? 'bg-chart-amber text-white' :
                              'bg-muted text-muted-foreground'
                            )}>
                              {action.priority}
                            </Badge>
                            <Badge variant="outline" className="text-[10px]">effort: {action.effort}</Badge>
                          </div>
                          <p className="text-sm font-medium">{action.action}</p>
                          <p className="text-xs text-muted-foreground mt-1">{action.expectedImpact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Industry Focus */}
                {recommendations.industryFocus?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Industry Focus</h4>
                    {recommendations.industryFocus.map((ind, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{ind.industry}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={ind.confidence} className="w-16 h-1.5" />
                            <span className="text-[10px] text-muted-foreground">{ind.confidence}%</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">{ind.recommendation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Geographic Focus */}
                {recommendations.geographicFocus?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold">Geographic Focus</h4>
                    {recommendations.geographicFocus.map((geo, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 border border-border">
                        <Badge variant={geo.potential === 'high' ? 'default' : 'secondary'} className="text-[10px] shrink-0">{geo.potential}</Badge>
                        <div>
                          <p className="text-sm font-medium">{geo.state}</p>
                          <p className="text-xs text-muted-foreground">{geo.recommendation}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Predictions Section */}
            {activeSection === 'predictions' && predictions && (
              <div className="space-y-5 animate-fade-in">
                {/* Growth Segments */}
                {predictions.growthSegments?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-chart-purple" /> Growth Segments
                    </h4>
                    {predictions.growthSegments.map((seg, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-muted/30 border border-border">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{seg.segment}</span>
                          <Badge variant="outline" className={cn("text-[10px]",
                            seg.growthPotential === 'very high' || seg.growthPotential === 'high'
                              ? 'border-chart-emerald/50 text-chart-emerald'
                              : 'border-border'
                          )}>{seg.growthPotential}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{seg.reasoning}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Risk Factors */}
                {predictions.riskFactors?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-chart-rose" /> Risk Factors
                    </h4>
                    {predictions.riskFactors.map((risk, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-chart-rose/5 border border-chart-rose/20">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">{risk.risk}</span>
                          <Badge variant="outline" className={cn("text-[10px]",
                            risk.severity === 'high' ? 'border-chart-rose/50 text-chart-rose' : 'border-border'
                          )}>{risk.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{risk.mitigation}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Emerging Opportunities */}
                {predictions.emergingOpportunities?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-chart-emerald" /> Emerging Opportunities
                    </h4>
                    {predictions.emergingOpportunities.map((opp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-chart-emerald/5 border border-chart-emerald/20">
                        <p className="text-sm font-medium mb-1">{opp.opportunity}</p>
                        <p className="text-xs text-muted-foreground mb-2">{opp.description}</p>
                        <p className="text-xs font-medium text-chart-emerald">→ {opp.actionRequired}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
