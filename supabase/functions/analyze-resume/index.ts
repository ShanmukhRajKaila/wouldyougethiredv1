
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
}

// Function to truncate text to a specific token limit (approximate)
function truncateText(text: string, maxTokens: number): string {
  // Rough approximation: 1 token ≈ 4 characters for English text
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return text;
  }
  
  // For resumes, keep beginning and end, truncate middle
  if (maxChars > 3000) {
    const firstPart = text.substring(0, Math.floor(maxChars * 0.7));
    const lastPart = text.substring(text.length - Math.floor(maxChars * 0.3));
    return `${firstPart}\n\n[... content truncated for length ...]\n\n${lastPart}`;
  }
  
  // For shorter texts, just truncate at the end
  return text.substring(0, maxChars) + "\n[content truncated for length]";
}

// Clean up text that might contain binary data or PDF syntax
function cleanupText(text: string): string {
  // Remove any PDF-specific markers or syntax
  let cleanText = text.replace(/%PDF[\s\S]*?(?=\w{3,})/g, '');
  
  // Remove common PDF syntax elements
  cleanText = cleanText.replace(/<<\/[\w\/]+>>/g, '');
  cleanText = cleanText.replace(/endobj/g, '');
  cleanText = cleanText.replace(/obj/g, '');
  
  // Remove non-readable characters
  cleanText = cleanText.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
  
  // Remove excessive whitespace
  cleanText = cleanText.replace(/\s+/g, ' ');
  
  return cleanText.trim();
}

// Extract keywords from job description
function extractKeywords(text: string): string[] {
  const commonWords = new Set([
    "the", "and", "that", "this", "with", "for", "have", "not", "from", "but", "what", "about", 
    "who", "which", "when", "will", "more", "would", "there", "their", "them", "these", "some", 
    "your", "into"
  ]);
  
  // Extract potential keywords (focus on nouns/skills)
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordCounts: Record<string, number> = {};
  
  words.forEach(word => {
    if (!commonWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Return words that appear multiple times, likely important keywords
  return Object.entries(wordCounts)
    .filter(([_, count]) => count >= 2)
    .map(([word]) => word)
    .slice(0, 20); // Top 20 keywords
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { resumeText, jobDescription } = await req.json() as AnalysisRequest;

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing resume against job description');
    
    let cleanedResume = resumeText;
    let truncatedResume;
    let truncatedJobDesc;
    
    // Check if resume text appears to be PDF binary data
    if (resumeText.includes('%PDF') || resumeText.includes('obj') || resumeText.includes('endobj')) {
      console.warn('Resume text appears to contain PDF binary data or syntax');
      
      // Try to clean up the text before proceeding
      cleanedResume = cleanupText(resumeText);
      
      if (cleanedResume.length < 200) {
        return new Response(
          JSON.stringify({ error: 'Unable to process the resume. The PDF appears to be image-based or contains unreadable text.' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      console.log('Cleaned resume text for processing');
    }
    
    // Extract key terms from job description
    const jobKeywords = extractKeywords(jobDescription);
    console.log(`Extracted ${jobKeywords.length} keywords from job description`);
    
    // Truncate inputs to prevent token limit issues
    truncatedResume = truncateText(cleanedResume, 8000);
    truncatedJobDesc = truncateText(jobDescription, 2000);
    
    console.log(`Original resume length: ${resumeText.length}, cleaned to: ${cleanedResume.length}, truncated to: ${truncatedResume.length}`);
    console.log(`Original job description length: ${jobDescription.length}, truncated to: ${truncatedJobDesc.length}`);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using a smaller model that's faster and has lower token limits
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyst and career consultant. Your task is to analyze a resume against a job description and provide detailed feedback. 
            
            Important: When rewriting resume bullets, DO NOT explicitly mention STAR method components in the output.
            Instead, craft each bullet to implicitly follow the STAR structure while incorporating relevant keywords from the job description.
            
            Format your response as a valid JSON object with the following structure, and nothing else:
            {
              "alignmentScore": A number from 0-100 representing how well the resume matches the job description,
              "verdict": A boolean indicating if the person would likely be hired based on their resume,
              "strengths": An array of strings highlighting the strongest matches between the resume and job requirements,
              "weaknesses": An array of strings identifying gaps or areas where the resume doesn't match the job requirements,
              "recommendations": An array of strings with specific suggestions for improving the resume for this job,
              "starAnalysis": An array of objects, each containing:
                {
                  "original": A bullet point from the original resume,
                  "improved": A rewritten version that follows STAR principles WITHOUT explicitly labeling them, and incorporates keywords from the job description,
                  "feedback": Explanation of why the improved version is better, mentioning relevant keywords it incorporates
                }
            }
            
            The key keywords from the job description that should be incorporated where relevant are: ${jobKeywords.join(', ')}
            
            Return ONLY the JSON object with no markdown formatting, no code blocks, no explanations before or after.`
          },
          {
            role: 'user',
            content: `Here is the job description:\n\n${truncatedJobDesc}\n\nHere is the resume:\n\n${truncatedResume}\n\nPlease analyze how well this resume matches the job description and provide detailed feedback.`
          }
        ],
        temperature: 0.5,
        max_tokens: 2000,
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI API error:', data.error);
      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${data.error.message || 'Unknown error'}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Parse the content from the OpenAI response
    let analysisResult;
    try {
      const content = data.choices[0].message.content;
      console.log('Raw OpenAI response:', content.substring(0, 200) + '...');
      
      // First try direct parsing
      try {
        analysisResult = JSON.parse(content);
      } catch (parseError) {
        // If direct parsing fails, try to extract JSON from markdown code blocks
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
      console.log('Analysis result keys:', Object.keys(analysisResult));
      console.log('Has starAnalysis:', analysisResult.hasOwnProperty('starAnalysis'));
      console.log('StarAnalysis length:', analysisResult.starAnalysis?.length || 0);
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      console.error('Response content:', data.choices[0].message.content);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to parse analysis results',
          details: error.message,
          responseContent: data.choices[0].message.content 
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify(analysisResult),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
