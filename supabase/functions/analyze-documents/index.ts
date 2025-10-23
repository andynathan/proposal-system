import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AnalysisRequest {
  documents: Array<{
    id: string;
    fileName: string;
    content: string;
  }>;
  analysisType: string;
}

interface ExtractedPattern {
  pattern_type: string;
  pattern_data: Record<string, any>;
  confidence_score: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { documents, analysisType }: AnalysisRequest = await req.json();

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents provided" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const patterns: ExtractedPattern[] = [];

    for (const doc of documents) {
      const analyzedPatterns = analyzeDocument(doc.content, analysisType);
      patterns.push(...analyzedPatterns);
    }

    const summary = generateSummary(patterns, documents.length);

    return new Response(
      JSON.stringify({
        success: true,
        patterns,
        summary,
        documentsAnalyzed: documents.length,
        patternsFound: patterns.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error analyzing documents:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Analysis failed" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

function analyzeDocument(content: string, analysisType: string): ExtractedPattern[] {
  const patterns: ExtractedPattern[] = [];
  const lowerContent = content.toLowerCase();

  if (analysisType === "proposal_patterns") {
    const pricingPattern = extractPricingPatterns(content);
    if (pricingPattern) {
      patterns.push(pricingPattern);
    }

    const structurePattern = extractStructurePatterns(content);
    if (structurePattern) {
      patterns.push(structurePattern);
    }

    const languagePattern = extractLanguagePatterns(content);
    if (languagePattern) {
      patterns.push(languagePattern);
    }

    const formattingPattern = extractFormattingPatterns(content);
    if (formattingPattern) {
      patterns.push(formattingPattern);
    }
  }

  return patterns;
}

function extractPricingPatterns(content: string): ExtractedPattern | null {
  const priceRegex = /\$[\d,]+(?:\.\d{2})?/g;
  const prices = content.match(priceRegex);

  if (prices && prices.length > 0) {
    const amounts = prices.map(p => parseFloat(p.replace(/[$,]/g, "")));
    const avgPrice = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const minPrice = Math.min(...amounts);
    const maxPrice = Math.max(...amounts);

    return {
      pattern_type: "pricing",
      pattern_data: {
        average: avgPrice,
        min: minPrice,
        max: maxPrice,
        count: prices.length,
        range: maxPrice - minPrice,
      },
      confidence_score: 0.85,
    };
  }

  return null;
}

function extractStructurePatterns(content: string): ExtractedPattern | null {
  const sections = [];

  const headings = [
    "executive summary",
    "introduction",
    "scope of work",
    "deliverables",
    "timeline",
    "pricing",
    "investment",
    "terms and conditions",
    "conclusion",
    "about us",
    "methodology",
    "approach",
  ];

  for (const heading of headings) {
    const regex = new RegExp(`\\b${heading}\\b`, "i");
    if (regex.test(content)) {
      sections.push(heading);
    }
  }

  if (sections.length > 0) {
    return {
      pattern_type: "structure",
      pattern_data: {
        sections,
        sectionCount: sections.length,
        hasExecutiveSummary: sections.includes("executive summary"),
        hasPricing: sections.includes("pricing") || sections.includes("investment"),
        hasTimeline: sections.includes("timeline"),
      },
      confidence_score: 0.9,
    };
  }

  return null;
}

function extractLanguagePatterns(content: string): ExtractedPattern | null {
  const professionalTerms = [
    "comprehensive",
    "strategic",
    "innovative",
    "professional",
    "expertise",
    "solution",
    "optimize",
    "deliver",
    "implement",
    "streamline",
  ];

  const foundTerms = professionalTerms.filter(term =>
    new RegExp(`\\b${term}\\b`, "i").test(content)
  );

  const sentenceCount = (content.match(/[.!?]+/g) || []).length;
  const wordCount = content.split(/\s+/).length;
  const avgSentenceLength = wordCount / Math.max(sentenceCount, 1);

  return {
    pattern_type: "language",
    pattern_data: {
      professionalTerms: foundTerms,
      termCount: foundTerms.length,
      avgSentenceLength,
      wordCount,
      tone: foundTerms.length > 5 ? "professional" : "casual",
    },
    confidence_score: 0.75,
  };
}

function extractFormattingPatterns(content: string): ExtractedPattern | null {
  const hasBulletPoints = /[•\-\*]\s/.test(content);
  const hasNumberedLists = /^\d+\.\s/m.test(content);
  const paragraphCount = content.split(/\n\n+/).length;

  return {
    pattern_type: "formatting",
    pattern_data: {
      hasBulletPoints,
      hasNumberedLists,
      paragraphCount,
      formatting: hasBulletPoints || hasNumberedLists ? "structured" : "prose",
    },
    confidence_score: 0.8,
  };
}

function generateSummary(patterns: ExtractedPattern[], docCount: number): string[] {
  const summary: string[] = [];

  summary.push(`Successfully analyzed ${docCount} document(s)`);

  const pricingPatterns = patterns.filter(p => p.pattern_type === "pricing");
  if (pricingPatterns.length > 0) {
    const avgPricing = pricingPatterns.reduce((sum, p) => sum + (p.pattern_data.average || 0), 0) / pricingPatterns.length;
    summary.push(`Detected pricing patterns with average values around $${avgPricing.toFixed(0)}`);
  }

  const structurePatterns = patterns.filter(p => p.pattern_type === "structure");
  if (structurePatterns.length > 0) {
    const commonSections = structurePatterns[0]?.pattern_data.sections || [];
    summary.push(`Identified ${commonSections.length} common proposal sections`);
  }

  const languagePatterns = patterns.filter(p => p.pattern_type === "language");
  if (languagePatterns.length > 0) {
    const tone = languagePatterns[0]?.pattern_data.tone || "professional";
    summary.push(`Language analysis suggests ${tone} tone`);
  }

  summary.push(`AI learning enhanced with ${patterns.length} extracted patterns`);
  summary.push("Ready to generate improved proposals using learned patterns");

  return summary;
}