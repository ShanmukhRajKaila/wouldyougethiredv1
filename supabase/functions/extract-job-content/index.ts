
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
    
    // Add user agent and other headers to better mimic a browser
    const fetchHeaders = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Referer': 'https://www.google.com/'
    };
    
    // Fetch the content from the URL
    const response = await fetch(url, { headers: fetchHeaders });
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch content from URL: ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract company name - enhanced with more patterns
    let companyName = extractCompanyName(html, url);
    
    // Extract job description - improved extraction
    const jobDescription = extractJobDescription(html);

    return new Response(
      JSON.stringify({ 
        companyName, 
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

// Function to extract company name from HTML or URL - improved with more patterns
function extractCompanyName(html: string, url: string): string | null {
  // Try to extract from common meta tags
  const metaCompanyMatches = html.match(/<meta[^>]*(?:property|name)="(?:og:site_name|author|publisher|application-name|copyright|twitter:site)"[^>]*content="([^"]+)"/i);
  if (metaCompanyMatches && metaCompanyMatches[1]) {
    return cleanCompanyName(metaCompanyMatches[1]);
  }
  
  // Try to extract from schema.org Organization markup
  const schemaOrgMatches = html.match(/"organization"[^>]*"name"[^>]*"([^"]+)"/i);
  if (schemaOrgMatches && schemaOrgMatches[1]) {
    return cleanCompanyName(schemaOrgMatches[1]);
  }
  
  // Check for common job board patterns
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  
  // Handle specific job boards
  if (domain.includes('linkedin')) {
    // Extract from LinkedIn specific patterns
    const companyMatch = html.match(/(?:"companyName"|"company"|"organizationName")(?:\s*[:=]\s*|\s*>\s*)["']([^"']+)["']/i);
    return companyMatch ? cleanCompanyName(companyMatch[1]) : extractFromDomain(domain);
  } else if (domain.includes('indeed')) {
    // Extract from Indeed specific patterns
    const companyMatch = html.match(/(?:data-company-name|class="companyName"|companyName)(?:\s*[:=]\s*|\s*>\s*)["']([^"']+)["']/i);
    return companyMatch ? cleanCompanyName(companyMatch[1]) : extractFromDomain(domain);
  } else if (domain.includes('glassdoor')) {
    // Extract from Glassdoor specific patterns
    const companyMatch = html.match(/(?:data-employer-name|employerName|"employer"[^>]*"name"[^>]*)(?:\s*[:=]\s*|\s*>\s*)["']([^"']+)["']/i);
    return companyMatch ? cleanCompanyName(companyMatch[1]) : extractFromDomain(domain);
  } else if (domain.includes('monster')) {
    // Extract from Monster specific patterns
    const companyMatch = html.match(/(?:class="company"|itemprop="hiringOrganization")(?:[^>]*?)>([^<]+)</i);
    return companyMatch ? cleanCompanyName(companyMatch[1]) : extractFromDomain(domain);
  } else if (domain.includes('ziprecruiter')) {
    // Extract from ZipRecruiter specific patterns
    const companyMatch = html.match(/(?:class="job_company"|data-company)(?:[^>]*?)>([^<]+)</i);
    return companyMatch ? cleanCompanyName(companyMatch[1]) : extractFromDomain(domain);
  }
  
  // Try more generic approaches - look for company or employer in text
  const genericCompanyMatch = html.match(/(?:company|employer|organization)(?:\s*[:=]\s*|\s*>\s*)["']([^"']{2,30})["']/i);
  if (genericCompanyMatch && genericCompanyMatch[1]) {
    return cleanCompanyName(genericCompanyMatch[1]);
  }
  
  // If all else fails, extract from domain
  return extractFromDomain(domain);
}

// Helper to extract company name from domain
function extractFromDomain(domain: string): string | null {
  const domainParts = domain.split('.');
  if (domainParts.length >= 2 && domainParts[0] !== 'www' && !['com', 'org', 'net', 'io', 'co'].includes(domainParts[0])) {
    return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  }
  return null;
}

// Clean up company name
function cleanCompanyName(name: string): string {
  return name.trim()
    .replace(/^at\s+/i, '') // Remove leading "at" (common in job listings)
    .replace(/^\s*-\s*/, '') // Remove leading dash
    .replace(/\s*\|\s*.+$/i, '') // Remove pipe and anything after
    .replace(/\s*-\s*.+$/i, '') // Remove dash and anything after (often taglines)
    .replace(/™|®|©/g, '') // Remove trademark/copyright symbols
    .trim();
}

// Function to extract job description from HTML - improved extraction
function extractJobDescription(html: string): string | null {
  // Remove script, style, and header elements
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, '')
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, '')
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, '');
  
  // Common job description container patterns - expanded with more patterns
  const patterns = [
    // Job description specific patterns
    /<div[^>]*class="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*id="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*id="[^"]*(?:job-description|jobDescriptionText|description|job-details|details)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    // LinkedIn specific patterns
    /<div[^>]*class="[^"]*(?:show-more-less-html|description__text)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Indeed specific patterns
    /<div[^>]*id="[^"]*(?:jobDescriptionText)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    // Glassdoor specific patterns
    /<div[^>]*class="[^"]*(?:jobDescriptionContent|desc)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];
  
  // Try each pattern until we find a match
  for (const pattern of patterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      return convertHtmlToText(match[1]);
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
      return convertHtmlToText(match[1]);
    }
  }
  
  // If still no match, take the longest paragraph that might be a job description
  const paragraphs = cleanedHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [];
  if (paragraphs.length > 0) {
    // Find the longest paragraph that contains job-related keywords
    const jobKeywords = ['experience', 'skills', 'requirements', 'responsibilities', 'qualifications', 'job', 'position'];
    
    const candidateParagraphs = paragraphs
      .map(p => {
        const text = convertHtmlToText(p);
        const keywordMatches = jobKeywords.filter(keyword => text.toLowerCase().includes(keyword)).length;
        return { text, keywordMatches, length: text.length };
      })
      .filter(p => p.length > 100); // Only consider paragraphs with substantial content
    
    // Sort by keyword matches (primary) and length (secondary)
    candidateParagraphs.sort((a, b) => {
      if (a.keywordMatches !== b.keywordMatches) {
        return b.keywordMatches - a.keywordMatches;
      }
      return b.length - a.length;
    });
    
    if (candidateParagraphs.length > 0) {
      return candidateParagraphs[0].text;
    }
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
