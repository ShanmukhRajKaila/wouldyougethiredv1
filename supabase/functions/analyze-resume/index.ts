
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

// Enhanced function to extract skills and requirements from job description
function extractJobRequirements(jobDescription: string): {
  skills: string[];
  technicalSkills: string[];
  softSkills: string[];
  education: string[];
  experience: string[];
} {
  // Common stopwords to filter out
  const stopwords = new Set([
    "the", "and", "that", "this", "with", "for", "have", "not", "from", "but", "what", "about", 
    "who", "which", "when", "will", "more", "would", "there", "their", "them", "these", "some", 
    "your", "into", "has", "may", "such", "than", "its", "been", "were", "are", "our", "then",
    "how", "well", "where", "why", "should", "could", "year", "years", "can", "able", "any"
  ]);
  
  // Categorize soft skills that are often mentioned in job descriptions
  // IMPORTANT: Make sure stakeholder management is included as a priority skill
  const softSkillsDict = new Set([
    "stakeholder management", "stakeholder engagement", "stakeholder relationship", "stakeholders",
    "leadership", "communication", "teamwork", "collaboration", "problem solving", "problem-solving",
    "critical thinking", "decision making", "time management", "adaptability", "flexibility",
    "creativity", "interpersonal", "negotiation", "conflict resolution", "emotional intelligence", 
    "presentation", "initiative", "strategic thinking", "analytical thinking", "detail oriented", 
    "self motivation", "work ethic", "accountability", "resilience", "cultural awareness", 
    "innovation", "mentoring", "coaching", "relationship building", "verbal communication", 
    "written communication", "advocacy", "customer service", "project management", "change management", 
    "facilitation", "influencing", "delegation", "strategic planning", "commercial acumen", 
    "business acumen", "organizational"
  ]);
  
  // Technical skills patterns
  const technicalPatterns = [
    /\b(?:python|java|javascript|typescript|c\+\+|ruby|php|swift|html|css|sql|nosql|react|angular|vue|node\.js|express|django|flask|aws|azure|gcp|docker|kubernetes|jenkins|terraform|ansible|git|agile|scrum|kanban|jira|confluence|excel|tableau|power\sbi|r|matlab|spss|hadoop|spark|tensorflow|pytorch|keras|scikit-learn)\b/i,
    /\b(?:architecture|database|cloud|devops|frontend|backend|full-stack|mobile|web|security|network|system|data\s*science|machine\s*learning|artificial\s*intelligence|deep\s*learning|nlp|computer\s*vision|blockchain|iot|big\s*data|analytics|bi|business\s*intelligence|etl|data\s*engineering|data\s*warehouse|data\s*lake|data\s*mining|data\s*modeling|api|rest|graphql|microservices|serverless|ci\/cd)\b/i
  ];
  
  // Education patterns
  const educationPatterns = [
    /\b(?:bachelor|master|phd|doctorate|mba|bs|ba|ms|ma|degree|certification)\b/i,
    /\b(?:computer\s*science|information\s*technology|engineering|data\s*science|business\s*administration|finance|accounting|marketing|economics|mathematics|statistics|physics)\b/i
  ];
  
  // Experience patterns
  const experiencePatterns = [
    /\b(\d+)(?:\+)?\s*(?:years?|yrs?)\s*(?:of)?\s*(?:experience|work)\b/i,
    /\bexperienc(?:e|ed)\s*(?:in|with)\s*([^.,:;]+)/i,
    /\bbackground\s*(?:in|with)\s*([^.,:;]+)/i
  ];
  
  // Special pattern for stakeholder management (high priority skill)
  const stakeholderPattern = /\b(?:stakeholder|stakeholders|client)\s*(?:management|engagement|relationship|communication|interaction|liaison)\b/i;
  
  // Check if stakeholder management is explicitly mentioned in the job description
  let hasStakeholderManagement = stakeholderPattern.test(jobDescription.toLowerCase());
  
  // Extract all potential skills
  const allWords = jobDescription.toLowerCase().match(/\b[a-z]{4,}\b/g) || [];
  const allPhrases: string[] = [];
  
  // Extract 2-3 word phrases
  const phraseRegex = /\b([a-z0-9]+(?:[-\s][a-z0-9]+){1,2})\b/gi;
  let match;
  while ((match = phraseRegex.exec(jobDescription.toLowerCase())) !== null) {
    const phrase = match[1];
    if (!phrase.split(/[-\s]/).every(word => stopwords.has(word))) {
      allPhrases.push(phrase);
    }
  }
  
  // Extract education requirements
  const education: string[] = [];
  for (const pattern of educationPatterns) {
    let match;
    while ((match = pattern.exec(jobDescription)) !== null) {
      const fullContext = jobDescription.substring(
        Math.max(0, match.index - 30),
        Math.min(jobDescription.length, match.index + match[0].length + 30)
      );
      education.push(fullContext.trim());
      // Reset lastIndex to avoid infinite loops
      pattern.lastIndex = match.index + 1;
    }
  }
  
  // Extract experience requirements
  const experience: string[] = [];
  for (const pattern of experiencePatterns) {
    let match;
    while ((match = pattern.exec(jobDescription)) !== null) {
      const fullContext = jobDescription.substring(
        Math.max(0, match.index - 20),
        Math.min(jobDescription.length, match.index + match[0].length + 30)
      );
      experience.push(fullContext.trim());
      // Reset lastIndex to avoid infinite loops
      pattern.lastIndex = match.index + 1;
    }
  }
  
  // Categorize skills
  const skills: string[] = [];
  const technicalSkills: string[] = [];
  const softSkills: string[] = [];
  
  // If stakeholder management is mentioned, make sure it's added to soft skills
  if (hasStakeholderManagement) {
    softSkills.push("stakeholder management");
    skills.push("stakeholder management");
  }
  
  // Check if management/leadership is mentioned, which often implies stakeholder management
  if (jobDescription.toLowerCase().includes("management") || 
      jobDescription.toLowerCase().includes("leader") ||
      jobDescription.toLowerCase().includes("coordinate") ||
      jobDescription.toLowerCase().includes("communication") ||
      jobDescription.toLowerCase().includes("client") ||
      jobDescription.toLowerCase().includes("relationship")) {
    // Add stakeholder management if not already added
    if (!softSkills.includes("stakeholder management")) {
      softSkills.push("stakeholder management");
      skills.push("stakeholder management");
    }
  }
  
  // Process phrases first (they're more valuable)
  for (const phrase of allPhrases) {
    // Check if it's a soft skill
    if (softSkillsDict.has(phrase)) {
      softSkills.push(phrase);
      skills.push(phrase);
      continue;
    }
    
    // Check if it's a technical skill
    if (technicalPatterns.some(pattern => pattern.test(phrase))) {
      technicalSkills.push(phrase);
      skills.push(phrase);
      continue;
    }
    
    // If phrase appears multiple times or in specific contexts, it's likely important
    const phraseCount = (jobDescription.toLowerCase().match(new RegExp('\\b' + phrase + '\\b', 'gi')) || []).length;
    const importantContexts = [
      /experience/i, /knowledge/i, /proficien/i, /familiar/i,
      /skill/i, /ability/i, /understand/i, /expert/i
    ];
    
    const isInImportantContext = importantContexts.some(context => {
      const contextWindow = 20; // characters
      const occurrences = jobDescription.toLowerCase().indexOf(phrase);
      if (occurrences !== -1) {
        const contextStart = Math.max(0, occurrences - contextWindow);
        const contextEnd = Math.min(jobDescription.length, occurrences + phrase.length + contextWindow);
        const textContext = jobDescription.substring(contextStart, contextEnd).toLowerCase();
        return context.test(textContext);
      }
      return false;
    });
    
    if (phraseCount >= 2 || isInImportantContext) {
      skills.push(phrase);
    }
  }
  
  // Process single words (less valuable, but still important)
  for (const word of allWords) {
    if (stopwords.has(word)) continue;
    
    // Check for technical terms
    if (technicalPatterns.some(pattern => pattern.test(word))) {
      if (!technicalSkills.includes(word)) {
        technicalSkills.push(word);
        skills.push(word);
      }
      continue;
    }
    
    // Check for soft skills
    if (softSkillsDict.has(word)) {
      if (!softSkills.includes(word)) {
        softSkills.push(word);
        skills.push(word);
      }
      continue;
    }
  }
  
  // Cleanup and remove duplicates
  const uniqueSkills = Array.from(new Set(skills)).slice(0, 30);
  const uniqueTechnicalSkills = Array.from(new Set(technicalSkills)).slice(0, 15);
  const uniqueSoftSkills = Array.from(new Set(softSkills)).slice(0, 15);
  const uniqueEducation = Array.from(new Set(education)).slice(0, 5);
  const uniqueExperience = Array.from(new Set(experience)).slice(0, 5);
  
  return {
    skills: uniqueSkills,
    technicalSkills: uniqueTechnicalSkills,
    softSkills: uniqueSoftSkills,
    education: uniqueEducation,
    experience: uniqueExperience
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting resume analysis...");

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
    
    // Extract key requirements from job description
    const jobRequirements = extractJobRequirements(jobDescription);
    console.log(`Extracted ${jobRequirements.skills.length} skills, ${jobRequirements.softSkills.length} soft skills, and ${jobRequirements.technicalSkills.length} technical skills from job description`);
    
    // Further reduce token usage - use smaller limits for faster processing
    truncatedResume = truncateText(cleanedResume, 4000); // Reduced from 8000
    truncatedJobDesc = truncateText(jobDescription, 1000); // Reduced from 2000
    
    console.log(`Original resume length: ${resumeText.length}, cleaned to: ${cleanedResume.length}, truncated to: ${truncatedResume.length}`);
    console.log(`Original job description length: ${jobDescription.length}, truncated to: ${truncatedJobDesc.length}`);
    
    // Use a more efficient model and set a short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000); // 25 sec max for API call
    
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Using smaller model for speed
          messages: [
            {
              role: 'system',
              content: `You are an expert ATS (Applicant Tracking System) analyzer specializing in resume optimization. Your task is to analyze a resume against a job description and provide actionable feedback, focusing especially on STAKEHOLDER MANAGEMENT skills when they appear relevant to the role.

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
}

IMPORTANT: If the job involves management, leadership, or client relationships, ALWAYS analyze stakeholder management capabilities, even if not explicitly mentioned in the job description.

FOCUS ON THESE KEY REQUIREMENTS:
Technical Skills: ${jobRequirements.technicalSkills.join(', ')}
Soft Skills: ${jobRequirements.softSkills.join(', ')}
Education: ${jobRequirements.education.join('; ')}
Experience: ${jobRequirements.experience.join('; ')}`
            },
            {
              role: 'user',
              content: `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}\n\nAnalyze how well this resume matches the job description.`
            }
          ],
          temperature: 0.2,
          max_tokens: 1000, // Reduced from 2000
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
        console.log('Raw OpenAI response received');
        
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
        
        // Ensure stakeholder management is addressed in the results if relevant
        if (jobRequirements.softSkills.includes('stakeholder management') || 
            jobDescription.toLowerCase().includes('stakeholder') || 
            jobDescription.toLowerCase().includes('leadership') ||
            jobDescription.toLowerCase().includes('management') ||
            jobDescription.toLowerCase().includes('client')) {
            
          // If stakeholder management isn't mentioned in strengths/weaknesses, add a relevant note
          let hasStakeholderFeedback = false;
          
          if (analysisResult.strengths) {
            hasStakeholderFeedback = analysisResult.strengths.some(s => 
              s.toLowerCase().includes('stakeholder')
            );
          }
          
          if (analysisResult.weaknesses) {
            hasStakeholderFeedback = hasStakeholderFeedback || analysisResult.weaknesses.some(w => 
              w.toLowerCase().includes('stakeholder')
            );
          }
          
          if (!hasStakeholderFeedback) {
            // Add stakeholder management feedback based on if it's mentioned in the resume
            const hasStakeholderInResume = truncatedResume.toLowerCase().includes('stakeholder');
            
            if (hasStakeholderInResume) {
              if (analysisResult.strengths && analysisResult.strengths.length < 5) {
                analysisResult.strengths.push("Demonstrates experience with stakeholder management which is crucial for this role");
              }
            } else {
              if (analysisResult.weaknesses && analysisResult.weaknesses.length < 5) {
                analysisResult.weaknesses.push("Resume lacks explicit mention of stakeholder management skills which appear relevant to this role");
              }
              
              if (analysisResult.recommendations && analysisResult.recommendations.length < 5) {
                analysisResult.recommendations.push("Highlight any experience with stakeholder management or client relationships, as these skills appear valuable for this position");
              }
            }
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
