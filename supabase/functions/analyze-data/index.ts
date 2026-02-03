import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalysisRequest {
  datasetId: string;
  type: "insights" | "recommendations" | "predictions" | "all";
  dataSample: Record<string, unknown>[];
  filters?: {
    industries?: string[];
    states?: string[];
  };
  kpis?: {
    totalRecords: number;
    totalICP: number;
    stateCount: number;
    industryBreakdown?: Record<string, number>;
    levelBreakdown?: Record<string, number>;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { datasetId, type, dataSample, filters, kpis } = await req.json() as AnalysisRequest;

    console.log(`[analyze-data] Starting analysis for dataset ${datasetId}, type: ${type}`);
    console.log(`[analyze-data] Data sample size: ${dataSample?.length || 0}, KPIs:`, kpis);

    // Build context for AI
    const dataContext = buildDataContext(dataSample, filters, kpis);
    
    // Determine which analyses to run
    const analysisTypes = type === "all" 
      ? ["insights", "recommendations", "predictions"] 
      : [type];

    const results: Record<string, unknown> = {};

    for (const analysisType of analysisTypes) {
      const prompt = buildPrompt(analysisType, dataContext);
      
      console.log(`[analyze-data] Running ${analysisType} analysis...`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: getSystemPrompt(analysisType) },
            { role: "user", content: prompt }
          ],
          tools: [getToolDefinition(analysisType)],
          tool_choice: { type: "function", function: { name: getToolName(analysisType) } }
        }),
      });

      if (!response.ok) {
        const status = response.status;
        if (status === 429) {
          console.error("[analyze-data] Rate limit exceeded");
          return new Response(
            JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (status === 402) {
          console.error("[analyze-data] Payment required");
          return new Response(
            JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const errorText = await response.text();
        console.error(`[analyze-data] AI gateway error: ${status}`, errorText);
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiResponse = await response.json();
      const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        try {
          results[analysisType] = JSON.parse(toolCall.function.arguments);
          console.log(`[analyze-data] ${analysisType} completed successfully`);
        } catch (parseError) {
          console.error(`[analyze-data] Failed to parse ${analysisType} response:`, parseError);
          results[analysisType] = { error: "Failed to parse AI response" };
        }
      } else {
        console.warn(`[analyze-data] No tool call in ${analysisType} response`);
        results[analysisType] = { error: "No structured response from AI" };
      }
    }

    console.log("[analyze-data] All analyses completed");

    return new Response(
      JSON.stringify({ success: true, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[analyze-data] Error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function buildDataContext(
  dataSample: Record<string, unknown>[],
  filters?: { industries?: string[]; states?: string[] },
  kpis?: { totalRecords: number; totalICP: number; stateCount: number; industryBreakdown?: Record<string, number>; levelBreakdown?: Record<string, number> }
): string {
  const parts: string[] = [];

  if (kpis) {
    parts.push(`Dataset Overview:
- Total Records: ${kpis.totalRecords.toLocaleString()}
- ICP Matches: ${kpis.totalICP.toLocaleString()} (${((kpis.totalICP / kpis.totalRecords) * 100).toFixed(1)}%)
- States Covered: ${kpis.stateCount}
${kpis.industryBreakdown ? `- Industry Distribution: ${JSON.stringify(kpis.industryBreakdown)}` : ''}
${kpis.levelBreakdown ? `- Audience Level Distribution: ${JSON.stringify(kpis.levelBreakdown)}` : ''}`);
  }

  if (filters?.industries?.length) {
    parts.push(`Active Industry Filters: ${filters.industries.join(", ")}`);
  }
  if (filters?.states?.length) {
    parts.push(`Active State Filters: ${filters.states.join(", ")}`);
  }

  if (dataSample?.length > 0) {
    const columns = Object.keys(dataSample[0]);
    parts.push(`Data Columns: ${columns.join(", ")}`);
    parts.push(`Sample Records (first ${Math.min(dataSample.length, 10)}):\n${JSON.stringify(dataSample.slice(0, 10), null, 2)}`);
  }

  return parts.join("\n\n");
}

function getSystemPrompt(type: string): string {
  const basePrompt = `You are an expert data analyst specializing in audience segmentation and ICP (Ideal Customer Profile) analysis for the entertainment industry (Movies, Music, Fashion). Your goal is to provide actionable insights.`;
  
  switch (type) {
    case "insights":
      return `${basePrompt} Focus on identifying patterns, trends, and key metrics in the data. Highlight notable concentrations, anomalies, and potential opportunities.`;
    case "recommendations":
      return `${basePrompt} Provide specific, actionable recommendations for targeting the right audience segments. Focus on which industries, states, and audience levels to prioritize.`;
    case "predictions":
      return `${basePrompt} Based on the data patterns, predict future trends and identify high-potential segments. Estimate growth opportunities and risk factors.`;
    default:
      return basePrompt;
  }
}

function buildPrompt(type: string, context: string): string {
  switch (type) {
    case "insights":
      return `Analyze this audience data and provide key insights:

${context}

Identify:
1. Top performing industry segments
2. Geographic concentration patterns
3. Audience level trends
4. Notable data quality or coverage issues
5. Key metrics and their significance`;

    case "recommendations":
      return `Based on this audience data, provide targeting recommendations:

${context}

Recommend:
1. Which industry segments to prioritize and why
2. Which states/regions show the highest potential
3. Optimal audience levels to focus on
4. Suggested filter combinations for best results
5. Next steps for data enrichment`;

    case "predictions":
      return `Analyze this audience data for predictive insights:

${context}

Predict:
1. High-growth potential segments
2. Emerging market opportunities
3. Possible market saturation areas
4. Lead scoring suggestions
5. Risk factors to monitor`;

    default:
      return context;
  }
}

function getToolName(type: string): string {
  switch (type) {
    case "insights": return "provide_insights";
    case "recommendations": return "provide_recommendations";
    case "predictions": return "provide_predictions";
    default: return "provide_insights";
  }
}

function getToolDefinition(type: string): Record<string, unknown> {
  switch (type) {
    case "insights":
      return {
        type: "function",
        function: {
          name: "provide_insights",
          description: "Return structured audience data insights",
          parameters: {
            type: "object",
            properties: {
              summary: { type: "string", description: "Executive summary of key findings" },
              topIndustries: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    percentage: { type: "number" },
                    insight: { type: "string" }
                  },
                  required: ["name", "percentage", "insight"]
                }
              },
              geographicPatterns: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    region: { type: "string" },
                    strength: { type: "string", enum: ["high", "medium", "low"] },
                    observation: { type: "string" }
                  },
                  required: ["region", "strength", "observation"]
                }
              },
              keyMetrics: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    metric: { type: "string" },
                    value: { type: "string" },
                    trend: { type: "string", enum: ["up", "down", "stable"] },
                    significance: { type: "string" }
                  },
                  required: ["metric", "value", "significance"]
                }
              },
              dataQualityNotes: { type: "array", items: { type: "string" } }
            },
            required: ["summary", "topIndustries", "geographicPatterns", "keyMetrics"]
          }
        }
      };

    case "recommendations":
      return {
        type: "function",
        function: {
          name: "provide_recommendations",
          description: "Return actionable targeting recommendations",
          parameters: {
            type: "object",
            properties: {
              priorityActions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    action: { type: "string" },
                    priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
                    expectedImpact: { type: "string" },
                    effort: { type: "string", enum: ["low", "medium", "high"] }
                  },
                  required: ["action", "priority", "expectedImpact", "effort"]
                }
              },
              industryFocus: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    industry: { type: "string" },
                    recommendation: { type: "string" },
                    confidence: { type: "number" }
                  },
                  required: ["industry", "recommendation", "confidence"]
                }
              },
              geographicFocus: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    state: { type: "string" },
                    recommendation: { type: "string" },
                    potential: { type: "string", enum: ["high", "medium", "low"] }
                  },
                  required: ["state", "recommendation", "potential"]
                }
              },
              filterSuggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    filters: { type: "object" },
                    rationale: { type: "string" }
                  },
                  required: ["name", "filters", "rationale"]
                }
              }
            },
            required: ["priorityActions", "industryFocus", "geographicFocus"]
          }
        }
      };

    case "predictions":
      return {
        type: "function",
        function: {
          name: "provide_predictions",
          description: "Return predictive analytics and forecasts",
          parameters: {
            type: "object",
            properties: {
              growthSegments: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    segment: { type: "string" },
                    growthPotential: { type: "string", enum: ["very high", "high", "moderate", "low"] },
                    timeframe: { type: "string" },
                    reasoning: { type: "string" }
                  },
                  required: ["segment", "growthPotential", "reasoning"]
                }
              },
              emergingOpportunities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    opportunity: { type: "string" },
                    description: { type: "string" },
                    actionRequired: { type: "string" }
                  },
                  required: ["opportunity", "description", "actionRequired"]
                }
              },
              riskFactors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    risk: { type: "string" },
                    severity: { type: "string", enum: ["high", "medium", "low"] },
                    mitigation: { type: "string" }
                  },
                  required: ["risk", "severity", "mitigation"]
                }
              },
              leadScoringSuggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    factor: { type: "string" },
                    weight: { type: "number" },
                    rationale: { type: "string" }
                  },
                  required: ["factor", "weight", "rationale"]
                }
              }
            },
            required: ["growthSegments", "emergingOpportunities", "riskFactors"]
          }
        }
      };

    default:
      return getToolDefinition("insights");
  }
}