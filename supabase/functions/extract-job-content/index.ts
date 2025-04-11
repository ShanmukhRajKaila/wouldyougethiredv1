
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestData {
  url: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json() as RequestData;

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

    // More advanced extraction techniques
    const companyName = extractCompanyName(html, url);
    const jobDescription = extractJobDescription(html, url);

    return new Response(
      JSON.stringify({ 
        companyName: companyName || null, 
        jobDescription: jobDescription || null 
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
  
  // Check if the name is a common job board name
  const lowerName = name.toLowerCase();
  if (jobBoardNames.some(board => lowerName.includes(board))) {
    return true;
  }
  
  // Check if name is the same as domain (often happens with job boards)
  const domain = new URL(url).hostname.replace('www.', '').split('.')[0].toLowerCase();
  return lowerName.includes(domain) && jobBoardNames.some(board => domain.includes(board));
}

// Extract company from domain with improved logic
function extractFromDomain(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace('www.', '');
    
    // For LinkedIn job pages, try to extract from the path
    if (domain.includes('linkedin.com')) {
      const pathParts = urlObj.pathname.split('/');
      // LinkedIn company pages often have the company name in the path
      for (const part of pathParts) {
        if (part && !['jobs', 'job', 'search', 'company', 'companies', 'in', 'at'].includes(part)) {
          // Convert dashes to spaces and capitalize
          const companyName = part.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
          
          if (companyName.length > 1) {
            return companyName;
          }
        }
      }
    }
    
    // For other domains
    const domainParts = domain.split('.');
    if (domainParts.length >= 2) {
      const mainDomain = domainParts[0];
      // Avoid returning generic parts like "jobs", "careers", etc.
      const genericTerms = ['jobs', 'careers', 'job', 'career', 'hire', 'apply', 'work', 'employment'];
      if (!genericTerms.includes(mainDomain)) {
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

// Enhanced function to extract job description with better pattern matching
function extractJobDescription(html: string, url: string): string | null {
  // Remove script, style, header, navigation and footer elements to clean up the HTML
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  // LinkedIn specific extraction patterns
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
  
  // Common job description container patterns - enhanced with more patterns
  const patterns = [
    // Job description specific patterns with various class names
    /<div[^>]*class="[^"]*(?:job-description|jobDescriptionText|description|job-details|details|jobsearch-JobComponent-description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*id="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*id="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    
    // Indeed specific patterns
    /<div[^>]*id="[^"]*(?:jobDescriptionText)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    
    // Glassdoor specific patterns
    /<div[^>]*class="[^"]*(?:jobDescriptionContent|desc)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    
    // Structured data approach
    /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/i
  ];
  
  // Try each pattern until we find a match
  for (const pattern of patterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      // Special handling for JSON-LD structured data
      if (pattern.toString().includes('ld\\+json')) {
        try {
          const jsonData = JSON.parse(match[1]);
          // Look for job description in schema.org JobPosting format
          if (jsonData.description) {
            return typeof jsonData.description === 'string' 
              ? convertHtmlToText(jsonData.description)
              : JSON.stringify(jsonData.description);
          }
        } catch (e) {
          console.error('Error parsing JSON-LD data:', e);
        }
      } else {
        // Regular HTML content extraction
        const extractedText = convertHtmlToText(match[1]);
        // Only return if we have substantial content
        if (extractedText && extractedText.length > 100) {
          return extractedText;
        }
      }
    }
  }
  
  // If no specific container found, look for larger content areas
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
  
  // Advanced approach: find the longest text block that has job-related keywords
  const jobKeywords = ['experience', 'skills', 'requirements', 'responsibilities', 'qualifications', 
    'job', 'position', 'role', 'background', 'education', 'knowledge', 'ability', 'competenc', 
    'proficien', 'degree', 'salary', 'work', 'team', 'project', 'develop', 'manage'];
  
  // Get all significant text blocks
  const textBlocks = cleanedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>|<div[^>]*>([\s\S]*?)<\/div>|<section[^>]*>([\s\S]*?)<\/section>/gi) || [];
  
  // Process and score text blocks
  const scoredBlocks = textBlocks
    .map(block => {
      const text = convertHtmlToText(block);
      if (!text || text.length < 100) return null;
      
      // Count keyword matches
      const keywordCount = jobKeywords.reduce((count, keyword) => {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        return count + (matches ? matches.length : 0);
      }, 0);
      
      return { text, score: keywordCount, length: text.length };
    })
    .filter(Boolean);
  
  // Sort by keyword score (primary) and length (secondary)
  scoredBlocks.sort((a, b) => {
    if (a.score !== b.score) return b.score - a.score;
    return b.length - a.length;
  });
  
  // Return the best match if it exists
  if (scoredBlocks.length > 0 && scoredBlocks[0].score > 2) {
    return scoredBlocks[0].text;
  }
  
  return null;
}

// Convert HTML to plain text with better formatting
function convertHtmlToText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n') // Convert <br> to newlines
    .replace(/<li\b[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n') // Convert list items to bullet points
    .replace(/<\/p>\s*<p/gi, '</p>\n<p') // Add newlines between paragraphs
    .replace(/<\/div>\s*<div/gi, '</div>\n<div') // Add newlines between divs
    .replace(/<\/h[1-6]>\s*<(?!h[1-6])/gi, '</h$1>\n<') // Add newlines after headers
    .replace(/<[^>]+>/g, '') // Remove all remaining HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with spaces
    .replace(/&amp;/g, '&') // Replace &amp; with &
    .replace(/&lt;/g, '<') // Replace &lt; with <
    .replace(/&gt;/g, '>') // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\n{3,}/g, '\n\n') // Normalize excessive newlines
    .replace(/\s{2,}/g, ' ') // Normalize excessive spaces
    .trim(); // Trim whitespace
}
