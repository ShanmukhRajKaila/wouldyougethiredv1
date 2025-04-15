
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { convertHtmlToText, countJobKeywords } from "./html-utils.ts";

/**
 * Extract job description content from HTML
 */
export function extractJobDescriptionContent(html: string, url: string): string | null {
  try {
    // Load HTML with Cheerio
    const $ = cheerio.load(html);
    
    // Common job description selectors
    const selectors = [
      '.job-description',
      '.jobDescriptionText',
      '.description__text',
      '.description',
      '.job-details',
      '#job-description',
      '#jobDescriptionText',
      '[data-automation="jobDescription"]',
      '[data-testid="job-description"]',
      '.jobs-description',
      '.jobs-box__html-content',
      '.show-more-less-html',
      'section.description'
    ];
    
    // Try each selector
    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length) {
        return convertHtmlToText(element.html() || "");
      }
    }
    
    // Try article or main content
    const contentSelectors = ['article', 'main', '.content', '.main', '.job', '.body'];
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().length > 300) {
        return convertHtmlToText(element.html() || "");
      }
    }
    
    // Try to find structured data in JSON-LD format
    const jsonLdScripts = $('script[type="application/ld+json"]');
    let jsonLdContent = null;
    
    jsonLdScripts.each((_, element) => {
      if (jsonLdContent) return;
      
      try {
        const json = JSON.parse($(element).html() || "");
        
        if (json.description) {
          jsonLdContent = json.description;
          return false; // Break the loop
        }
        
        if (json["@graph"]) {
          for (const item of json["@graph"]) {
            if (item.description) {
              jsonLdContent = item.description;
              return false; // Break the loop
            }
          }
        }
      } catch (e) {
        // Continue if JSON parsing fails
      }
    });
    
    if (jsonLdContent) {
      return typeof jsonLdContent === 'string' ? convertHtmlToText(jsonLdContent) : JSON.stringify(jsonLdContent);
    }
    
    // Look for large div blocks with job-related content
    let bestMatch = { text: "", score: 0 };
    
    $('div').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 300) {
        const keywordCount = countJobKeywords(text);
        const score = keywordCount * 5 + Math.min(text.length / 100, 50);
        
        if (score > bestMatch.score) {
          bestMatch = { text, score };
        }
      }
    });
    
    if (bestMatch.score > 20) {
      return bestMatch.text;
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting job description from ${url}:`, error);
    return null;
  }
}
