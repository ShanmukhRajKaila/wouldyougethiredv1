
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const googleSearchApiKey = Deno.env.get('GOOGLE_SEARCH_API_KEY');
const googleSearchCx = Deno.env.get('GOOGLE_SEARCH_CX');

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

// Enhanced function to fetch company insights using Google Search API
async function fetchCompanyInsights(companyName: string): Promise<string[]> {
  if (!googleSearchApiKey || !googleSearchCx) {
    console.log("Google Search API keys not configured, skipping external company research");
    return [];
  }
  
  try {
    console.log(`Fetching comprehensive company insights for ${companyName}...`);
    
    // Expanded search queries for deeper company understanding
    const queries = [
      `${companyName} company culture values mission`,
      `${companyName} corporate social responsibility recent initiatives`,
      `${companyName} leadership team strategic vision`,
      `${companyName} recent achievements industry impact`,
      `${companyName} employee experiences work environment`
    ];
    
    let allInsights: string[] = [];
    
    // Process search queries to gather insights
    for (const query of queries) {
      const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleSearchApiKey}&cx=${googleSearchCx}&q=${encodeURIComponent(query)}`;
      
      const response = await fetch(searchUrl);
      
      if (!response.ok) {
        console.error(`Google Search API error: ${response.status}`);
        continue;
      }
      
      const data = await response.json();
      
      // Extract meaningful snippets from search results
      if (data.items && data.items.length > 0) {
        const insights = data.items.slice(0, 3).map((item: any) => {
          // Prioritize meaningful context about company culture, mission, and values
          return item.snippet || item.title || "";
        }).filter((text: string) => text.length > 50);
        
        allInsights = [...allInsights, ...insights];
      }
    }
    
    // Deduplicate and limit insights
    const uniqueInsights = [...new Set(allInsights)].slice(0, 8);
    console.log(`Retrieved ${uniqueInsights.length} comprehensive company insights`);
    
    return uniqueInsights;
  } catch (error) {
    console.error("Error fetching company insights:", error);
    return [];
  }
}

// Function to extract key requirements from job description
function extractKeyRequirements(jobDescription: string): string[] {
  // Simple regex-based extraction of potential requirements
  const reqSections = jobDescription.match(/requirements|qualifications|skills|what you['']ll need|what we['']re looking for/gi);
  
  if (!reqSections) {
    // Split by bullet points or numbered lists if no section titles found
    const bulletPoints = jobDescription.match(/[•\-\*]\s*(.*?)(?=\n|$)/g) || [];
    const numberedPoints = jobDescription.match(/\d+\.\s*(.*?)(?=\n|$)/g) || [];
    
    const combined = [...bulletPoints, ...numberedPoints]
      .map(point => point.replace(/^[•\-\*\d+\.\s]+/, '').trim())
      .filter(point => point.length > 10 && point.length < 100);
      
    return combined.slice(0, 8);
  }
  
  // TODO: More sophisticated extraction based on sections
  // For now, return empty array if better extraction isn't possible
  return [];
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

    // Fetch company insights if company name is provided
    let companyInsights: string[] = [];
    if (companyName) {
      companyInsights = await fetchCompanyInsights(companyName);
      console.log(`Retrieved ${companyInsights.length} company insights for ${companyName}`);
    }
    
    // Extract key requirements from job description
    const extractedRequirements = extractKeyRequirements(fullJobDesc);
    
    // Set a reasonable timeout (90 seconds)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000);
    
    // Prepare the analysis prompt with enhanced instructions for ATS optimization
    const systemPrompt = `You are an expert ATS (Applicant Tracking System) analyst and career coach specializing in optimizing resumes and cover letters for both automated screening systems and human reviewers.

Analyze the resume against the job description in detailed depth, focusing on:

1. Match percentage between resume and job requirements (ATS perspective)
2. Key strengths (min 3, max 5) found in the resume relative to the position 
3. Areas for improvement (min 3, max 5) in the resume
4. Specific recommendations (min 3, max 5) for improving the resume
5. STAR analysis of 3 bullet points from the resume, with improved versions

CRITICAL ATS OPTIMIZATION RULES:
- ALL bullet point improvements MUST start with a STRONG ACTION VERB (e.g., Led, Implemented, Developed, Achieved)
- Apply the STAR Method (Situation/Task, Action, Result) for each improved bullet point
- Include quantifiable achievements with specific metrics (%, $, time periods) wherever possible
- Ensure each improved bullet point clearly shows the impact and business value

${companyName ? `The candidate is applying to ${companyName}. Consider company culture, values and expectations in your analysis.` : ''}

${coverLetterContent ? `
For the cover letter analysis:
1. Evaluate tone, relevance, and alignment with the job requirements and company culture
2. Analyze how effectively the cover letter complements the resume
3. Identify 5+ specific company insights that should be addressed (using provided company insights where available)
4. Identify 5+ key requirements from the job description that should be emphasized
5. Suggest 5+ specific phrases that would improve alignment with the job and company
6. ALL suggested phrases MUST start with strong ACTION VERBS
7. Optimize the overall structure for ATS scanning
` : ''}

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
      "improved": "improved version with action verb start and STAR method",
      "feedback": "explanation of improvements"
    },
    ... (exactly 3 items)
  ]${coverLetterContent ? `,
  "coverLetterAnalysis": {
    "tone": string describing the overall tone (e.g., "professional", "enthusiastic"),
    "relevance": number from 1-100,
    "strengths": [array of strings],
    "weaknesses": [array of strings],
    "recommendations": [array of strings],
    "companyInsights": [array of 5+ strings with insights about the company that should be included],
    "keyRequirements": [array of 5+ strings identifying key job requirements to address],
    "suggestedPhrases": [array of 5+ strings with ATS-optimized phrases ALL starting with action verbs]
  }` : ''}
}

You MUST provide complete analysis with all required fields, and ALL improved bullet points and suggested phrases MUST start with a strong action verb. This is critical for the application to function properly.`;

    try {
      console.log("Sending full content request to OpenAI GPT-4o...");
      
      // Prepare messages including company insights when available
      const messages = [
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
      ];
      
      // Add company insights if available
      if (companyInsights.length > 0) {
        messages.push({
          role: 'user', 
          content: `Additional company research insights for ${companyName}:\n${companyInsights.join('\n\n')}`
        });
      }
      
      // Add extracted requirements if available
      if (extractedRequirements.length > 0) {
        messages.push({
          role: 'user',
          content: `Extracted key requirements from job description:\n${extractedRequirements.join('\n')}`
        });
      }
      
      // Add specific examples of strong ATS-optimized bullet points
      messages.push({
        role: 'user',
        content: `IMPORTANT: Ensure all improved bullet points follow these examples for ATS optimization:
1. Original: "Managed a team of developers for the website redesign project"
   Improved: "Led a cross-functional team of 8 developers to deliver a complete website redesign, resulting in 35% improved user engagement and 22% higher conversion rates"

2. Original: "Responsible for budget planning and cost reduction"
   Improved: "Developed comprehensive budget strategies that reduced operational costs by $250K annually while maintaining service quality through strategic vendor negotiations"

3. Original: "Helped with marketing campaigns for new products"
   Improved: "Spearheaded 5 targeted marketing campaigns for product launches that generated $1.2M in revenue by analyzing customer data to identify key demographic segments"

ALL optimized bullet points MUST start with a strong action verb and include quantifiable results.`
      });
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
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
        
        // Enforce action verbs at the start of all STAR analysis bullet points
        if (analysisResult.starAnalysis) {
          const actionVerbs = ["Achieved", "Accelerated", "Accomplished", "Administered", "Advanced", "Advised", "Analyzed", 
                               "Built", "Championed", "Clarified", "Coached", "Collaborated", "Communicated", "Conceptualized", 
                               "Conducted", "Consolidated", "Controlled", "Coordinated", "Created", "Cultivated", 
                               "Delivered", "Demonstrated", "Designed", "Developed", "Directed", "Drove", 
                               "Earned", "Enacted", "Established", "Evaluated", "Exceeded", "Excelled", "Executed", "Expanded", 
                               "Facilitated", "Forecasted", "Formulated", "Generated", "Guided", "Headed", 
                               "Identified", "Implemented", "Improved", "Increased", "Influenced", "Initiated", "Innovated", 
                               "Led", "Leveraged", "Maintained", "Managed", "Maximized", "Mentored", "Modernized", 
                               "Navigated", "Negotiated", "Operated", "Orchestrated", "Organized", "Outperformed", "Overhauled", 
                               "Pioneered", "Planned", "Prepared", "Prioritized", "Processed", "Produced", 
                               "Reduced", "Refined", "Reengineered", "Reorganized", "Revamped", "Revitalized", 
                               "Secured", "Simplified", "Solved", "Spearheaded", "Standardized", "Steered", "Streamlined", 
                               "Supervised", "Sustained", "Synchronized", "Targeted", "Trained", "Transformed", 
                               "Upgraded", "Utilized", "Won"];
                               
          analysisResult.starAnalysis = analysisResult.starAnalysis.map((item: any) => {
            // Check if the improved bullet already starts with an action verb
            const firstWord = item.improved.split(' ')[0].replace(/[^\w]/g, '');
            
            if (!actionVerbs.includes(firstWord)) {
              // Select a contextually appropriate action verb
              let verb = "Led";
              const lowerImproved = item.improved.toLowerCase();
              
              if (lowerImproved.includes("develop") || lowerImproved.includes("creat") || lowerImproved.includes("build")) {
                verb = "Developed";
              } else if (lowerImproved.includes("improv") || lowerImproved.includes("enhanc") || lowerImproved.includes("increas")) {
                verb = "Improved";
              } else if (lowerImproved.includes("reduc") || lowerImproved.includes("decreas") || lowerImproved.includes("cut")) {
                verb = "Reduced";
              } else if (lowerImproved.includes("manag") || lowerImproved.includes("lead") || lowerImproved.includes("direct")) {
                verb = "Led";
              } else if (lowerImproved.includes("implement") || lowerImproved.includes("deploy") || lowerImproved.includes("roll")) {
                verb = "Implemented";
              } else if (lowerImproved.includes("analyz") || lowerImproved.includes("research") || lowerImproved.includes("stud")) {
                verb = "Analyzed";
              }
              
              // Format the phrase to start with the action verb
              const cleanedPhrase = item.improved.replace(/^(I |We |They |The team |The company )/i, '');
              item.improved = `${verb} ${cleanedPhrase.charAt(0).toLowerCase()}${cleanedPhrase.slice(1)}`;
              
              // Update the feedback to mention the action verb improvement
              if (!item.feedback.includes("action verb")) {
                item.feedback += " Starting with a strong action verb makes this bullet point more impactful and ATS-friendly.";
              }
            }
            
            // Ensure the bullet contains quantifiable results if possible
            if (!item.improved.match(/\d+%|\$\d+|\d+ percent|\d+ times/i)) {
              if (!item.feedback.includes("quantifiable")) {
                item.feedback += " Consider adding specific metrics (%, $, timeframes) to further strengthen this bullet point.";
              }
            }
            
            return item;
          });
        }
        
        // Enhance cover letter analysis with our extracted insights if needed
        if (coverLetterContent && analysisResult.coverLetterAnalysis) {
          // Ensure we have enough company insights
          if (companyInsights.length > 0 && 
              (!analysisResult.coverLetterAnalysis.companyInsights || 
               analysisResult.coverLetterAnalysis.companyInsights.length < 5)) {
            
            console.log("Enhancing company insights with Google Search results");
            analysisResult.coverLetterAnalysis.companyInsights = 
              [...(analysisResult.coverLetterAnalysis.companyInsights || []), ...companyInsights]
                .filter((v, i, a) => a.indexOf(v) === i) // Deduplicate
                .slice(0, 8); // Limit to 8 insights
          }
          
          // Ensure all suggested phrases start with action verbs
          if (analysisResult.coverLetterAnalysis.suggestedPhrases) {
            const actionVerbs = ["Achieved", "Adapted", "Addressed", "Advanced", "Advised", "Advocated", 
                               "Analyzed", "Applied", "Appointed", "Approved", "Arbitrated", "Arranged", 
                               "Assembled", "Assessed", "Assigned", "Assisted", "Attained", "Audited", 
                               "Authored", "Balanced", "Budgeted", "Built", "Cataloged", "Chaired", 
                               "Championed", "Changed", "Clarified", "Coached", "Collaborated", "Communicated", 
                               "Compiled", "Completed", "Computed", "Conceptualized", "Conducted", "Consolidated", 
                               "Constructed", "Consulted", "Contracted", "Contributed", "Controlled", "Converted", 
                               "Coordinated", "Created", "Cultivated", "Customized", "Decreased", "Delegated", 
                               "Delivered", "Demonstrated", "Designed", "Determined", "Developed", "Devised", 
                               "Diagnosed", "Directed", "Discovered", "Displayed", "Documented", "Drafted", 
                               "Earned", "Edited", "Educated", "Eliminated", "Encouraged", "Engineered", 
                               "Enhanced", "Established", "Evaluated", "Examined", "Executed", "Expanded", 
                               "Expedited", "Explained", "Facilitated", "Finalized", "Formulated", "Founded", 
                               "Generated", "Guided", "Hired", "Identified", "Implemented", "Improved", 
                               "Increased", "Influenced", "Informed", "Initiated", "Innovated", "Installed", 
                               "Instituted", "Instructed", "Integrated", "Interpreted", "Interviewed", "Introduced", 
                               "Launched", "Led", "Leveraged", "Maintained", "Managed", "Marketed", "Mediated", 
                               "Mentored", "Modeled", "Modified", "Monitored", "Motivated", "Navigated", 
                               "Negotiated", "Obtained", "Officiated", "Operated", "Orchestrated", "Organized", 
                               "Outpaced", "Oversaw", "Partnered", "Performed", "Persuaded", "Pioneered", 
                               "Planned", "Prepared", "Presented", "Prioritized", "Processed", "Produced", 
                               "Programmed", "Projected", "Promoted", "Proposed", "Provided", "Published", 
                               "Purchased", "Recommended", "Reconciled", "Recorded", "Redesigned", "Reduced", 
                               "Refined", "Regulated", "Rehabilitated", "Remodeled", "Reorganized", "Reported", 
                               "Researched", "Resolved", "Restructured", "Revamped", "Reviewed", "Revised", 
                               "Scheduled", "Secured", "Selected", "Served", "Shaped", "Shared", "Simplified", 
                               "Simulated", "Solved", "Spearheaded", "Specialized", "Standardized", "Steered", 
                               "Streamlined", "Strengthened", "Structured", "Studied", "Supervised", "Supported", 
                               "Surpassed", "Synthesized", "Targeted", "Taught", "Tested", "Trained", 
                               "Transformed", "Translated", "Troubleshot", "Unified", "Updated", "Upgraded", 
                               "Utilized", "Validated", "Verified", "Visualized", "Won", "Wrote"];
            
            // Check if each phrase starts with an action verb, fix if not
            analysisResult.coverLetterAnalysis.suggestedPhrases = 
              analysisResult.coverLetterAnalysis.suggestedPhrases.map((phrase: string) => {
                const firstWord = phrase.split(' ')[0].replace(/[^\w]/g, '');
                if (!actionVerbs.includes(firstWord)) {
                  // Pick a contextually appropriate action verb
                  const lowerPhrase = phrase.toLowerCase();
                  let verb = "Implemented"; // Default verb
                  
                  if (lowerPhrase.includes("develop") || lowerPhrase.includes("creat") || lowerPhrase.includes("build")) {
                    verb = "Developed";
                  } else if (lowerPhrase.includes("improv") || lowerPhrase.includes("enhanc") || lowerPhrase.includes("increas")) {
                    verb = "Improved";
                  } else if (lowerPhrase.includes("reduc") || lowerPhrase.includes("decreas") || lowerPhrase.includes("lower")) {
                    verb = "Reduced";
                  } else if (lowerPhrase.includes("manag") || lowerPhrase.includes("lead") || lowerPhrase.includes("direct")) {
                    verb = "Led";
                  } else if (lowerPhrase.includes("research") || lowerPhrase.includes("analyz") || lowerPhrase.includes("stud")) {
                    verb = "Analyzed";
                  } else if (lowerPhrase.includes("collaborat") || lowerPhrase.includes("partner") || lowerPhrase.includes("work with")) {
                    verb = "Collaborated";
                  } else {
                    // Select a random verb if no context is found
                    verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
                  }
                  
                  // Remove any starting phrases like "I have", "I am", etc.
                  const cleanedPhrase = phrase.replace(/^(I have |I am |I |We have |We |They |The team |The company )/i, '');
                  return `${verb} ${cleanedPhrase.charAt(0).toLowerCase()}${cleanedPhrase.slice(1)}`;
                }
                return phrase;
              });
          }
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
