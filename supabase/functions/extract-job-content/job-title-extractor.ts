
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

/**
 * Extract job title using Cheerio
 */
export function extractJobTitleWithCheerio($: cheerio.CheerioAPI, url: string): string | null {
  const domain = new URL(url).hostname.toLowerCase();
  
  // Common title selectors
  const titleSelectors = [
    '[data-testid="job-title"]',
    '.job-title',
    '.jobsearch-JobInfoHeader-title',
    '.jobs-unified-top-card__job-title',
    '[itemprop="title"]',
    'h1'
  ];
  
  for (const selector of titleSelectors) {
    const element = $(selector).first();
    if (element.length) {
      const title = element.text().trim();
      // Only return if it looks like a job title (not too short or long)
      if (title.length > 3 && title.length < 100) {
        return title;
      }
    }
  }
  
  // Try the page title
  const pageTitle = $('title').text();
  if (pageTitle) {
    // Clean up title - remove site name and other common elements
    let cleanTitle = pageTitle
      .replace(/\s*[-|]\s*.+$/, '') // Remove anything after dash or pipe
      .replace(/\s*at\s+.+$/, '')   // Remove "at Company"
      .replace(/^Job:\s*/, '')      // Remove "Job:" prefix
      .replace(/^\s*[\d.,]+\s+/, '') // Remove leading numbers
      .trim();
      
    if (cleanTitle.length > 5 && cleanTitle.length < 100) {
      return cleanTitle;
    }
  }
  
  return null;
}

/**
 * Enhanced job title extraction
 */
export function extractJobTitle(html: string, url: string): string | null {
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
