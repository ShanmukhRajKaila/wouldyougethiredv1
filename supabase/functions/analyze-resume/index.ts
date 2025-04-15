
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
  companyName?: string;
  options?: {
    forceFull?: boolean;
    enhancedAtsAnalysis?: boolean;
    keywordOptimization?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting enhanced resume analysis with GPT-4o...");

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured', statusCode: 500 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { resumeText, jobDescription, coverLetterText, companyName, options = {} } = await req.json() as AnalysisRequest;

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing full resume (${resumeText.length} chars) against job description (${jobDescription.length} chars)`);
    console.log('Cover letter provided:', !!coverLetterText);
    console.log('Company name provided:', companyName || 'No');
    
    // Always use GPT-4o for comprehensive analysis
    const model = 'gpt-4o';
    
    // Use the full content without truncation
    const fullResume = resumeText;
    const fullJobDesc = jobDescription;
    
    // Process cover letter if provided
    let coverLetterContent = "";
    if (coverLetterText && coverLetterText.trim().length > 0) {
      coverLetterContent = coverLetterText;
    }
    
    console.log(`Analyzing with full content: Resume (${fullResume.length} chars), Job Description (${fullJobDesc.length} chars)`);
    if (coverLetterContent) {
      console.log(`Cover Letter (${coverLetterContent.length} chars)`);
    }

    // Set a reasonable timeout (60 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);
    
    // Prepare the analysis prompt with enhanced instructions
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach.
Analyze the resume against the job description in detailed depth, focusing on:

1. Match percentage between resume and job requirements (ATS perspective)
2. Key strengths (min 3, max 5) found in the resume relative to the position 
3. Areas for improvement (min 3, max 5) in the resume
4. Specific recommendations (min 3, max 5) for improving the resume
5. STAR analysis of 3 bullet points from the resume, with improved versions

${companyName ? `The candidate is applying to ${companyName}. Consider company culture, values and expectations in your analysis.` : ''}

${coverLetterContent ? `Also analyze the cover letter for tone, relevance, and provide suggested improvements.` : ''}

MANDATORY: YOU MUST RETURN A VALID JSON OBJECT in this exact format:
{
  "alignmentScore": number from 1-100,
  "verdict": boolean,
  "strengths": [min 3, max 5 strings],
  "weaknesses": [min 3, max 5 strings],
  "recommendations": [min 3, max 5 strings],
  "starAnalysis": [
    {
      "original": "original bullet point from resume",
      "improved": "improved version with STAR method",
      "feedback": "explanation of improvements"
    },
    ... (exactly 3 items)
  ]${coverLetterContent ? `,
  "coverLetterAnalysis": {
    "tone": string,
    "relevance": number from 1-100,
    "strengths": [array of strings],
    "weaknesses": [array of strings],
    "recommendations": [array of strings]
  }` : ''}
}

You MUST provide complete analysis with all required fields. This is critical for the application to function properly.`;

    try {
      console.log("Sending full content request to OpenAI GPT-4o...");
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
              content: `Job description:
${fullJobDesc}

Resume:
${fullResume}
${coverLetterContent ? `\nCover Letter:\n${coverLetterContent}` : ''}
${companyName ? `\nCompany: ${companyName}` : ''}`
            }
          ],
          temperature: 0.3,
          max_tokens: 4000,
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenAI API error:", response.status, errorText);
        throw new Error(`OpenAI API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log("Received response from OpenAI, parsing results...");
      
      try {
        const analysisResult = JSON.parse(content);
        
        // Validate the response structure
        if (!analysisResult.alignmentScore || !Array.isArray(analysisResult.strengths) || 
            !Array.isArray(analysisResult.weaknesses) || !Array.isArray(analysisResult.recommendations) ||
            !Array.isArray(analysisResult.starAnalysis)) {
          throw new Error("Invalid response structure from OpenAI");
        }
        
        console.log("Analysis completed successfully with full content");
        return new Response(JSON.stringify(analysisResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError, "Content:", content);
        throw new Error(`Failed to parse analysis results: ${parseError.message}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Error with OpenAI request:", fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Analysis took too long to complete. Please try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred', 
        statusCode: 500
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
