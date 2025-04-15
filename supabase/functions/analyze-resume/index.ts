
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

// Simplified version to reduce token usage and processing time
function truncateText(text: string, maxTokens: number): string {
  // Rough approximation: 1 token ≈ 4 characters for English text
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return text;
  }
  
  return text.substring(0, maxChars) + "\n[content truncated for length]";
}

// Simplified cleanup function
function cleanupText(text: string): string {
  // Remove excessive whitespace and non-printable characters
  return text.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

// Drastically simplified job requirements extraction
function extractKeywords(text: string): string[] {
  // Extract important looking phrases (3+ characters, not common words)
  const commonWords = new Set(['the', 'and', 'that', 'this', 'with', 'for', 'have', 'from', 'about']);
  const keywords = new Set<string>();
  
  // Simple regex to find potential skill terms
  const skillTerms = text.match(/\b[A-Za-z][A-Za-z\-]{2,}\b/g) || [];
  
  for (const term of skillTerms) {
    if (!commonWords.has(term.toLowerCase()) && term.length > 2) {
      keywords.add(term.toLowerCase());
    }
  }
  
  return Array.from(keywords).slice(0, 30); // Limit to 30 keywords
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
    
    // Use the most efficient model based on options
    const model = options.useFastModel ? 'gpt-4o-mini' : 'gpt-4o-mini';
    
    // Truncate content more aggressively for speed
    const maxResumeTokens = options.prioritizeSpeed ? 2000 : 4000;
    const maxJobTokens = options.prioritizeSpeed ? 500 : 1000;
    const maxCoverLetterTokens = options.prioritizeSpeed ? 1500 : 3000;
    
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
    
    // Use a short timeout to prevent function hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 seconds max
    
    try {
      const systemPrompt = truncatedCoverLetter ?
        `You are an expert ATS analyzer that reviews resumes and cover letters against job descriptions.
              
OUTPUT FORMAT:
Return a valid JSON object with this structure:
{
  "alignmentScore": Integer from 1-100 representing match percentage,
  "verdict": Boolean indicating if the candidate would pass ATS screening,
  "strengths": Array of strings highlighting matches (max 5),
  "weaknesses": Array of strings identifying gaps (max 5), 
  "recommendations": Array of strings with specific improvements (max 5),
  "coverLetterAnalysis": {
    "tone": String describing the tone (professional, conversational, etc.),
    "relevance": Integer from 1-100 representing how relevant it is to the job,
    "strengths": Array of strings highlighting good points (max 3),
    "weaknesses": Array of strings identifying issues (max 3),
    "recommendations": Array of strings with improvement suggestions (max 3)
  },
  "starAnalysis": Array of objects containing:
    {
      "original": String with original bullet point from resume,
      "improved": String with optimized version,
      "feedback": String explaining improvements
    }
}` :
        `You are an expert ATS analyzer that reviews resumes against job descriptions.
              
OUTPUT FORMAT:
Return a valid JSON object with this structure:
{
  "alignmentScore": Integer from 1-100 representing match percentage,
  "verdict": Boolean indicating if the candidate would pass ATS screening,
  "strengths": Array of strings highlighting matches (max 5),
  "weaknesses": Array of strings identifying gaps (max 5), 
  "recommendations": Array of strings with specific improvements (max 5),
  "starAnalysis": Array of objects containing:
    {
      "original": String with original bullet point from resume,
      "improved": String with optimized version,
      "feedback": String explaining improvements
    }
}`;

      const userPrompt = truncatedCoverLetter ?
        `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}\n\nCover Letter:\n\n${truncatedCoverLetter}\n\nAnalyze how well this resume and cover letter match the job description.` :
        `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}\n\nAnalyze how well this resume matches the job description.`;

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
              content: `${systemPrompt}\n\nIMPORTANT GUIDELINES:
1. For strengths and weaknesses, only include the skill name without phrases like "lacks specific mention of" or "which could be".
2. Identify up to 5 bullet points from the resume and suggest improvements using the STAR method.
3. Key job keywords: ${jobKeywords.join(', ')}`
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 1000,
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
        
        // Try direct parsing
        try {
          analysisResult = JSON.parse(content);
        } catch (parseError) {
          // Try to extract JSON from markdown code blocks
          const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (jsonMatch && jsonMatch[1]) {
            analysisResult = JSON.parse(jsonMatch[1]);
          } else {
            // If no code blocks, remove any markdown artifacts and try again
            const cleanedContent = content
              .replace(/^```json\s*/, '')
              .replace(/\s*```$/, '');
            analysisResult = JSON.parse(cleanedContent);
          }
        }
        
        console.log('Analysis complete');
        
        // Clean up any "lacks mention of" phrases in strengths/weaknesses
        if (analysisResult.strengths) {
          analysisResult.strengths = analysisResult.strengths.map((str: string) => {
            return str.replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
              .replace(/which (could|would|might|may) be /ig, '')
              .replace(/important for this role\.?/ig, '')
              .replace(/beneficial for this position\.?/ig, '')
              .replace(/according to the job description\.?/ig, '')
              .replace(/as mentioned in the job requirements\.?/ig, '')
              .replace(/is not mentioned in your resume\.?/ig, '')
              .replace(/not highlighted in your experience\.?/ig, '')
              .trim();
          });
        }
        
        if (analysisResult.weaknesses) {
          analysisResult.weaknesses = analysisResult.weaknesses.map((str: string) => {
            return str.replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
              .replace(/which (could|would|might|may) be /ig, '')
              .replace(/important for this role\.?/ig, '')
              .replace(/beneficial for this position\.?/ig, '')
              .replace(/according to the job description\.?/ig, '')
              .replace(/as mentioned in the job requirements\.?/ig, '')
              .replace(/is not mentioned in your resume\.?/ig, '')
              .replace(/not highlighted in your experience\.?/ig, '')
              .trim();
          });
        }

        // Also clean up cover letter analysis if present
        if (analysisResult.coverLetterAnalysis) {
          if (analysisResult.coverLetterAnalysis.strengths) {
            analysisResult.coverLetterAnalysis.strengths = analysisResult.coverLetterAnalysis.strengths.map((str: string) => {
              return str.replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
                .replace(/which (could|would|might|may) be /ig, '')
                .trim();
            });
          }
          
          if (analysisResult.coverLetterAnalysis.weaknesses) {
            analysisResult.coverLetterAnalysis.weaknesses = analysisResult.coverLetterAnalysis.weaknesses.map((str: string) => {
              return str.replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
                .replace(/which (could|would|might|may) be /ig, '')
                .trim();
            });
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
          JSON.stringify({ error: 'Analysis took too long to complete. Try with a shorter resume or job description.' }),
          { status: 408, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
