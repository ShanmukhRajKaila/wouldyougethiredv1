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
    
    const { resumeText, jobDescription, coverLetterText, companyName } = await req.json() as AnalysisRequest;

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Analyzing resume (${resumeText.length} chars) against job description (${jobDescription.length} chars)`);
    console.log('Cover letter provided:', !!coverLetterText);
    console.log('Company name provided:', companyName || 'No');
    
    // Use GPT-4o for more thorough analysis
    const model = 'gpt-4o';
    
    // Prepare input texts with reasonable length limits
    const cleanResume = resumeText.replace(/\s+/g, ' ').trim();
    const cleanJobDesc = jobDescription.replace(/\s+/g, ' ').trim();
    
    const truncatedResume = cleanResume.length > 15000 ? 
      cleanResume.substring(0, 15000) + "... [truncated]" : cleanResume;
    
    const truncatedJobDesc = cleanJobDesc.length > 5000 ? 
      cleanJobDesc.substring(0, 5000) + "... [truncated]" : cleanJobDesc;

    // Only include cover letter if provided and valid
    let coverLetterContent = "";
    if (coverLetterText && coverLetterText.trim().length > 0) {
      const cleanCoverLetter = coverLetterText.replace(/\s+/g, ' ').trim();
      coverLetterContent = cleanCoverLetter.length > 10000 ? 
        cleanCoverLetter.substring(0, 10000) + "... [truncated]" : cleanCoverLetter;
    }
    
    console.log(`Prepared inputs: Resume (${truncatedResume.length} chars), Job Description (${truncatedJobDesc.length} chars)`);
    if (coverLetterContent) {
      console.log(`Cover Letter (${coverLetterContent.length} chars)`);
    }

    // Set a reasonable timeout (25 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);
    
    // Prepare the analysis prompt for more reliable results
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach.
Analyze the resume against the job description in detail, focusing on:

1. Match percentage between resume and job requirements (ATS perspective)
2. Key strengths (min 3, max 5) found in the resume relative to the position 
3. Areas for improvement (min 3, max 5) in the resume
4. Specific recommendations (min 3, max 5) for improving the resume
5. STAR analysis of 3 bullet points from the resume, with improved versions

${companyName ? `The candidate is applying to ${companyName}. Consider company culture and values.` : ''}

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
}`;

    try {
      console.log("Sending request to OpenAI...");
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
${truncatedJobDesc}

Resume:
${truncatedResume}
${coverLetterContent ? `\nCover Letter:\n${coverLetterContent}` : ''}
${companyName ? `\nCompany: ${companyName}` : ''}`
            }
          ],
          temperature: 0.5,
          max_tokens: 2048,
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
        
        // Ensure we have at least minimum requirements
        if (analysisResult.strengths.length < 3) {
          analysisResult.strengths = [
            ...analysisResult.strengths,
            "Relevant educational background", 
            "Professional experience in the field",
            "Technical expertise aligned with the role"
          ].slice(0, 5);
        }
        
        if (analysisResult.weaknesses.length < 3) {
          analysisResult.weaknesses = [
            ...analysisResult.weaknesses,
            "Could better highlight relevant achievements", 
            "Resume could be more tailored to the specific job requirements",
            "Missing quantifiable metrics to demonstrate impact"
          ].slice(0, 5);  
        }
        
        if (analysisResult.recommendations.length < 3) {
          analysisResult.recommendations = [
            ...analysisResult.recommendations,
            "Add specific metrics to quantify achievements",
            "Tailor resume summary directly to this position's requirements",
            "Use more keywords from the job description"
          ].slice(0, 5);
        }
        
        // Ensure we have exactly 3 STAR analysis items
        if (!analysisResult.starAnalysis || analysisResult.starAnalysis.length < 3) {
          // Extract bullet points from resume for STAR analysis
          const bulletPoints = extractBulletPoints(resumeText);
          const existingAnalysis = analysisResult.starAnalysis || [];
          
          // Generate missing STAR analysis items
          while (existingAnalysis.length < 3 && bulletPoints.length > 0) {
            const bullet = bulletPoints.shift();
            if (bullet && bullet.length > 20) {
              existingAnalysis.push({
                original: bullet,
                improved: `${bullet} (with measurable results and context)`,
                feedback: "Add specific metrics and context to demonstrate impact"
              });
            }
          }
          
          // If we still don't have 3 items, create generic ones
          while (existingAnalysis.length < 3) {
            existingAnalysis.push({
              original: "Generic experience bullet point",
              improved: "Led cross-functional project that improved efficiency by 25% and reduced costs by $50K annually",
              feedback: "Add specific metrics, context, and results to demonstrate impact"
            });
          }
          
          analysisResult.starAnalysis = existingAnalysis.slice(0, 3);
        }
        
        console.log("Analysis completed successfully");
        return new Response(JSON.stringify(analysisResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (parseError) {
        console.error("Error parsing OpenAI response:", parseError, "Content:", content);
        throw new Error(`Failed to parse analysis results: ${parseError.message}`);
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error("Fetch error or timeout:", fetchError);
      
      if (fetchError.name === 'AbortError') {
        throw new Error('Analysis took too long to complete. Try again or use a simplified analysis.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'An unknown error occurred', 
        statusCode: 500,
        // Provide a fallback analysis to ensure the user gets something
        fallbackAnalysis: generateFallbackAnalysis(req)
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to extract bullet points from text
function extractBulletPoints(text: string): string[] {
  if (!text) return [];
  
  // Find all bullet-like lines in the text
  const lines = text.split(/[\n\r]+/);
  const bulletPoints = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('•') || 
           trimmed.startsWith('-') || 
           trimmed.startsWith('*') || 
           trimmed.match(/^\d+\./) ||
           (trimmed.length > 20 && trimmed.match(/^[A-Z][a-z]+ed/)); // Lines starting with past tense verbs
  });
  
  // Clean up the bullet points and return
  return bulletPoints
    .map(b => b.replace(/^[\s•\-\*\d\.]+/, '').trim())
    .filter(b => b.length > 10)
    .slice(0, 10);
}

// Generate a fallback analysis if OpenAI fails
async function generateFallbackAnalysis(req: Request): Promise<any> {
  try {
    const { resumeText, jobDescription } = await req.json();
    
    if (!resumeText || !jobDescription) {
      return null;
    }
    
    // Extract skills from job description (very basic)
    const jobKeywords = extractKeywords(jobDescription);
    const resumeKeywords = extractKeywords(resumeText);
    
    // Find matching skills
    const matches = resumeKeywords.filter(kw => 
      jobKeywords.some(jk => jk.toLowerCase().includes(kw.toLowerCase()) || 
                           kw.toLowerCase().includes(jk.toLowerCase()))
    );
    
    // Calculate a basic alignment score
    const alignmentScore = Math.min(
      Math.round((matches.length / Math.max(jobKeywords.length, 1)) * 100) + 15, 
      95
    );
    
    // Extract bullet points for STAR analysis
    const bulletPoints = extractBulletPoints(resumeText);
    
    return {
      alignmentScore: Math.max(40, alignmentScore),
      verdict: alignmentScore > 55,
      strengths: [
        "Has relevant skills mentioned in the job description",
        "Professional resume structure",
        "Demonstrated experience in the industry"
      ],
      weaknesses: [
        "Could better highlight specific achievements",
        "Some key job requirements may not be addressed",
        "Resume could be more tailored to the position"
      ],
      recommendations: [
        "Quantify achievements with specific metrics",
        "Add more keywords from the job description",
        "Highlight projects relevant to the position requirements" 
      ],
      starAnalysis: bulletPoints.slice(0, 3).map(bullet => ({
        original: bullet,
        improved: `${bullet} (with added metrics and context)`,
        feedback: "Add quantifiable results and impact to strengthen this bullet point"
      }))
    };
  } catch (error) {
    console.error("Error generating fallback analysis:", error);
    return null;
  }
}

// Extract keywords from text
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Common words to filter out
  const commonWords = new Set([
    'the', 'and', 'that', 'this', 'with', 'for', 'have', 'from', 'about',
    'you', 'will', 'your', 'who', 'are', 'our', 'can', 'been', 'has', 'not'
  ]);
  
  // Extract words, filter common ones, and keep unique values
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.has(word));
  
  // Return unique words
  return Array.from(new Set(words));
}
