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
      console.log(`First 500 characters of HTML: ${html.substring(0, 500)}...`);
    }

    // More advanced extraction techniques
    const companyName = extractCompanyName(html, url);
    const jobTitle = extractJobTitle(html, url);
    
    // IMPROVED: Extract job description with specialized handling for MBA Exchange
    let jobDescription = null;
    
    // Special handling for MBA Exchange website
    if (url.includes('mba-exchange.com')) {
      jobDescription = extractMBAExchangeJobDescription(html, debug);
    } 
    
    // If not MBA Exchange or extraction failed, try generic methods
    if (!jobDescription) {
      jobDescription = extractJobDescription(html, url, debug);
    }

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
                      html.includes('job-content') ? 'job-content' : 'unknown'
  };
  
  return patterns;
}

// Enhanced job title extraction
function extractJobTitle(html: string, url: string): string | null {
  // Title tag often contains job title
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    const title = titleMatch[1].trim();
    // Check if title has typical job indicators
    const jobTerms = ['software', 'developer', 'engineer', 'manager', 'director', 
                     'specialist', 'analyst', 'consultant', 'coordinator'];
                     
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

// ADDED: Specialized extraction function for MBA Exchange website
function extractMBAExchangeJobDescription(html: string, debug = false): string | null {
  if (debug) {
    console.log("Using specialized MBA Exchange extraction method");
  }
  
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
  
  // Look for TD with content that likely contains job description
  const tdContentPattern = /<td[^>]*>([\s\S]{200,}?)<\/td>/gi;
  const tdMatches = [...html.matchAll(tdContentPattern)];
  
  for (const tdMatch of tdMatches) {
    const content = tdMatch[1];
    if (content && 
        content.length > 300 && 
        (content.includes('responsibilities') || 
         content.includes('requirements') || 
         content.includes('qualifications') || 
         content.includes('experience'))) {
      return convertHtmlToText(content);
    }
  }
  
  // Try to extract from any table with substantial content
  const anyTable = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const tableMatches = [...html.matchAll(anyTable)];
  
  if (debug) {
    console.log(`Found ${tableMatches.length} tables on the page`);
  }
  
  let bestTableMatch = { content: "", length: 0 };
  for (const tableMatch of tableMatches) {
    const tableContent = tableMatch[1];
    if (tableContent.length > 500 &&
        (tableContent.includes('experience') || 
         tableContent.includes('requirements') || 
         tableContent.includes('responsibilities') || 
         tableContent.includes('qualifications'))) {
      
      if (tableContent.length > bestTableMatch.length) {
        bestTableMatch = {
          content: convertHtmlToText(tableContent),
          length: tableContent.length
        };
      }
    }
  }
  
  if (bestTableMatch.content) {
    return bestTableMatch.content;
  }
  
  // Last resort: try to find any large block of text
  const textBlockPattern = /<div[^>]*>([\s\S]{500,}?)<\/div>/gi;
  const blockMatches = [...html.matchAll(textBlockPattern)];
  
  for (const blockMatch of blockMatches) {
    const content = blockMatch[1];
    if (content && content.length > 500 && !content.includes('<table')) {
      return convertHtmlToText(content);
    }
  }
  
  return null;
}

// Enhanced function to extract job description with better pattern matching
function extractJobDescription(html: string, url: string, debug = false): string | null {
  if (debug) {
    console.log(`URL domain: ${new URL(url).hostname}`);
    
    const jobDescPatterns = [
      'job-description',
      'jobDescription', 
      'description__text',
      'jobDescriptionText',
      'job-details'
    ];
    
    for (const pattern of jobDescPatterns) {
      console.log(`Pattern "${pattern}" exists: ${html.includes(pattern)}`);
    }
  }

  const domain = new URL(url).hostname.toLowerCase();
  
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  if (url.includes('linkedin.com')) {
    const linkedInPatterns = [
      /<div[^>]*class="[^"]*show-more-less-html[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<div[^>]*class="[^"]*description__text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
      /<section[^>]*class="[^"]*description[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
      /<div[^>]*class="[^"]*job-description[^"]*"[^>]*>([\s\S]*?)<\/div>/i
    ];
    
    for (const pattern of linkedInPatterns) {
      const match = cleanedHtml.match(pattern);
      if (match && match[1] && match[1].length > 100) {
        return convertHtmlToText(match[1]);
      }
    }
  }
  
  const patterns = [
    /<div[^>]*class="[^"]*(?:job-description|jobDescriptionText|description|job-details|details|jobsearch-JobComponent-description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*id="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*id="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    
    /<div[^>]*id="[^"]*(?:jobDescriptionText)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    
    /<div[^>]*class="[^"]*(?:jobDescriptionContent|desc)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      if (pattern.toString().includes('ld\\+json')) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData.description) {
            return typeof jsonData.description === 'string' 
              ? convertHtmlToText(jsonData.description)
              : JSON.stringify(jsonData.description);
          }
        } catch (e) {
          if (debug) console.error('Error parsing JSON-LD data:', e);
        }
      } else {
        const extractedText = convertHtmlToText(match[1]);
        if (extractedText && extractedText.length > 100) {
          return extractedText;
        }
      }
    }
  }
  
  const contentPatterns = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*class="[^"]*(?:content|main|body|job)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];
  
  for (const pattern of contentPatterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      const text = convertHtmlToText(match[1]);
      if (text && text.length > 200) {
        return text;
      }
    }
  }
  
  const divMatches = [...cleanedHtml.matchAll(/<div[^>]*>([\s\S]*?)<\/div>/gi)];
  let bestMatch = { text: "", score: 0, length: 0 };
  
  for (const match of divMatches) {
    if (match[1].length < 200) continue;
    
    const contentText = convertHtmlToText(match[1]);
    if (contentText.length > 200) {
      const jobTermCount = (contentText.match(/experience|skills|requirements|responsibilities|qualifications|job|position|role/gi) || []).length;
      
      const score = jobTermCount * 10 + Math.min(contentText.length / 100, 50);
      
      if (score > bestMatch.score) {
        bestMatch = {
          text: contentText,
          score: score,
          length: contentText.length
        };
      }
    }
  }
  
  if (bestMatch.text && bestMatch.score > 30) {
    return bestMatch.text;
  }
  
  if (debug) {
    console.log("Failed to extract job description using standard patterns");
  }
  
  return null;
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
