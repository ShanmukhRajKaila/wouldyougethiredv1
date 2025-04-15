import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { extractJobDescriptionContent } from "./job-extractor.ts";
import { convertHtmlToText } from "./html-utils.ts";

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
    
    // Extract job descriptions from the URLs using Cheerio and fetch
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
    /\/jobs?\//i,
    /\/career/i,
    /\/position/i,
    /\/vacancy/i,
    /\/opening/i,
  ];
  
  return jobSitePatterns.some(pattern => pattern.test(url));
}

/**
 * Extract job descriptions from a list of URLs using Cheerio and fetch
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
      
      // Fetch the content from the URL with improved headers
      const response = await fetch(url, { 
        headers: fetchHeaders,
        redirect: 'follow'
      });
      
      if (!response.ok) {
        console.error(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
        continue;
      }
      
      const html = await response.text();
      
      // Check if the HTML content was retrieved successfully
      if (!html || html.length < 100) {
        console.error(`Retrieved empty or too short HTML from ${url}`);
        continue;
      }
      
      // Use our extraction utility to get the job description
      const jobDescription = extractJobDescriptionContent(html, url);
      
      if (jobDescription && jobDescription.length > 100) {
        descriptions.push(jobDescription);
      } else {
        console.log(`Couldn't extract job description from ${url}`);
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
