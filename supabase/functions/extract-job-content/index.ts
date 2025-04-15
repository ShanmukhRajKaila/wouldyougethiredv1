
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { extractJobDescriptionWithCheerio, extractJobDescription, extractMBAExchangeJobDescription } from "./job-description-extractor.ts";
import { extractCompanyNameWithCheerio, extractCompanyName, extractFromDomain, cleanCompanyName } from "./company-name-extractor.ts";
import { extractJobTitleWithCheerio, extractJobTitle } from "./job-title-extractor.ts";
import { convertHtmlToText, detectContentPatterns, countJobKeywords } from "./html-utils.ts";

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

    // Check if this is a LinkedIn login page
    const requiresLogin = (html.includes('Please log in to continue') || 
                         html.includes('Sign in') || 
                         html.includes('join now') || 
                         html.includes('Create an account')) && 
                         html.includes('linkedin.com');
    
    // Load HTML with Cheerio for better parsing
    const $ = cheerio.load(html);
    
    // Enhanced extraction with Cheerio
    const companyName = extractCompanyNameWithCheerio($, url) || extractCompanyName(html, url);
    const jobTitle = extractJobTitleWithCheerio($, url) || extractJobTitle(html, url);
    
    // Extract job description with Cheerio first, fall back to regex if needed
    let jobDescription = extractJobDescriptionWithCheerio($, url);
    
    // Special handling for MBA Exchange website
    if (!jobDescription && url.includes('mba-exchange.com')) {
      jobDescription = extractMBAExchangeJobDescription(html, debug);
    } 
    
    // If Cheerio extraction failed, try generic regex methods
    if (!jobDescription) {
      jobDescription = extractJobDescription(html, url, debug);
    }

    // For debugging: return more info about the extraction process
    let debugInfo = {};
    if (debug) {
      debugInfo = {
        htmlLength: html.length,
        extractionDomainInfo: new URL(url).hostname,
        detectedPatterns: detectContentPatterns(html),
        cheerioUsed: true,
        requiresLogin
      };
    }

    return new Response(
      JSON.stringify({ 
        companyName: companyName || null, 
        jobDescription: jobDescription || null,
        jobTitle: jobTitle || null,
        debug: debug ? debugInfo : undefined,
        requiresLogin
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
