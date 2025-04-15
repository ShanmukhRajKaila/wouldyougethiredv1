
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { UrlExtractor } from "../extract-job-content/url-extractor.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum number of job descriptions to fetch per role
const MAX_JOBS_PER_ROLE = 10;

// Define search queries for different roles
const ROLE_SEARCH_QUERIES = {
  "product_management": [
    "senior product manager job description tech",
    "product manager post mba job description",
    "tech product management job requirements",
    "product manager responsibilities"
  ],
  "finance": [
    "investment banking associate job description post mba",
    "finance manager job description",
    "corporate finance job requirements",
    "financial analyst post mba job description"
  ],
  "consulting": [
    "management consultant job description post mba",
    "strategy consultant responsibilities",
    "business consultant job requirements",
    "post mba consulting job description"
  ],
  "marketing": [
    "marketing manager job description post mba",
    "brand management job requirements",
    "digital marketing director responsibilities",
    "marketing leadership job description"
  ],
  "sustainability": [
    "sustainability manager job description",
    "esg director responsibilities",
    "corporate sustainability job requirements",
    "environmental program manager job description"
  ],
  // Can expand with other role categories as needed
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

    console.log(`Starting job search for role: ${role}`);
    
    // Get search queries for the specified role
    let searchQueries = ROLE_SEARCH_QUERIES[role];
    
    // If no predefined queries found or it's a custom role, generate queries
    if (!searchQueries || role === 'other') {
      const searchTerm = customRole || role;
      searchQueries = [
        `${searchTerm} job description post mba`,
        `${searchTerm} responsibilities`,
        `${searchTerm} job requirements`,
        `senior ${searchTerm} job description`
      ];
    }

    // Simulate search results with sample job posting URLs
    // In a production environment, this would connect to a search API
    const jobUrls = await simulateSearchResults(searchQueries);
    
    // Extract job descriptions from the URLs
    const jobDescriptions = await extractJobDescriptions(jobUrls);
    
    // Consolidate the descriptions into a unified job description
    const consolidatedDescription = consolidateDescriptions(jobDescriptions);
    
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
 * Simulate search results for job descriptions
 * In production, this would use a search API like Google/Bing
 */
async function simulateSearchResults(queries: string[]): Promise<string[]> {
  // Example job posting URLs for demonstration
  // In production, these would come from real search results
  const sampleJobUrls = [
    "https://www.linkedin.com/jobs/view/product-manager-at-amazon",
    "https://www.indeed.com/job/senior-product-manager-technology",
    "https://www.glassdoor.com/job-listing/product-manager-google",
    "https://www.monster.com/jobs/product-management-director",
    "https://careers.microsoft.com/job/product-manager",
    // Add more sample URLs
  ];
  
  // In a real implementation, we would:
  // 1. Connect to a search API like Google Custom Search, Bing, etc.
  // 2. Execute each query and extract job posting URLs from results
  // 3. Filter for relevant job sites (LinkedIn, Indeed, company careers, etc.)
  
  console.log(`Generated ${sampleJobUrls.length} job URLs from search queries`);
  
  return sampleJobUrls;
}

/**
 * Extract job descriptions from a list of URLs
 */
async function extractJobDescriptions(urls: string[]): Promise<string[]> {
  const descriptions: string[] = [];
  const extraction = new UrlExtractor();
  
  for (const url of urls.slice(0, MAX_JOBS_PER_ROLE)) {
    try {
      console.log(`Extracting job description from: ${url}`);
      const result = await extraction.extractFromUrl(url);
      
      if (result.jobDescription) {
        descriptions.push(result.jobDescription);
      }
    } catch (error) {
      console.error(`Error extracting from ${url}:`, error);
    }
  }
  
  return descriptions;
}

/**
 * Consolidate multiple job descriptions into a unified description
 */
function consolidateDescriptions(descriptions: string[]): string {
  if (descriptions.length === 0) {
    return "No job descriptions were successfully extracted.";
  }
  
  // In a production system, you would:
  // 1. Use NLP to identify common sections (responsibilities, requirements, etc.)
  // 2. Deduplicate similar points
  // 3. Organize content in a structured way
  // 4. Potentially use AI to summarize/consolidate similar points
  
  // For this example, we'll concatenate with section headers
  let consolidated = "# Consolidated Job Description\n\n";
  consolidated += "## About This Role\n";
  consolidated += "This description combines information from multiple job postings for this role.\n\n";
  
  consolidated += "## Common Responsibilities\n";
  descriptions.forEach((desc, i) => {
    // Extract a shorter segment from each description
    const excerpt = desc.slice(0, 500) + (desc.length > 500 ? "..." : "");
    consolidated += `\n### From Job Posting ${i+1}\n${excerpt}\n`;
  });
  
  return consolidated;
}
