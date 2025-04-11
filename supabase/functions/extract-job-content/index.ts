
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  url: string;
  options?: {
    followRedirects?: boolean;
    extractLinkedInCompanyName?: boolean;
    browserHeaders?: boolean;
    advancedExtraction?: boolean;
    contentPatternMatching?: boolean;
    debug?: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const request = await req.json() as RequestData;
    const { url, options = {} } = request;
    const debug = options.debug || false;
    const advancedExtraction = options.advancedExtraction || false;
    const contentPatternMatching = options.contentPatternMatching || false;

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Extracting content from URL:', url);
    
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
      return new Response(
        JSON.stringify({ error: `Failed to fetch content from URL: ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();
    
    if (debug) {
      console.log(`Received HTML content (length: ${html.length} characters)`);
      console.log(`URL domain: ${new URL(url).hostname}`);
    }

    // General extraction approach
    const companyName = extractCompanyName(html, url);
    const jobTitle = extractJobTitle(html, url);
    
    // NEW: Enhanced multi-stage job description extraction pipeline
    const jobDescription = extractJobDescriptionMultiStage(html, url, {
      debug,
      advancedExtraction,
      contentPatternMatching,
      domain: new URL(url).hostname
    });

    // For debugging: return more info about the extraction process
    let debugInfo = {};
    if (debug) {
      debugInfo = {
        htmlLength: html.length,
        extractionDomainInfo: new URL(url).hostname,
        detectedPatterns: detectContentPatterns(html)
      };
    }

    return new Response(
      JSON.stringify({ 
        companyName: companyName || null, 
        jobDescription: jobDescription || null,
        jobTitle: jobTitle || null,
        debug: debug ? debugInfo : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-job-content function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// Helper function to detect content patterns for debugging
function detectContentPatterns(html: string) {
  const patterns = {
    hasJobDescriptionClass: html.includes('job-description') || html.includes('jobDescription'),
    hasDescriptionClass: html.includes('description'),
    hasDetailsClass: html.includes('details'),
    hasJobPostingSchema: html.includes('JobPosting'),
    iframeCount: (html.match(/<iframe/g) || []).length,
    scriptCount: (html.match(/<script/g) || []).length,
    divCount: (html.match(/<div/g) || []).length,
    mainContentGuess: html.includes('main-content') ? 'main-content' : 
                      html.includes('content-main') ? 'content-main' : 
                      html.includes('job-content') ? 'job-content' : 'unknown',
    potentialContentAreas: findPotentialContentAreas(html)
  };
  
  return patterns;
}

// NEW: Find potential content areas for better content extraction
function findPotentialContentAreas(html: string) {
  const potentialAreas = [];
  
  // Look for common content container patterns
  const patterns = [
    { name: 'main-content', regex: /<(?:div|section|main)[^>]*(?:id|class)="[^"]*(?:main-content|mainContent|content-main|contentMain)[^"]*"[^>]*>/i },
    { name: 'job-content', regex: /<(?:div|section|article)[^>]*(?:id|class)="[^"]*(?:job-content|jobContent|job-details|jobDetails)[^"]*"[^>]*>/i },
    { name: 'description', regex: /<(?:div|section)[^>]*(?:id|class)="[^"]*(?:description|job-description|jobDescription)[^"]*"[^>]*>/i },
    { name: 'main-tag', regex: /<main[^>]*>/i },
    { name: 'article-tag', regex: /<article[^>]*>/i }
  ];
  
  for (const pattern of patterns) {
    if (pattern.regex.test(html)) {
      potentialAreas.push(pattern.name);
    }
  }
  
  return potentialAreas;
}

// Enhanced job title extraction
function extractJobTitle(html: string, url: string): string | null {
  // Title tag often contains job title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim();
    // Check if title has typical job indicators
    const jobTerms = ['software', 'developer', 'engineer', 'manager', 'director', 
                     'specialist', 'analyst', 'consultant', 'coordinator', 'assistant',
                     'administrator', 'lead', 'head', 'chief', 'officer', 'designer'];
                     
    // Check if title contains job terms
    if (jobTerms.some(term => title.toLowerCase().includes(term))) {
      // Clean up title - remove site name and other common elements
      let cleanTitle = title
        .replace(/\s*[-|]\s*.+$/, '') // Remove anything after dash or pipe
        .replace(/\s*at\s+.+$/, '')   // Remove "at Company"
        .replace(/^Job:\s*/, '')      // Remove "Job:" prefix
        .replace(/^\s*[\d.,]+\s+/, '') // Remove leading numbers
        .trim();
        
      if (cleanTitle.length > 5 && cleanTitle.length < 100) {
        return cleanTitle;
      }
    }
  }
  
  // Check for h1 tags that might contain job titles
  const h1Match = html.match(/<h1[^>]*>(.*?)<\/h1>/i);
  if (h1Match && h1Match[1]) {
    const h1Text = h1Match[1].replace(/<[^>]+>/g, '').trim();
    if (h1Text.length > 5 && h1Text.length < 100) {
      return h1Text;
    }
  }
  
  // Look for structured data
  const schemaMatch = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i);
  if (schemaMatch && schemaMatch[1]) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      if (schema.title) {
        return schema.title;
      }
      if (schema.jobTitle) {
        return schema.jobTitle;
      }
    } catch (e) {
      // JSON parsing failed, continue to other methods
    }
  }
  
  return null;
}

// Enhanced function to extract company name with more dynamic patterns
function extractCompanyName(html: string, url: string): string | null {
  // Try multiple patterns to better identify company names
  const extractionPatterns = [
    // Common meta tags
    /<meta[^>]*(?:property|name)="(?:og:site_name|author|publisher)"[^>]*content="([^"]+)"/i,
    
    // LinkedIn specific company patterns
    /(?:"companyName"|"company"|"organizationName"|"employerName")(?:\s*[:=]\s*|\s*>\s*)["']([^"']{2,50})["']/i,
    /<span[^>]*class="[^"]*(?:company-name|employer-name|org-name|company|employer)[^"]*"[^>]*>([^<]{2,50})<\/span>/i,
    /<div[^>]*class="[^"]*(?:company-name|employer-name|org-name|company|employer)[^"]*"[^>]*>([^<]{2,50})<\/div>/i,
    /<strong>Company:<\/strong>\s*([^<]{2,50})</i,
    /<h2[^>]*>About\s+([^<]{2,50})<\/h2>/i,
    
    // Standard job boards patterns
    /(?:data-company-name|class="company-?name"|job-company-name)(?:\s*[:=]\s*|\s*>\s*)["']([^"']{2,50})["']/i,
    /<div[^>]*class="[^"]*topcard__org-name[^"]*"[^>]*>([^<]{2,50})<\/div>/i,
    
    // JSON+LD extraction (common for structured data)
    /"hiringOrganization"[^}]*"name"\s*:\s*"([^"]{2,50})"/i,
    /"employer"[^}]*"name"\s*:\s*"([^"]{2,50})"/i
  ];
  
  // Try each extraction pattern
  for (const pattern of extractionPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const extracted = cleanCompanyName(match[1]);
      // Don't return LinkedIn, Facebook, etc. as company names
      if (!isJobBoardName(extracted, url)) {
        return extracted;
      }
    }
  }

  // If no pattern matches, try generic title extraction
  const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const titleParts = titleMatch[1].split(/[\|\-–—@]/);
    if (titleParts.length > 1) {
      // Company name is often after the pipe or dash in titles
      const potentialCompany = cleanCompanyName(titleParts[titleParts.length - 1]);
      if (potentialCompany && !isJobBoardName(potentialCompany, url)) {
        return potentialCompany;
      }
    }
  }
  
  // If still no match, extract from URL domain
  return extractFromDomain(url);
}

// Check if the extracted name is that of a job board rather than an employer
function isJobBoardName(name: string, url: string): boolean {
  const jobBoardNames = [
    'linkedin', 'indeed', 'glassdoor', 'monster', 'ziprecruiter', 
    'careerbuilder', 'dice', 'simplyhired', 'jobboard', 'jobs',
    'facebook', 'twitter', 'instagram', 'tiktok', 'youtube',
    'job description', 'position', 'job details', 'careers'
  ];
  
  const lowerName = name.toLowerCase();
  if (jobBoardNames.some(board => lowerName.includes(board))) {
    return true;
  }
  
  const domain = new URL(url).hostname.replace('www.', '').split('.')[0].toLowerCase();
  return lowerName.includes(domain) && jobBoardNames.some(board => domain.includes(board));
}

// Extract company from domain with improved logic
function extractFromDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    if (domain.includes('linkedin.com')) {
      const pathParts = urlObj.pathname.split('/');
      for (const part of pathParts) {
        if (part && !['jobs', 'job', 'search', 'company', 'companies', 'in', 'at'].includes(part)) {
          const companyName = part.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          if (companyName.length > 1) {
            return companyName;
          }
        }
      }
    }
    
    const domainParts = domain.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[0];
      if (!['jobs', 'careers', 'job', 'career', 'hire', 'apply', 'work', 'employment'].includes(mainDomain)) {
        return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
      }
    }
  } catch (e) {
    console.error("Error extracting from domain:", e);
  }
  
  return null;
}

// Clean up company name with improved logic
function cleanCompanyName(name: string): string {
  if (!name) return '';
  
  return name.trim()
    .replace(/^at\s+/i, '') // Remove leading "at"
    .replace(/^\s*[-–—]\s*/, '') // Remove leading dash
    .replace(/\s*\|\s*.+$/i, '') // Remove pipe and anything after
    .replace(/\s*[-–—]\s*.+$/i, '') // Remove dash and anything after
    .replace(/\s*[.]\s*$/, '') // Remove trailing period
    .replace(/™|®|©/g, '') // Remove trademark symbols
    .replace(/^jobs\s+at\s+/i, '') // Remove "Jobs at" prefix
    .replace(/^careers\s+at\s+/i, '') // Remove "Careers at" prefix
    .replace(/^(apply\s+to|join)\s+/i, '') // Remove "Apply to" prefix
    .replace(/\s+jobs\s*$/i, '') // Remove "Jobs" suffix
    .replace(/\s+careers\s*$/i, '') // Remove "Careers" suffix
    .replace(/\s+LLC\s*$/i, '') // Remove LLC
    .replace(/\s+Inc\s*$/i, '') // Remove Inc
    .replace(/\s+Corp\.?\s*$/i, '') // Remove Corp/Corp.
    .replace(/@\s*/, '') // Remove @ symbol
    .replace(/^\d+\s+/, '') // Remove leading numbers
    .replace(/\s{2,}/g, ' ') // Normalize spaces
    .trim();
}

// NEW: Multi-stage job description extraction with fallbacks
function extractJobDescriptionMultiStage(html: string, url: string, options: {
  debug?: boolean,
  advancedExtraction?: boolean,
  contentPatternMatching?: boolean,
  domain?: string
}): string | null {
  const { debug = false, advancedExtraction = false, domain = '' } = options;
  
  if (debug) {
    console.log("Using multi-stage extraction pipeline for domain:", domain);
  }

  let jobDescription = null;
  
  // Stage 1: Try structured data extraction (JSON-LD)
  if (!jobDescription) {
    jobDescription = extractFromStructuredData(html, debug);
    if (jobDescription && debug) console.log("Extracted from structured data, length:", jobDescription.length);
  }
  
  // Stage 2: Try common class/id patterns based on domain-specific customizations
  if (!jobDescription) {
    jobDescription = extractByDomainRules(html, domain, debug);
    if (jobDescription && debug) console.log("Extracted using domain rules, length:", jobDescription.length);
  }
  
  // Stage 3: Try generic class/id patterns
  if (!jobDescription) {
    jobDescription = extractFromCommonPatterns(html, debug);
    if (jobDescription && debug) console.log("Extracted from common patterns, length:", jobDescription.length);
  }
  
  // Stage 4: Try main content areas
  if (!jobDescription) {
    jobDescription = extractFromMainContent(html, debug);
    if (jobDescription && debug) console.log("Extracted from main content, length:", jobDescription.length);
  }
  
  // Stage 5: Try to find the largest text block with job keywords
  if (!jobDescription && advancedExtraction) {
    jobDescription = extractFromLargestContentBlock(html, debug);
    if (jobDescription && debug) console.log("Extracted from largest content block, length:", jobDescription.length);
  }
  
  // Final cleanup if we have a job description
  if (jobDescription) {
    jobDescription = cleanJobDescription(jobDescription);
  }
  
  return jobDescription;
}

// NEW: Extract job description from structured data (JSON-LD)
function extractFromStructuredData(html: string, debug = false): string | null {
  if (debug) {
    console.log("Attempting to extract from structured data...");
  }
  
  // Look for JSON-LD data
  const jsonLdPattern = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi;
  const jsonMatches = [...html.matchAll(jsonLdPattern)];
  
  for (const jsonMatch of jsonMatches) {
    if (jsonMatch[1]) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        
        // Check for JobPosting schema
        if (data["@type"] === "JobPosting" && data.description) {
          return typeof data.description === 'string' ? 
            convertHtmlToText(data.description) : 
            JSON.stringify(data.description);
        }
        
        // Check for nested data
        if (data.jobPosting && data.jobPosting.description) {
          return typeof data.jobPosting.description === 'string' ? 
            convertHtmlToText(data.jobPosting.description) : 
            JSON.stringify(data.jobPosting.description);
        }
        
      } catch (e) {
        if (debug) {
          console.error("Error parsing JSON-LD:", e);
        }
      }
    }
  }
  
  return null;
}

// NEW: Extract job description based on domain-specific rules
function extractByDomainRules(html: string, domain: string, debug = false): string | null {
  if (debug) {
    console.log("Trying domain-specific extraction rules for:", domain);
  }
  
  // LinkedIn-specific extraction
  if (domain.includes('linkedin.com')) {
    const linkedInPatterns = [
      /<div[^>]*class="[^"]*show-more-less-html[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i
    ];
    
    for (const pattern of linkedInPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 100) {
        return convertHtmlToText(match[1]);
      }
    }
  }
  
  // Indeed-specific extraction
  if (domain.includes('indeed.com')) {
    const indeedPatterns = [
      /<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*jobsearch-JobComponent-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ];
    
    for (const pattern of indeedPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 100) {
        return convertHtmlToText(match[1]);
      }
    }
  }
  
  // MBA Exchange specific extraction
  if (domain.includes('mba-exchange.com')) {
    // Look for tables with job content
    const tablePattern = /<table[^>]*class="[^"]*(?:jd|job-description)[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
    let match = html.match(tablePattern);
    
    if (match && match[1]) {
      return convertHtmlToText(match[1]);
    }
    
    // Try to find job description in specific MBA Exchange structure
    const jobDetailPattern = /<div[^>]*class="[^"]*jobs?[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
    match = html.match(jobDetailPattern);
    
    if (match && match[1]) {
      return convertHtmlToText(match[1]);
    }
    
    // Look for any substantial table content
    const anyTable = /<table[^>]*>([\s\S]{300,}?)<\/table>/gi;
    const tableMatches = [...html.matchAll(anyTable)];
    
    for (const tableMatch of tableMatches) {
      const content = tableMatch[1];
      if (content && content.length > 300) {
        return convertHtmlToText(content);
      }
    }
  }
  
  // MyCareersFuture specific extraction
  if (domain.includes('mycareersfuture.gov.sg')) {
    const myCareersPatterns = [
      /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*id="job-description"[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*data-testid="job-description"[^>]*>([\s\S]*?)<\/div>/i
    ];
    
    for (const pattern of myCareersPatterns) {
      const match = html.match(pattern);
      if (match && match[1] && match[1].length > 100) {
        return convertHtmlToText(match[1]);
      }
    }
    
    // Try to find job details within any section
    const sectionContents = html.match(/<section[^>]*>([\s\S]{300,}?)<\/section>/gi);
    if (sectionContents) {
      for (const section of sectionContents) {
        // Check if section contains job-related content
        if (section.toLowerCase().includes('job description') || 
            section.toLowerCase().includes('responsibilities') || 
            section.toLowerCase().includes('requirements')) {
          return convertHtmlToText(section);
        }
      }
    }
  }
  
  return null;
}

// NEW: Extract from common patterns across job sites
function extractFromCommonPatterns(html: string, debug = false): string | null {
  if (debug) {
    console.log("Trying common content patterns extraction...");
  }
  
  // Clean HTML to focus on content
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  const patterns = [
    // Common job description containers by class
    /<div[^>]*class="[^"]*(?:job-description|jobDescription|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:job-description|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    
    // Common job description containers by ID
    /<div[^>]*id="[^"]*(?:job-description|jobDescription|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*id="[^"]*(?:job-description|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    
    // Additional patterns for job descriptions
    /<div[^>]*class="[^"]*(?:jobDescriptionContent|desc|posting-requirements)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    
    // Article-based job descriptions
    /<article[^>]*class="[^"]*(?:job|job-description)[^"]*"[^>]*>([\s\S]*?)<\/article>/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      const content = match[1].trim();
      if (content.length > 200 && isLikelyJobDescription(content)) {
        return convertHtmlToText(content);
      }
    }
  }
  
  return null;
}

// NEW: Check if content looks like a job description
function isLikelyJobDescription(content: string): boolean {
  // Keywords commonly found in job descriptions
  const jobKeywords = [
    'responsibilities', 
    'requirements', 
    'qualifications', 
    'skills', 
    'experience', 
    'role', 
    'position', 
    'about the job',
    'job summary',
    'we are looking for',
    'what you will do',
    'what you\'ll do', // Fixed the syntax error here
    'who we are looking for',
    'desired skills'
  ];
  
  const lowerContent = content.toLowerCase();
  
  // Check for the presence of job keywords
  const keywordPresence = jobKeywords.some(keyword => lowerContent.includes(keyword));
  
  // Check for bullet points which are common in job descriptions
  const hasBulletPoints = lowerContent.includes('<li>') || 
                          lowerContent.includes('•') || 
                          lowerContent.includes('- ');
  
  // Check for requirement-like structures (numbers or bullets followed by text)
  const hasRequirementStructure = /(\d+\.|\•|\-)\s+[A-Z][a-z]/.test(content);
  
  return keywordPresence && (hasBulletPoints || hasRequirementStructure || content.length > 500);
}

// NEW: Extract from main content areas
function extractFromMainContent(html: string, debug = false): string | null {
  if (debug) {
    console.log("Attempting to extract from main content areas...");
  }
  
  const mainContentPatterns = [
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:main-content|content-main|main|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<div[^>]*id="[^"]*(?:main-content|content-main|main|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];
  
  for (const pattern of mainContentPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      const content = match[1].trim();
      
      // Process the main content to find job description within it
      if (content.length > 300) {
        // Try to find job description section within the main content
        const jobSectionPattern = /<(?:div|section)[^>]*>(?:[\s\S]*?)(?:job description|responsibilities|requirements|qualifications)(?:[\s\S]*?)<\/(?:div|section)>/i;
        const jobSection = content.match(jobSectionPattern);
        
        if (jobSection && jobSection[0]) {
          return convertHtmlToText(jobSection[0]);
        }
        
        // If we can't find an explicit section, check if the main content itself looks like a job description
        if (isLikelyJobDescription(content)) {
          return convertHtmlToText(content);
        }
      }
    }
  }
  
  return null;
}

// NEW: Extract from the largest content block that contains job-related keywords
function extractFromLargestContentBlock(html: string, debug = false): string | null {
  if (debug) {
    console.log("Attempting to extract from largest relevant content block...");
  }
  
  // First clean the HTML to focus on content
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  // Find all substantial content blocks
  const contentBlocks = [
    ...findContentBlocks(cleanedHtml, 'div', 300),
    ...findContentBlocks(cleanedHtml, 'section', 300),
    ...findContentBlocks(cleanedHtml, 'article', 300)
  ];
  
  if (contentBlocks.length === 0) {
    return null;
  }
  
  // Score each content block based on length and job-related keywords
  const scoredBlocks = contentBlocks.map(block => {
    const text = convertHtmlToText(block);
    const jobKeywordCount = countJobKeywords(text);
    const score = jobKeywordCount * 10 + Math.min(text.length / 100, 50);
    
    return {
      content: block,
      text,
      score,
      length: text.length,
      keywordCount: jobKeywordCount
    };
  });
  
  // Sort by score (highest first)
  scoredBlocks.sort((a, b) => b.score - a.score);
  
  if (debug) {
    console.log(`Found ${scoredBlocks.length} content blocks`);
    console.log(`Top block score: ${scoredBlocks[0]?.score}, length: ${scoredBlocks[0]?.length}, keywords: ${scoredBlocks[0]?.keywordCount}`);
  }
  
  // Return the highest-scoring block that meets minimum criteria
  const bestBlock = scoredBlocks.find(block => block.score > 20 && block.keywordCount >= 2);
  
  if (bestBlock) {
    return bestBlock.text;
  }
  
  return null;
}

// Helper function to find content blocks of a specified minimum length
function findContentBlocks(html: string, tag: string, minLength: number): string[] {
  const pattern = new RegExp(`<${tag}[^>]*>(.*?)<\/${tag}>`, 'gi');
  const blocks: string[] = [];
  
  let match;
  while ((match = pattern.exec(html)) !== null) {
    if (match[1] && match[1].length > minLength) {
      blocks.push(match[1]);
    }
  }
  
  return blocks;
}

// Helper function to count job-related keywords in text
function countJobKeywords(text: string): number {
  const keywords = [
    'responsibilities',
    'requirements',
    'qualifications',
    'experience',
    'skills',
    'job description',
    'about the role',
    'what you\'ll do', // Fixed the syntax error here
    'what you will do',
    'required',
    'preferred',
    'position',
    'opportunity',
    'application',
    'apply',
    'candidates',
    'team',
    'company',
    'benefits'
  ];
  
  const lowerText = text.toLowerCase();
  return keywords.reduce((count, keyword) => {
    return count + (lowerText.includes(keyword) ? 1 : 0);
  }, 0);
}

// Clean and format the job description
function cleanJobDescription(html: string): string {
  // First convert HTML to text
  let text = convertHtmlToText(html);
  
  // Trim unnecessary whitespace
  text = text.trim();
  
  // Fix bullet points
  text = text.replace(/•\s*/g, '• ');
  
  // Fix multiple consecutive line breaks
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text;
}

// Convert HTML to plain text with better formatting
function convertHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
    .replace(/<\/p>\s*<p/gi, '</p>\n<p')
    .replace(/<\/div>\s*<div/gi, '</div>\n<div')
    .replace(/<\/h[1-6]>\s*<(?!h[1-6])/gi, '</h$1>\n<')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s{2,}/g, ' ')
    .trim();
}
