
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

// Extract keywords from job description with improved relevance
function extractKeywords(text: string): string[] {
  // Expanded stopwords list
  const commonWords = new Set([
    "the", "and", "that", "this", "with", "for", "have", "not", "from", "but", "what", "about", 
    "who", "which", "when", "will", "more", "would", "there", "their", "them", "these", "some", 
    "your", "into", "has", "may", "such", "than", "its", "been", "were", "are", "our", "then",
    "how", "well", "where", "why", "should", "could", "year", "years", "can", "able", "any"
  ]);
  
  // Extract potential keywords (focus on nouns/skills)
  const words = text.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const wordCounts: Record<string, number> = {};
  
  words.forEach(word => {
    if (!commonWords.has(word)) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  });
  
  // Extract phrases that might be technical skills (2-3 word phrases)
  const phrases: Record<string, number> = {};
  const phraseRegex = /\b([a-z0-9]+(?:[-\s][a-z0-9]+){1,2})\b/g;
  let match;
  while ((match = phraseRegex.exec(text.toLowerCase())) !== null) {
    const phrase = match[1];
    // Skip phrases that are just stopwords
    if (!phrase.split(/[-\s]/).every(word => commonWords.has(word))) {
      phrases[phrase] = (phrases[phrase] || 0) + 1;
    }
  }
  
  // Combine single words and phrases, prioritizing phrases and technical terms
  const technicalTermPatterns = [
    /\b(?:software|hardware|technology|engineering|development|programming|analysis|design|management|leadership|strategy|operations|financial|marketing|sales|product|project|agile|scrum|data|cloud|api|web|mobile|app|database|security|network|system|platform|infrastructure|solution|service|quality|testing|deployment)\b/i
  ];
  
  // Filter and prioritize keywords
  const keywordCandidates = [
    ...Object.entries(phrases)
      .filter(([_, count]) => count >= 1)
      .map(([phrase]) => phrase),
    ...Object.entries(wordCounts)
      .filter(([_, count]) => count >= 2)
      .filter(([word]) => {
        // Prioritize technical terms
        return technicalTermPatterns.some(pattern => pattern.test(word));
      })
      .map(([word]) => word)
  ];
  
  // Remove duplicates (phrases that contain single words we've already included)
  const uniqueKeywords = keywordCandidates.filter((keyword, index) => {
    for (let i = 0; i < index; i++) {
      if (keywordCandidates[i].includes(keyword) || keyword.includes(keywordCandidates[i])) {
        return false;
      }
    }
    return true;
  });
  
  return uniqueKeywords.slice(0, 25); // Top keywords
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
            content: `You are an expert ATS (Applicant Tracking System) analyzer with deep expertise in resume optimization, recruitment, and HR technologies. Your task is to perform a detailed analysis of a resume against a specific job description and provide actionable feedback.

ANALYSIS FRAMEWORK:
1. Parse both the resume and job description to identify key skills, qualifications, experiences, and requirements.
2. Quantitatively assess the alignment between the resume and job requirements:
   - Hard skills match (technical abilities, tools, certifications)
   - Soft skills match (communication, leadership, problem-solving)
   - Experience level match (years of experience, role complexity)
   - Industry relevance (domain knowledge, sector-specific terminology)
   - Educational/qualification match

REQUIRED OUTPUT FORMAT:
Structure your response as a valid JSON object with the following schema:
{
  "alignmentScore": Integer from 1-100 representing overall match percentage,
  "verdict": Boolean indicating if the candidate would likely pass initial ATS screening,
  "strengths": Array of strings highlighting strong matches between resume and requirements (maximum 5 points),
  "weaknesses": Array of strings identifying key gaps or missing elements (maximum 5 points),
  "recommendations": Array of strings with specific, actionable improvements (maximum 5 points),
  "starAnalysis": Array of objects containing:
    {
      "original": String containing an original bullet point from the resume,
      "improved": String with an optimized version that:
        - Begins with a strong action verb
        - Includes specific context and quantifiable achievements
        - Incorporates relevant keywords from the job description
        - Follows STAR methodology (implicitly, without labeling components),
      "feedback": String explaining the specific improvements and why they increase ATS match probability
    }
}

GUIDELINES FOR CREATING STAR-OPTIMIZED BULLETS:
1. Start with impactful action verbs specific to the industry
2. Include measurable metrics (%, $, time saved, improvement rates)
3. Demonstrate clear cause-effect relationships between actions and outcomes
4. Integrate relevant technologies, methodologies, and industry terminology from the job description
5. Focus on accomplishments and business impact, not just responsibilities
6. Keep each bullet point concise (under 2 lines) but comprehensive
7. Ensure natural readability - do not just stuff keywords
8. Use industry-standard terminology that would be recognized by both ATS systems and human recruiters

Critical keywords identified in the job description: ${jobKeywords.join(', ')}

Your analysis must be rigorous, evidence-based, and actionable, focusing on helping the candidate maximize their chances of passing the ATS screening and impressing human recruiters.`
          },
          {
            role: 'user',
            content: `Here is the job description:\n\n${truncatedJobDesc}\n\nHere is the resume:\n\n${truncatedResume}\n\nPlease analyze how well this resume matches the job description and provide detailed feedback.`
          }
        ],
        temperature: 0.3,
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
