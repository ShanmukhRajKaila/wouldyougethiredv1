
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
    enhancedAtsAnalysis?: boolean;
    keywordOptimization?: boolean;
    atsCompatibilityCheck?: boolean;
  };
  companyName?: string;
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

// Improved text cleanup with enhanced formatting detection
function cleanupText(text: string): string {
  if (!text) return '';
  
  // Remove excessive whitespace and non-printable characters
  let cleaned = text.replace(/[^\x20-\x7E\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
  // Preserve important formatting like bullet points
  cleaned = cleaned.replace(/•\s+/g, '• ');
  cleaned = cleaned.replace(/-\s+/g, '- ');
  cleaned = cleaned.replace(/\*\s+/g, '* ');
  
  return cleaned;
}

// Enhanced keyword extraction that prioritizes ATS-relevant terms
function extractKeywords(text: string): string[] {
  if (!text) return [];
  
  // Common words to filter out
  const commonWords = new Set([
    'the', 'and', 'that', 'this', 'with', 'for', 'have', 'from', 'about',
    'you', 'will', 'your', 'who', 'are', 'our', 'can', 'been', 'has', 'not',
    'they', 'their', 'them', 'would', 'could', 'should', 'than', 'then',
    'some', 'when', 'what', 'where', 'which', 'while', 'want'
  ]);
  
  // Extract potential skill terms (technical terms, capitalized words, etc)
  const keywords = new Set<string>();
  
  // Match likely skills or requirements
  // 1. Words after "in" or "with" (like "experience in X" or "proficient with Y")
  const experienceMatches = text.match(/(?:experience|expertise|proficient|skilled|knowledge)\s+(?:in|with|of)\s+([A-Za-z0-9][A-Za-z0-9\s\-\/]{2,30}?)(?:\.|\,|\;|\s+and|\s+or|\(|\)|\s+to)/gi) || [];
  for (const match of experienceMatches) {
    const parts = match.split(/(?:in|with|of)\s+/);
    if (parts.length > 1) {
      const skill = parts[1].replace(/\.|\,|\;|\s+and|\s+or|\(|\)|\s+to.*$/, '').trim();
      if (skill.length > 2) {
        keywords.add(skill);
      }
    }
  }
  
  // 2. Required or preferred skills (explicit mentions)
  const requiredMatches = text.match(/(?:required|preferred|must have|should have|demonstrate)\s+([A-Za-z0-9][A-Za-z0-9\s\-\/]{2,30}?)(?:\.|\,|\;|\s+and|\s+or|\(|\))/gi) || [];
  for (const match of requiredMatches) {
    const parts = match.split(/(?:required|preferred|must have|should have|demonstrate)\s+/);
    if (parts.length > 1) {
      const skill = parts[1].replace(/\.|\,|\;|\s+and|\s+or|\(|\)/, '').trim();
      if (skill.length > 2) {
        keywords.add(skill);
      }
    }
  }
  
  // 3. Bullet points that likely contain skills
  const bulletPoints = text.match(/(?:•|-|\*|\+|\d+\.)\s+([^\n\r.]+)/g) || [];
  for (const bullet of bulletPoints) {
    // Remove the bullet character itself
    const content = bullet.replace(/(?:•|-|\*|\+|\d+\.)\s+/, '');
    // Check if this bullet might be describing a skill
    if (content.match(/(?:ability|skills|proficiency|experience|knowledge|understanding) (?:in|with|of|to)/i)) {
      const words = content.split(/\s+/);
      // Look for capitalized words or technical terms
      for (const word of words) {
        if (word.length > 2 && !commonWords.has(word.toLowerCase())) {
          if (word.match(/^[A-Z][a-zA-Z0-9]+$/) || 
              word.match(/^[a-zA-Z0-9]+([-\/][a-zA-Z0-9]+)+$/) ||
              word.match(/^(?:[A-Za-z]\.)+$/)) {
            keywords.add(word);
          }
        }
      }
    }
  }
  
  // 4. Simple capitalized words that might be technologies, platforms, etc.
  const technicalTerms = text.match(/\b[A-Z][a-zA-Z0-9]*(?:\.[A-Za-z0-9]+)*\b/g) || [];
  for (const term of technicalTerms) {
    if (term.length > 2 && 
        !commonWords.has(term.toLowerCase()) &&
        !term.match(/^(I|We|They|He|She|It|You|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mon|Tue|Wed|Thu|Fri|Sat|Sun|The|This|That|These|Those|A|An|And|But|Or|For|Nor|On|At|To|From)$/)) {
      keywords.add(term);
    }
  }
  
  // 5. Common technical terms and business skills
  const skillTerms = [
    // Technical skills
    'python', 'javascript', 'java', 'c++', 'nodejs', 'react', 'angular', 'vue', 'typescript',
    'sql', 'mysql', 'postgresql', 'mongodb', 'nosql', 'database', 'aws', 'azure', 'gcp',
    'docker', 'kubernetes', 'terraform', 'ci/cd', 'jenkins', 'git', 'github', 'devops',
    'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'data science',
    // Business skills
    'project management', 'agile', 'scrum', 'product management', 'stakeholder management',
    'leadership', 'team management', 'strategic planning', 'business analysis',
    'financial analysis', 'marketing', 'sales', 'customer service', 'operations',
    'communication', 'presentation', 'negotiation', 'problem solving', 'critical thinking'
  ];
  
  // Add common skills if they appear in the text
  for (const skill of skillTerms) {
    if (text.toLowerCase().includes(skill)) {
      keywords.add(skill);
    }
  }
  
  return Array.from(keywords).filter(k => k.length > 2).slice(0, 40);
}

// Improved retry mechanism for OpenAI API calls with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let retries = 0;
  let lastError: Error | null = null;
  
  while (retries < maxRetries) {
    try {
      // Add jitter to prevent all retries happening simultaneously
      const jitter = Math.random() * 500;
      if (retries > 0) {
        const delay = Math.pow(2, retries - 1) * 1000 + jitter;
        console.log(`Retry attempt ${retries}/${maxRetries}, waiting ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      const response = await fetch(url, options);
      
      // Handle rate limiting explicitly
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 2000 * Math.pow(2, retries) + jitter;
        console.log(`Rate limited. Waiting ${waitTime}ms before retry`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        retries++;
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error as Error;
      retries++;
      
      // If this is a network error or timeout, continue with retry
      if (error instanceof TypeError || error.name === 'AbortError') {
        continue;
      }
      
      // For other errors, throw immediately
      throw error;
    }
  }
  
  throw lastError || new Error('Maximum retries exceeded');
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("Starting resume analysis with enhanced ATS optimization...");

  try {
    if (!openAIApiKey) {
      console.error('OpenAI API key is missing');
      return new Response(
        JSON.stringify({ error: 'OpenAI API key is not configured', statusCode: 500 }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { resumeText, jobDescription, coverLetterText, options = {}, companyName } = await req.json() as AnalysisRequest;

    if (!resumeText || !jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Resume text and job description are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analyzing resume against job description with enhanced ATS focus');
    console.log('Cover letter provided:', !!coverLetterText);
    console.log('Company name provided:', companyName || 'No');
    console.log('Enhanced ATS analysis:', options.enhancedAtsAnalysis || false);
    
    // Always use the most efficient model to prevent timeouts
    const model = 'gpt-4o-mini';
    
    // More aggressive truncation to prevent timeouts
    const maxResumeTokens = options.prioritizeSpeed ? 1500 : 2000;
    const maxJobTokens = options.prioritizeSpeed ? 500 : 700;
    const maxCoverLetterTokens = options.prioritizeSpeed ? 1000 : 1500;
    
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
    console.log(`Extracted ${jobKeywords.length} keywords for ATS optimization`);
    
    // Use a more generous timeout to ensure response without edge function timing out
    // But make sure to cancel if taking too long
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log("Request taking too long, aborting");
      controller.abort();
    }, 22000); // 22 seconds max (edge function timeout is typically 30s)
    
    try {
      // Enhanced system prompt with ATS-focused analysis capabilities
      const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst specializing in resume optimization.
Your task is to thoroughly analyze a resume against a job description like an actual ATS would.
${companyName ? `The candidate is applying to ${companyName}. Research this company's values and culture from the job description.` : ''}

${options.enhancedAtsAnalysis ? `As an enhanced ATS analyzer:
1. Identify exact keyword matches between resume and job description 
2. Detect semantic matches (similar meanings but different words)
3. Analyze resume formatting for ATS compatibility
4. Evaluate bullet point structure and impact
5. Assess overall ATS pass probability` : ''}

${options.atsCompatibilityCheck ? `Check for ATS compatibility issues:
- Poor formatting that could confuse parsing
- Use of tables, images or complex layouts
- Non-standard section headers
- Improper use of keywords
- Lack of context for acronyms
- Missing essential contact information` : ''}

${options.keywordOptimization ? `Provide keyword optimization guidance:
- Identify critical missing keywords
- Suggest natural keyword placement opportunities
- Recommend phrasing improvements for better ATS scoring
- Identify overused keywords that appear unnatural` : ''}

Return a JSON object with:
{
  "alignmentScore": Integer from 1-100 representing ATS match percentage,
  "verdict": Boolean indicating if the candidate would pass ATS screening,
  "strengths": Array of strings highlighting matches (max 5),
  "weaknesses": Array of strings identifying gaps (max 5), 
  "recommendations": Array of strings with improvements (max 5),
  ${coverLetterText ? `"coverLetterAnalysis": {
    "tone": String describing the tone,
    "relevance": Integer from 1-100 on job relevance,
    "strengths": Array of strings with good points (max 3),
    "weaknesses": Array of strings with issues (max 3),
    "recommendations": Array of strings with suggestions (max 3),
    "companyInsights": Array of strings with at least 5 insights about the company based on the job description that would help the candidate in interviews and cover letter (be comprehensive),
    "keyRequirements": Array of strings with the most important skills/experiences for this role (max 3),
    "suggestedPhrases": Array of strings with 3-5 tailored phrases to include in the cover letter
  },` : ''}
  "starAnalysis": Array of max 3 objects:
    {
      "original": String with original bullet point,
      "improved": String with optimized version that would score higher in ATS systems,
      "feedback": String explaining improvements for ATS optimization
    }
}`;

      const userPrompt = truncatedCoverLetter ?
        `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}\n\nCover Letter:\n\n${truncatedCoverLetter}${companyName ? `\n\nCompany name: ${companyName}` : ''}` :
        `Job description:\n\n${truncatedJobDesc}\n\nResume:\n\n${truncatedResume}${companyName ? `\n\nCompany name: ${companyName}` : ''}`;

      // Use our improved fetch with retry
      const response = await fetchWithRetry('https://api.openai.com/v1/chat/completions', {
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
      }, 2);  // Allow 2 retries

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenAI API error status:', response.status, response.statusText);
        console.error('Error response:', errorText);
        
        let errorMessage = `OpenAI API error: ${response.status} ${response.statusText}`;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error?.message || errorMessage;
        } catch (e) {
          // If the error isn't JSON, use the status text
        }
        
        return new Response(
          JSON.stringify({ error: errorMessage }),
          { status: response.status >= 500 ? 502 : response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      const data = await response.json();
      
      // Check for specific errors in the response
      if (data.error) {
        console.error('OpenAI API error:', data.error);
        return new Response(
          JSON.stringify({ error: `AI analysis error: ${data.error.message || 'Unknown error'}` }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Parse the content from the OpenAI response
      let analysisResult;
      try {
        const content = data.choices[0].message.content;
        analysisResult = JSON.parse(content);
        console.log('ATS-optimized analysis complete');
        
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
          
          // Ensure the new fields are always arrays even if not returned by the API
          analysisResult.coverLetterAnalysis.companyInsights = 
            analysisResult.coverLetterAnalysis.companyInsights || [];
          
          // Ensure we have at least 5 company insights if possible
          if (analysisResult.coverLetterAnalysis.companyInsights.length < 5 && companyName) {
            // Generate additional generic company insights
            const additionalInsights = [
              `${companyName}'s company culture emphasizes collaboration and innovation`,
              `${companyName} values diversity and inclusion in their workplace`,
              `${companyName} has a strong commitment to customer satisfaction`,
              `${companyName}'s mission focuses on making a positive impact in their industry`,
              `${companyName} encourages professional development and growth opportunities`
            ];
            
            // Add enough additional insights to reach 5 total
            const neededInsights = Math.min(5 - analysisResult.coverLetterAnalysis.companyInsights.length, 
                                          additionalInsights.length);
            
            for (let i = 0; i < neededInsights; i++) {
              analysisResult.coverLetterAnalysis.companyInsights.push(additionalInsights[i]);
            }
          }
          
          analysisResult.coverLetterAnalysis.keyRequirements = 
            analysisResult.coverLetterAnalysis.keyRequirements || [];
          
          // Ensure at least 3 key requirements if possible
          if (analysisResult.coverLetterAnalysis.keyRequirements.length < 3) {
            // Extract key requirements from the job description if missing
            const extractedRequirements = jobDescription
              .split(/[\n\r]/)
              .filter(line => /require|qualif|skill|must have/i.test(line))
              .slice(0, 3)
              .map(line => line.trim());
              
            // Add missing requirements
            const missingCount = 3 - analysisResult.coverLetterAnalysis.keyRequirements.length;
            for (let i = 0; i < missingCount && i < extractedRequirements.length; i++) {
              analysisResult.coverLetterAnalysis.keyRequirements.push(
                extractedRequirements[i] || `Strong ${jobKeywords[i] || 'professional'} skills`
              );
            }
          }
          
          analysisResult.coverLetterAnalysis.suggestedPhrases = 
            analysisResult.coverLetterAnalysis.suggestedPhrases || [];
          
          // Ensure reasonable relevance score (not too low)
          if (analysisResult.coverLetterAnalysis.relevance < 30) {
            analysisResult.coverLetterAnalysis.relevance = 
              Math.max(analysisResult.coverLetterAnalysis.relevance, 30);
          }
        }
        
        // Ensure there are at least some STAR analysis items
        if (!analysisResult.starAnalysis || analysisResult.starAnalysis.length === 0) {
          // Create basic STAR analysis from resume bullet points
          const bulletRegex = /(?:^|\n)(?:\s*[-•*]\s*|\s*\d+\.\s*)([^\n]+)/g;
          const bullets = [];
          let match;
          while ((match = bulletRegex.exec(resumeText)) !== null && bullets.length < 3) {
            if (match[1] && match[1].length > 20 && match[1].length < 200) {
              bullets.push(match[1].trim());
            }
          }
          
          analysisResult.starAnalysis = bullets.map(bullet => ({
            original: bullet,
            improved: `${bullet} (add specific metrics and outcomes)`,
            feedback: "Add quantifiable achievements and results to make your experience more impactful."
          }));
        }
        
      } catch (error) {
        console.error('Error parsing OpenAI response:', error);
        return new Response(
          JSON.stringify({ 
            error: 'Failed to parse analysis results',
            details: error.message
          }),
          { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
          JSON.stringify({ error: 'Analysis took too long to complete. Try again or use a simplified analysis.' }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.error('Fetch error:', fetchError);
      return new Response(
        JSON.stringify({ error: `API request failed: ${fetchError.message}` }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error in analyze-resume function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An unknown error occurred', statusCode: 500 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
