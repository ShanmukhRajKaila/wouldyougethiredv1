
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
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume analyst and career consultant. Your task is to analyze a resume against a job description and provide detailed feedback. 
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
                  "improved": A rewritten version using the STAR method,
                  "feedback": Explanation of why the improved version is better
                }
            }
            
            Return ONLY the JSON object with no markdown formatting, no code blocks, no explanations before or after.`
          },
          {
            role: 'user',
            content: `Here is the job description:\n\n${jobDescription}\n\nHere is the resume:\n\n${resumeText}\n\nPlease analyze how well this resume matches the job description and provide detailed feedback.`
          }
        ],
        temperature: 0.5,
        max_tokens: 3000,
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
      console.log('Raw OpenAI response:', content);
      
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
