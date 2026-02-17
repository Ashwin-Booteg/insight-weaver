import React, { useState } from 'react';
import { Sparkles, TrendingUp, Target, AlertTriangle, Lightbulb, Loader2, Brain, Zap, MapPin, Filter, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { GlobalFilterState, ExtendedKPIData, RegionName, IndustryCategory } from '@/types/filters';

interface FilterAwareAIInsightsProps {
  datasetId: string | null;
  filters: GlobalFilterState;
  kpis: ExtendedKPIData;
  effectiveStates: string[];
  effectiveRoles: string[];
}

interface AIAnalysisResult {
  filtersApplied: {
    regions: RegionName[];
    states: string[];
    industries: IndustryCategory[];
    roles: string[];
    totalScope: number;
  };
  keyFindings: string[];
  topOpportunities: string[];
  concentrationRisk: {
    finding: string;
    percentage: number;
    entity: string;
  } | null;
  recommendedActions: string[];
  confidenceScore: number;
  lowSampleWarning?: string;
}

export function FilterAwareAIInsights({
  datasetId,
  filters,
  kpis,
  effectiveStates,
  effectiveRoles
}: FilterAwareAIInsightsProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AIAnalysisResult | null>(null);

  const runAnalysis = async () => {
    if (!datasetId) {
      toast.error("Please upload a dataset first");
      return;
    }

    setIsLoading(true);
    
    try {
      // Simulate AI analysis based on filtered KPIs
      // In production, this would call an edge function
      await new Promise(resolve => setTimeout(resolve, 1500));

      const analysis = generateLocalAnalysis();
      setResults(analysis);
      toast.success("AI analysis complete!");
    } catch (error) {
      console.error("Analysis error:", error);
      toast.error("Failed to run AI analysis");
    } finally {
      setIsLoading(false);
    }
  };

  const generateLocalAnalysis = (): AIAnalysisResult => {
    const findings: string[] = [];
    const opportunities: string[] = [];
    const actions: string[] = [];

    // Find concentration
    let concentrationRisk: AIAnalysisResult['concentrationRisk'] = null;
    
    if (kpis.topStateByPeople && kpis.totalPeople > 0) {
      const topStatePercent = (kpis.stateBreakdown[kpis.topStateByPeople.state] / kpis.totalPeople) * 100;
      if (topStatePercent > 15) {
        concentrationRisk = {
          finding: `${topStatePercent.toFixed(1)}% of people are concentrated in ${kpis.topStateByPeople.state}`,
          percentage: topStatePercent,
          entity: kpis.topStateByPeople.state
        };
      }
    }

    // Generate findings based on data
    if (kpis.totalPeople > 0) {
      findings.push(`Under current filters, analyzing ${kpis.totalPeople.toLocaleString()} total people across ${kpis.statesIncluded} locations.`);
    }

    if (kpis.topStateByPeople) {
      findings.push(`${kpis.topStateByPeople.state} leads with ${kpis.topStateByPeople.count.toLocaleString()} people (${((kpis.topStateByPeople.count / kpis.totalPeople) * 100).toFixed(1)}% of total).`);
    }

    if (kpis.topRoleByPeople) {
      findings.push(`Top role "${kpis.topRoleByPeople.role}" accounts for ${kpis.topRoleByPeople.count.toLocaleString()} people.`);
    }

    if (kpis.topIndustryByPeople) {
      const industryPercent = (kpis.industryBreakdown[kpis.topIndustryByPeople.industry] / kpis.totalPeople) * 100;
      findings.push(`${kpis.topIndustryByPeople.industry} dominates at ${industryPercent.toFixed(1)}% of the filtered population.`);
    }

    // Regional insights
    const sortedRegions = Object.entries(kpis.regionBreakdown).sort((a, b) => b[1] - a[1]);
    if (sortedRegions.length > 0) {
      const topRegion = sortedRegions[0];
      const regionPercent = (topRegion[1] / kpis.totalPeople) * 100;
      findings.push(`The ${topRegion[0]} region contributes ${regionPercent.toFixed(1)}% of filtered people.`);
    }

    // Generate opportunities
    if (kpis.bottomStateByPeople && kpis.totalPeople > 100) {
      opportunities.push(`Expand presence in ${kpis.bottomStateByPeople.state} - currently underrepresented with only ${kpis.bottomStateByPeople.count.toLocaleString()} people.`);
    }

    if (sortedRegions.length > 1) {
      const bottomRegion = sortedRegions[sortedRegions.length - 1];
      opportunities.push(`Consider growth initiatives in the ${bottomRegion[0]} region - lowest representation at ${bottomRegion[1].toLocaleString()} people.`);
    }

    const industryEntries = Object.entries(kpis.industryBreakdown).sort((a, b) => a[1] - b[1]);
    if (industryEntries.length > 0 && industryEntries[0][1] > 0) {
      opportunities.push(`${industryEntries[0][0]} shows potential for growth with ${industryEntries[0][1].toLocaleString()} people - consider targeted campaigns.`);
    }

    // Generate actions
    actions.push(`Focus marketing efforts on top-performing locations: ${Object.keys(kpis.stateBreakdown).slice(0, 3).join(', ')}.`);
    
    if (effectiveRoles.length < 10) {
      actions.push(`Expand role selection to capture broader audience segments - currently analyzing only ${effectiveRoles.length} roles.`);
    }

    actions.push(`Monitor concentration risk - diversify across regions to reduce dependency on top performers.`);

    // Low sample warning
    const lowSampleWarning = kpis.totalPeople < 100 
      ? "⚠️ Low sample size detected. Conclusions may be less reliable."
      : undefined;

    return {
      filtersApplied: {
        regions: filters.regions,
        states: effectiveStates,
        industries: filters.selectedIndustries,
        roles: effectiveRoles,
        totalScope: kpis.totalPeople
      },
      keyFindings: findings,
      topOpportunities: opportunities,
      concentrationRisk,
      recommendedActions: actions,
      confidenceScore: kpis.totalPeople > 1000 ? 85 : kpis.totalPeople > 100 ? 70 : 45,
      lowSampleWarning
    };
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
                Analysis respects all active filters
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
            <p className="text-sm">AI will analyze only your filtered data scope</p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20" />
              <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <Brain className="absolute inset-0 m-auto w-8 h-8 text-primary" />
            </div>
            <p className="text-lg font-medium text-primary">Analyzing filtered data...</p>
            <p className="text-sm text-muted-foreground mt-1">
              Scope: {effectiveStates.length} states, {effectiveRoles.length} roles
            </p>
          </div>
        )}

        {results && !isLoading && (
          <div className="space-y-6">
            {/* Filters Applied Summary */}
            <div className="p-4 rounded-xl bg-muted/50 border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Filters Applied</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {results.filtersApplied.regions.length > 0 && (
                  <Badge variant="secondary">
                    {results.filtersApplied.regions.length} Regions
                  </Badge>
                )}
                <Badge variant="secondary">
                  {results.filtersApplied.states.length} States
                </Badge>
                {results.filtersApplied.industries.length > 0 && (
                  <Badge variant="secondary">
                    {results.filtersApplied.industries.length} Industries
                  </Badge>
                )}
                <Badge variant="secondary">
                  {results.filtersApplied.roles.length} Roles
                </Badge>
                <Badge variant="outline" className="border-primary/50 text-primary">
                  {results.filtersApplied.totalScope.toLocaleString()} People Total
                </Badge>
              </div>
            </div>

            {/* Low Sample Warning */}
            {results.lowSampleWarning && (
              <div className="p-4 rounded-xl bg-chart-amber/10 border border-chart-amber/30 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-chart-amber shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-chart-amber">Low Sample Size</p>
                  <p className="text-sm text-muted-foreground">{results.lowSampleWarning}</p>
                </div>
              </div>
            )}

            {/* Key Findings */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-chart-amber" />
                <h4 className="font-semibold">Key Findings</h4>
              </div>
              <ul className="space-y-2">
                {results.keyFindings.map((finding, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-chart-teal mt-1">•</span>
                    <span>{finding}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Opportunities */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-chart-teal" />
                <h4 className="font-semibold">Top Opportunities</h4>
              </div>
              <ul className="space-y-2">
                {results.topOpportunities.map((opp, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-chart-purple mt-1">•</span>
                    <span>{opp}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Concentration Risk */}
            {results.concentrationRisk && (
              <div className="p-4 rounded-xl bg-chart-rose/10 border border-chart-rose/30">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-chart-rose" />
                  <h4 className="font-semibold">Concentration Risk</h4>
                </div>
                <p className="text-sm">{results.concentrationRisk.finding}</p>
                <Progress 
                  value={results.concentrationRisk.percentage} 
                  className="h-2 mt-3"
                />
              </div>
            )}

            {/* Recommended Actions */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-chart-purple" />
                <h4 className="font-semibold">Recommended Actions</h4>
              </div>
              <ol className="space-y-2">
                {results.recommendedActions.map((action, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">
                      {idx + 1}
                    </span>
                    <span>{action}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Confidence Score */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-muted/50">
              <div>
                <p className="text-sm font-medium">Confidence Score</p>
                <p className="text-xs text-muted-foreground">Based on sample size and data quality</p>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={results.confidenceScore} className="w-24 h-2" />
                <span className={cn(
                  "font-bold",
                  results.confidenceScore >= 80 ? "text-chart-emerald" :
                  results.confidenceScore >= 60 ? "text-chart-amber" : "text-chart-rose"
                )}>
                  {results.confidenceScore}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
