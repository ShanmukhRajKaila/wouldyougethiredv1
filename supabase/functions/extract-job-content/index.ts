
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
    
    // Fetch the content from the URL
    const response = await fetch(url);
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Failed to fetch content from URL: ${response.statusText}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const html = await response.text();

    // Extract company name - look for common patterns
    let companyName = extractCompanyName(html, url);
    
    // Extract job description
    const jobDescription = extractJobDescription(html);

    if (!jobDescription) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not extract job description from the provided URL',
          companyName,
          jobDescription: null
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ companyName, jobDescription }),
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

// Function to extract company name from HTML or URL
function extractCompanyName(html: string, url: string): string | null {
  // Try to extract from common meta tags
  const metaCompanyMatches = html.match(/<meta[^>]*(?:property|name)="(?:og:site_name|author|publisher|application-name)"[^>]*content="([^"]+)"/i);
  if (metaCompanyMatches && metaCompanyMatches[1]) {
    return metaCompanyMatches[1].trim();
  }
  
  // Try to extract from URL
  const urlObj = new URL(url);
  const domain = urlObj.hostname.replace('www.', '');
  
  // Check if it's a job board and try to handle differently
  if (domain.includes('linkedin')) {
    // Extract from LinkedIn URL or content
    const companyMatch = html.match(/(?:"companyName"|"company")(?:\s*:\s*|\s*>\s*)["']([^"']+)["']/i);
    return companyMatch ? companyMatch[1].trim() : null;
  } else if (domain.includes('indeed')) {
    // Extract from Indeed URL or content
    const companyMatch = html.match(/(?:data-company-name|class="companyName")(?:\s*[:=]\s*|\s*>\s*)["']([^"']+)["']/i);
    return companyMatch ? companyMatch[1].trim() : null;
  } else if (domain.includes('glassdoor')) {
    // Extract from Glassdoor URL or content
    const companyMatch = html.match(/(?:data-employer-name|employerName)(?:\s*[:=]\s*|\s*>\s*)["']([^"']+)["']/i);
    return companyMatch ? companyMatch[1].trim() : null;
  }
  
  // If no meta tag, try to extract from the domain
  const domainParts = domain.split('.');
  if (domainParts.length >= 2) {
    return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
  }
  
  // Return null if no company name could be extracted
  return null;
}

// Function to extract job description from HTML
function extractJobDescription(html: string): string | null {
  // Remove script and style elements
  const cleanedHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  
  // Try to find the job description container
  let jobDescriptionContainer = null;
  
  // Common job description container patterns
  const patterns = [
    /<div[^>]*class="[^"]*(?:job-description|jobDescriptionText|description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:job-description|jobDescriptionText|description)[^"]*"[^>]*>([\s\S]*?)<\/section>/i,
    /<div[^>]*id="[^"]*(?:job-description|jobDescriptionText|description)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*id="[^"]*(?:job-description|jobDescriptionText|description)[^"]*"[^>]*>([\s\S]*?)<\/section>/i
  ];
  
  for (const pattern of patterns) {
    const match = cleanedHtml.match(pattern);
    if (match && match[1]) {
      jobDescriptionContainer = match[1];
      break;
    }
  }
  
  if (!jobDescriptionContainer) {
    // If no specific container found, look for larger content areas
    const contentMatches = cleanedHtml.match(/<div[^>]*class="[^"]*(?:content|main|body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (contentMatches && contentMatches[1]) {
      jobDescriptionContainer = contentMatches[1];
    }
  }
  
  if (!jobDescriptionContainer) {
    return null;
  }
  
  // Convert HTML to plain text
  const plainText = jobDescriptionContainer
    .replace(/<[^>]*>/g, ' ') // Replace HTML tags with spaces
    .replace(/&nbsp;/g, ' ')  // Replace &nbsp; with spaces
    .replace(/\s+/g, ' ')     // Replace multiple spaces with single space
    .trim();
  
  return plainText;
}
