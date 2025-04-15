
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
  coverLetterText?: string;
  options?: {
    useFastModel?: boolean;
    prioritizeSpeed?: boolean;
  };
}

// More aggressive text truncation to prevent timeouts
function truncateText(text: string, maxTokens: number): string {
  // More conservative approximation: 1 token ≈ 3 characters for English text
  const maxChars = maxTokens * 3;
  
  if (!text || text.length <= maxChars) {
    return text || '';
  }
  
  return text.substring(0, maxChars) + "\n[content truncated for processing]";
}

// Simplified cleanup function
function cleanupText(text: string): string {
  if (!text) return '';
  // Remove excessive whitespace and non-printable characters
  return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Extract key skills and requirements
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Common words to filter out
  const commonWords = new Set([
    'the', 'and', 'that', 'this', 'with', 'for', 'have', 'from', 'about',
    'you', 'will', 'your', 'who', 'are', 'our', 'can', 'been', 'has', 'not'
  ]);
  
  // Extract potential skill terms (technical terms, capitalized words, etc)
  const keywords = new Set<string>();
  
  // Simple regex for skills (3+ characters, not common words)
  const skillTerms = text.match(/\b[A-Za-z][A-Za-z\-]{2,}\b/g) || [];
  
  for (const term of skillTerms) {
    const normalized = term.toLowerCase();
    if (!commonWords.has(normalized) && normalized.length > 2) {
      keywords.add(normalized);
    }
  }
  
  return Array.from(keywords).slice(0, 25); // Limit to 25 keywords
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting resume analysis...");

  try {
    const { resumeText, jobDescription, coverLetterText, options = {} } = await req.json() as AnalysisRequest;

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing resume against job description');
    console.log('Cover letter provided:', !!coverLetterText);
    
    // Always use the most efficient model to prevent timeouts
    const model = 'gpt-4o-mini';
    
    // More aggressive truncation to prevent timeouts
    const maxResumeTokens = options.prioritizeSpeed ? 1500 : 2500; // Reduced from 4000
    const maxJobTokens = options.prioritizeSpeed ? 500 : 750; // Reduced from 1000
    const maxCoverLetterTokens = options.prioritizeSpeed ? 1000 : 1500; // Reduced from 3000
    
    const truncatedResume = truncateText(cleanupText(resumeText), maxResumeTokens);
    const truncatedJobDesc = truncateText(cleanupText(jobDescription), maxJobTokens);
    const truncatedCoverLetter = coverLetterText ? 
      truncateText(cleanupText(coverLetterText), maxCoverLetterTokens) : null;
    
    console.log(`Truncated resume length: ${truncatedResume.length}, job description length: ${truncatedJobDesc.length}`);
    if (truncatedCoverLetter) {
      console.log(`Truncated cover letter length: ${truncatedCoverLetter.length}`);
    }
    
    // Extract important keywords to help guide the analysis
    const jobKeywords = extractKeywords(jobDescription);
    console.log(`Extracted ${jobKeywords.length} keywords`);
    
    // Use a shorter timeout to ensure response within the edge function's limits
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 seconds max
    
    try {
      // Simplified system prompt to reduce token usage
      const systemPrompt = `You are an ATS resume analyst comparing resumes to job descriptions.
      
Return a JSON object with:
{
  "alignmentScore": Integer from 1-100 representing match percentage,
  "verdict": Boolean indicating if the candidate would pass screening,
  "strengths": Array of strings highlighting matches (max 5),
  "weaknesses": Array of strings identifying gaps (max 5), 
  "recommendations": Array of strings with improvements (max 5),
  ${coverLetterText ? `"coverLetterAnalysis": {
    "tone": String describing the tone,
    "relevance": Integer from 1-100 on job relevance,
    "strengths": Array of strings with good points (max 3),
    "weaknesses": Array of strings with issues (max 3),
    "recommendations": Array of strings with suggestions (max 3)
  },` : ''}
  "starAnalysis": Array of max 3 objects:
    {
      "original": String with original bullet point,
      "improved": String with optimized version,
      "feedback": String explaining improvements
    }
}`;

      const userPrompt = truncatedCoverLetter ?
        `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}\n\nCover Letter:\n\n${truncatedCoverLetter}` :
        `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.1,
          max_tokens: 1000,
          response_format: { type: "json_object" } // Force JSON response format
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      const data = await response.json();
      
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        return new Response(
          JSON.stringify({ error: `AI analysis error: ${data.error.message || 'Unknown error'}` }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Parse the content from the OpenAI response
      let analysisResult;
      try {
        const content = data.choices[0].message.content;
        analysisResult = JSON.parse(content);
        console.log('Analysis complete');
        
        // Clean up and format strengths/weaknesses for better UX
        if (analysisResult.strengths) {
          analysisResult.strengths = analysisResult.strengths.map((str: string) => {
            return str.replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
              .replace(/which (could|would|might|may) be /ig, '')
              .trim();
          });
        }
        
        if (analysisResult.weaknesses) {
          analysisResult.weaknesses = analysisResult.weaknesses.map((str: string) => {
            return str.replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
              .replace(/which (could|would|might|may) be /ig, '')
              .trim();
          });
        }

        // Also clean up cover letter analysis if present
        if (analysisResult.coverLetterAnalysis) {
          if (analysisResult.coverLetterAnalysis.strengths) {
            analysisResult.coverLetterAnalysis.strengths = 
              analysisResult.coverLetterAnalysis.strengths.map((str: string) => str.trim());
          }
          
          if (analysisResult.coverLetterAnalysis.weaknesses) {
            analysisResult.coverLetterAnalysis.weaknesses = 
              analysisResult.coverLetterAnalysis.weaknesses.map((str: string) => str.trim());
          }
        }
        
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse analysis results',
            details: error.message
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify(analysisResult),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        console.error('OpenAI request timed out');
        return new Response(
          JSON.stringify({ error: 'Analysis took too long to complete. Simplified analysis will be provided.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
