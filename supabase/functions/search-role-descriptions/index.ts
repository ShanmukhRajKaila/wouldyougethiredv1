import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { extractJobDescriptionContent } from "./job-extractor.ts";
import { convertHtmlToText } from "./html-utils.ts";
import { initializePuppeteerBrowser } from "./puppeteer-utils.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum number of job descriptions to fetch per role
const MAX_JOBS_PER_ROLE = 8;

// Define comprehensive search queries for specific roles rather than categories
const ROLE_SEARCH_QUERIES = {
  // Tech Management roles
  "product_manager": [
    "product manager job description tech",
    "product manager responsibilities tech company",
    "product manager qualifications skills"
  ],
  "technical_program_manager": [
    "technical program manager job description",
    "TPM job responsibilities tech company",
    "technical program manager qualifications"
  ],
  "engineering_manager": [
    "engineering manager job description tech",
    "engineering team lead responsibilities",
    "software engineering manager qualifications"
  ],
  "cto": [
    "chief technology officer job description",
    "CTO responsibilities startup",
    "CTO qualifications tech company"
  ],
  "director_of_engineering": [
    "director of engineering job description",
    "engineering director responsibilities tech",
    "director of engineering qualifications"
  ],
  
  // Finance roles
  "investment_banker": [
    "investment banker job description",
    "investment banking associate responsibilities",
    "investment banking qualifications post mba"
  ],
  "finance_manager": [
    "finance manager job description",
    "corporate finance manager responsibilities",
    "finance manager qualifications"
  ],
  "financial_analyst": [
    "financial analyst job description post mba",
    "senior financial analyst responsibilities",
    "financial analyst qualifications"
  ],
  "portfolio_manager": [
    "portfolio manager job description",
    "investment portfolio manager responsibilities",
    "asset portfolio manager qualifications"
  ],
  "private_equity_associate": [
    "private equity associate job description post mba",
    "private equity responsibilities",
    "private equity qualifications"
  ],
  
  // Consulting roles
  "management_consultant": [
    "management consultant job description post mba",
    "management consultant responsibilities mckinsey",
    "management consultant qualifications bcg bain"
  ],
  "strategy_consultant": [
    "strategy consultant job description",
    "strategic consultant responsibilities",
    "strategy consultant qualifications"
  ],
  "operations_consultant": [
    "operations consultant job description",
    "operations consulting responsibilities",
    "operations consultant qualifications"
  ],
  "technology_consultant": [
    "technology consultant job description",
    "tech consulting responsibilities",
    "technology consultant qualifications"
  ],
  "healthcare_consultant": [
    "healthcare consultant job description",
    "healthcare consulting responsibilities",
    "healthcare consultant qualifications"
  ],
  
  // Marketing roles
  "marketing_manager": [
    "marketing manager job description",
    "marketing manager responsibilities tech company",
    "marketing manager qualifications"
  ],
  "brand_manager": [
    "brand manager job description post mba",
    "brand management responsibilities",
    "brand manager qualifications"
  ],
  "digital_marketing_director": [
    "digital marketing director job description",
    "digital marketing director responsibilities",
    "digital marketing director qualifications"
  ],
  "growth_marketing_manager": [
    "growth marketing manager job description tech",
    "growth marketing responsibilities startup",
    "growth marketing qualifications"
  ],
  "seo_manager": [
    "seo manager job description",
    "seo manager responsibilities tech company",
    "seo manager qualifications"
  ],
  
  // Sustainability roles
  "sustainability_manager": [
    "sustainability manager job description",
    "corporate sustainability manager responsibilities",
    "sustainability manager qualifications"
  ],
  "esg_director": [
    "ESG director job description",
    "environmental social governance director responsibilities",
    "ESG director qualifications"
  ],
  "environmental_program_manager": [
    "environmental program manager job description",
    "environmental program manager responsibilities",
    "environmental program manager qualifications"
  ],
  "sustainable_business_consultant": [
    "sustainable business consultant job description",
    "sustainability consultant responsibilities",
    "sustainable business consultant qualifications"
  ],
  "corporate_responsibility_manager": [
    "corporate responsibility manager job description",
    "CSR manager responsibilities",
    "corporate responsibility manager qualifications"
  ],
  
  // Other common tech roles
  "software_engineer": [
    "software engineer job description",
    "software developer responsibilities tech company",
    "software engineer qualifications"
  ],
  "data_scientist": [
    "data scientist job description tech company",
    "data scientist responsibilities",
    "data scientist qualifications"
  ],
  "ux_designer": [
    "UX designer job description tech company",
    "user experience designer responsibilities",
    "UX designer qualifications"
  ],
  "product_designer": [
    "product designer job description tech",
    "product designer responsibilities tech company",
    "product designer qualifications"
  ],
  "devops_engineer": [
    "devops engineer job description",
    "devops responsibilities tech company",
    "devops engineer qualifications"
  ],
  "ai_engineer": [
    "AI engineer job description",
    "artificial intelligence engineer responsibilities",
    "AI engineer qualifications"
  ],
  
  // Default fallback
  "other": []  // Will be dynamically populated based on custom role
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { role, customRole } = await req.json() as { role: string, customRole?: string };
    
    if (!role) {
      return new Response(
        JSON.stringify({ error: 'Role parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Starting job search for role: ${role}, customRole: ${customRole || 'none'}`);
    
    // Get search queries for the specified role
    let searchQueries = ROLE_SEARCH_QUERIES[role];
    
    // If no predefined queries found or it's a custom role, generate queries
    if (!searchQueries || searchQueries.length === 0 || role === 'other') {
      const searchTerm = customRole || role;
      searchQueries = [
        `${searchTerm} job description`,
        `${searchTerm} responsibilities`,
        `${searchTerm} job requirements qualifications`,
        `senior ${searchTerm} job description`
      ];
    }

    // Get the API key and search engine ID from environment variables
    const googleApiKey = Deno.env.get("GOOGLE_SEARCH_API_KEY");
    const searchEngineId = Deno.env.get("GOOGLE_SEARCH_ENGINE_ID");

    if (!googleApiKey || !searchEngineId) {
      console.error("Missing Google Search API credentials");
      return new Response(
        JSON.stringify({ error: "Search service configuration is incomplete" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Search for job descriptions using Google Custom Search API
    const jobUrls = await searchForJobUrls(searchQueries, googleApiKey, searchEngineId);
    console.log(`Found ${jobUrls.length} job URLs from search`);
    
    // Extract job descriptions from the URLs using advanced methods
    const jobDescriptions = await extractJobDescriptions(jobUrls);
    
    // Consolidate the descriptions into a unified job description
    const consolidatedDescription = consolidateDescriptions(jobDescriptions, role, customRole);
    
    return new Response(
      JSON.stringify({ 
        role, 
        jobDescriptions: jobDescriptions,
        consolidatedDescription,
        jobUrlsSearched: jobUrls.length,
        successfulExtractions: jobDescriptions.length
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in search-role-descriptions function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

/**
 * Search for job description URLs using Google Custom Search API
 */
async function searchForJobUrls(queries: string[], apiKey: string, searchEngineId: string): Promise<string[]> {
  const allJobUrls: string[] = [];
  const urlSet = new Set<string>(); // To avoid duplicate URLs
  
  // Process each query to find job postings
  for (const query of queries) {
    if (allJobUrls.length >= MAX_JOBS_PER_ROLE) break; // Stop if we have enough URLs
    
    try {
      console.log(`Searching for: ${query}`);
      
      // Build Google Custom Search API URL
      const searchUrl = new URL('https://www.googleapis.com/customsearch/v1');
      searchUrl.searchParams.append('key', apiKey);
      searchUrl.searchParams.append('cx', searchEngineId);
      searchUrl.searchParams.append('q', query);
      searchUrl.searchParams.append('safe', 'active'); // Enable SafeSearch
      searchUrl.searchParams.append('num', '10'); // Get 10 results per query
      
      // Execute the search
      const response = await fetch(searchUrl.toString());
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Google Search API error (${response.status}):`, errorText);
        continue;
      }
      
      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        console.log(`No search results for query: ${query}`);
        continue;
      }
      
      // Extract URLs from search results
      for (const item of data.items) {
        if (allJobUrls.length >= MAX_JOBS_PER_ROLE) break;
        
        // Skip if we've already added this URL
        if (urlSet.has(item.link)) continue;
        
        // Check if URL is likely a job posting (heuristic)
        if (isLikelyJobPostingUrl(item.link)) {
          urlSet.add(item.link);
          allJobUrls.push(item.link);
          console.log(`Found job URL: ${item.link}`);
        }
      }
    } catch (error) {
      console.error(`Error searching for "${query}":`, error);
    }
  }
  
  return allJobUrls;
}

/**
 * Check if a URL is likely to be a job posting
 */
function isLikelyJobPostingUrl(url: string): boolean {
  // Check for common job posting URL patterns
  const jobSitePatterns = [
    /linkedin\.com\/jobs/i,
    /indeed\.com\/job/i,
    /glassdoor\.com\/job/i,
    /monster\.com\/jobs/i,
    /careers?\.google\.com/i,
    /jobs?\.microsoft\.com/i,
    /jobs?\.apple\.com/i,
    /amazon\.jobs/i,
    /careers?\.facebook\.com/i,
    /careers?\.netflix\.com/i,
    /\/jobs?\//i,
    /\/career/i,
    /\/position/i,
    /\/vacancy/i,
    /\/opening/i,
  ];
  
  return jobSitePatterns.some(pattern => pattern.test(url));
}

/**
 * Enhanced function to extract job descriptions using multiple methods
 */
async function extractJobDescriptions(urls: string[]): Promise<string[]> {
  const descriptions: string[] = [];
  
  for (const url of urls.slice(0, MAX_JOBS_PER_ROLE)) {
    try {
      console.log(`Extracting job description from: ${url}`);
      
      // Enhanced user agent and other headers to better mimic a browser
      const fetchHeaders = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'sec-ch-ua': '"Google Chrome";v="120", "Chromium";v="120", "Not=A?Brand";v="99"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'Referer': 'https://www.google.com/'
      };
      
      // Try different extraction methods
      let jobDescription = null;
      
      // Method 1: Standard fetch and Cheerio extraction
      try {
        const response = await fetch(url, { 
          headers: fetchHeaders,
          redirect: 'follow'
        });
        
        if (response.ok) {
          const html = await response.text();
          jobDescription = extractJobDescriptionContent(html, url);
          
          if (jobDescription && jobDescription.length > 100) {
            console.log(`Successfully extracted job description using standard method from ${url}`);
            descriptions.push(jobDescription);
            continue; // Skip to next URL if successful
          }
        }
      } catch (error) {
        console.error(`Error with standard extraction for ${url}:`, error);
      }
      
      // Method 2: Use alternative headers
      if (!jobDescription) {
        try {
          const altHeaders = {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          };
          
          const response = await fetch(url, { 
            headers: altHeaders,
            redirect: 'follow'
          });
          
          if (response.ok) {
            const html = await response.text();
            jobDescription = extractJobDescriptionContent(html, url);
            
            if (jobDescription && jobDescription.length > 100) {
              console.log(`Successfully extracted job description using mobile headers from ${url}`);
              descriptions.push(jobDescription);
            }
          }
        } catch (error) {
          console.error(`Error with alternative headers extraction for ${url}:`, error);
        }
      }
      
    } catch (error) {
      console.error(`Error extracting from ${url}:`, error);
    }
  }
  
  return descriptions;
}

/**
 * Consolidate multiple job descriptions into a unified structured description
 */
function consolidateDescriptions(descriptions: string[], role: string, customRole?: string): string {
  if (descriptions.length === 0) {
    return `# ${customRole || role.replace(/_/g, ' ')} Role Description\n\nNo detailed job descriptions were found for this role. Please try a different search term or enter the job description manually.`;
  }
  
  // Format role title
  const roleTitle = customRole || role.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
  
  // Extract sections from each description
  const allResponsibilities: string[] = [];
  const allRequirements: string[] = [];
  const allSkills: string[] = [];
  const allAbout: string[] = [];
  
  descriptions.forEach(description => {
    // Extract responsibilities
    const respMatch = description.match(/(?:responsibilities|duties|what you['']ll do|role includes|you will|in this role)[\s\S]*?(?=\n\n|\n[A-Z\d]|requirements|qualifications|skills|education|experience|about|$)/i);
    if (respMatch && respMatch[0]) {
      const bullets = extractBulletPointsFromText(respMatch[0]);
      allResponsibilities.push(...bullets);
    }
    
    // Extract requirements/qualifications
    const reqMatch = description.match(/(?:requirements|qualifications|what you['']ll need|we are looking for)[\s\S]*?(?=\n\n|\n[A-Z\d]|responsibilities|duties|skills|education|experience|about|$)/i);
    if (reqMatch && reqMatch[0]) {
      const bullets = extractBulletPointsFromText(reqMatch[0]);
      allRequirements.push(...bullets);
    }
    
    // Extract skills
    const skillsMatch = description.match(/(?:skills|expertise|technical skills|competencies)[\s\S]*?(?=\n\n|\n[A-Z\d]|responsibilities|duties|requirements|qualifications|education|experience|about|$)/i);
    if (skillsMatch && skillsMatch[0]) {
      const bullets = extractBulletPointsFromText(skillsMatch[0]);
      allSkills.push(...bullets);
    }
    
    // Extract about/overview
    const aboutMatch = description.match(/(?:about|overview|summary|the role|the position|the job|we are)[\s\S]*?(?=\n\n|\n[A-Z\d]|responsibilities|duties|requirements|qualifications|skills|education|experience|$)/i);
    if (aboutMatch && aboutMatch[0]) {
      // For about section, keep paragraphs rather than bullet points
      const text = aboutMatch[0].replace(/(?:about|overview|summary|the role|the position|the job|we are)[^\n]*/i, '').trim();
      if (text.length > 30) {
        allAbout.push(text);
      }
    }
  });
  
  // Deduplicate and limit each section
  const uniqueResponsibilities = deduplicateAndLimit(allResponsibilities, 10);
  const uniqueRequirements = deduplicateAndLimit(allRequirements, 8);
  const uniqueSkills = deduplicateAndLimit(allSkills, 8);
  const uniqueAbout = deduplicateAndLimit(allAbout, 1); // Just take the first good about section
  
  // Build consolidated description
  let consolidated = `# ${roleTitle} Role Description\n\n`;
  
  if (uniqueAbout.length > 0) {
    consolidated += `## About This Role\n${uniqueAbout[0]}\n\n`;
  } else {
    consolidated += `## About This Role\n${roleTitle} professionals are responsible for ${getGenericRoleSummary(role, customRole)}.\n\n`;
  }
  
  if (uniqueResponsibilities.length > 0) {
    consolidated += "## Key Responsibilities\n";
    uniqueResponsibilities.forEach(resp => {
      consolidated += `- ${resp}\n`;
    });
    consolidated += "\n";
  }
  
  if (uniqueRequirements.length > 0) {
    consolidated += "## Requirements & Qualifications\n";
    uniqueRequirements.forEach(req => {
      consolidated += `- ${req}\n`;
    });
    consolidated += "\n";
  }
  
  if (uniqueSkills.length > 0) {
    consolidated += "## Skills & Competencies\n";
    uniqueSkills.forEach(skill => {
      consolidated += `- ${skill}\n`;
    });
    consolidated += "\n";
  }
  
  consolidated += `\nThis description combines information from multiple job postings for ${roleTitle} roles.`;
  
  return consolidated;
}

/**
 * Extract bullet points from text
 */
function extractBulletPointsFromText(text: string): string[] {
  const bullets: string[] = [];
  
  // Extract bullet points with common markers
  const bulletRegex = /[•\-\*\+◦◆◇‣⁃⁌⁍]\s+([^\n]+)/g;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 15) {
      bullets.push(match[1].trim());
    }
  }
  
  // Extract numbered points
  const numberedRegex = /\d+\.\s+([^\n]+)/g;
  while ((match = numberedRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 15) {
      bullets.push(match[1].trim());
    }
  }
  
  // If no bullet points found, try to extract sentences
  if (bullets.length === 0) {
    const sentences = text.split(/[.!?][\s\n]+/);
    for (const sentence of sentences) {
      const cleaned = sentence.replace(/responsibilities|requirements|qualifications|skills|expertise|:/gi, '').trim();
      if (cleaned.length > 20 && cleaned.length < 200) {
        bullets.push(cleaned);
      }
    }
  }
  
  return bullets;
}

/**
 * Deduplicate and limit array items
 */
function deduplicateAndLimit(items: string[], limit: number): string[] {
  // First, deduplicate by converting to lowercase and comparing similarity
  const unique: string[] = [];
  const lowercased: string[] = [];
  
  for (const item of items) {
    const itemLower = item.toLowerCase();
    let isDuplicate = false;
    
    for (const existing of lowercased) {
      // Simple similarity check - if one contains the other
      if (itemLower.includes(existing) || existing.includes(itemLower) || 
          calculateSimilarity(itemLower, existing) > 0.7) {
        isDuplicate = true;
        break;
      }
    }
    
    if (!isDuplicate) {
      unique.push(item);
      lowercased.push(itemLower);
    }
  }
  
  // Return the first 'limit' items
  return unique.slice(0, limit);
}

/**
 * Calculate similarity between two strings (Jaccard similarity)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const words1 = new Set(str1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(str2.split(/\s+/).filter(w => w.length > 3));
  
  if (words1.size === 0 || words2.size === 0) return 0;
  
  let intersection = 0;
  for (const word of words1) {
    if (words2.has(word)) intersection++;
  }
  
  const union = words1.size + words2.size - intersection;
  return intersection / union;
}

/**
 * Get generic role summary for when no about section is found
 */
function getGenericRoleSummary(role: string, customRole?: string): string {
  const roleMap: Record<string, string> = {
    'product_manager': 'overseeing the development of products from conception to launch, gathering requirements, defining features, and coordinating with cross-functional teams',
    'technical_program_manager': 'managing complex technical projects, coordinating cross-functional teams, and ensuring timely delivery of technical initiatives',
    'engineering_manager': 'leading engineering teams, overseeing technical projects, and aligning technical solutions with business objectives',
    'cto': 'defining technical vision, overseeing all technical aspects of the company, and making key technology decisions',
    'finance_manager': 'overseeing financial operations, preparing reports, and developing strategies to maximize profits and financial efficiency',
    'marketing_manager': 'developing marketing strategies, overseeing campaigns, and driving brand awareness and customer acquisition',
    'data_scientist': 'analyzing complex data sets, building predictive models, and extracting actionable insights for business decision-making',
    'software_engineer': 'designing, developing, and maintaining software systems and applications',
    'management_consultant': 'analyzing business problems and providing strategic recommendations to improve organizational performance',
    'sustainability_manager': 'developing and implementing sustainability initiatives and ensuring environmental compliance across the organization',
  };
  
  if (customRole) {
    return `providing expertise in ${customRole.toLowerCase()}`;
  }
  
  return roleMap[role] || 'providing specialized expertise and leadership in their field';
}
