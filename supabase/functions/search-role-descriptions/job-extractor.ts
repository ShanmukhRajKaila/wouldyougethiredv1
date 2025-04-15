
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { convertHtmlToText, countJobKeywords } from "./html-utils.ts";

/**
 * Enhanced function to extract job description content from HTML with more advanced selectors
 */
export function extractJobDescriptionContent(html: string, url: string): string | null {
  try {
    // Load HTML with Cheerio
    const $ = cheerio.load(html);
    
    // Check URL for specific site patterns
    const domain = new URL(url).hostname.toLowerCase();
    
    // === SITE-SPECIFIC EXTRACTION STRATEGIES ===
    
    // LinkedIn
    if (domain.includes('linkedin.com')) {
      return extractLinkedInJobDescription($, html);
    }
    
    // Indeed
    if (domain.includes('indeed.com')) {
      return extractIndeedJobDescription($, html);
    }
    
    // Glassdoor
    if (domain.includes('glassdoor.com')) {
      return extractGlassdoorJobDescription($, html);
    }
    
    // Singapore Career Sites
    if (domain.includes('mycareersfuture.gov.sg')) {
      return extractMyCareersFutureJobDescription($, html);
    }
    
    if (domain.includes('jobstreet.com.sg') || domain.includes('jobstreet.com')) {
      return extractJobstreetJobDescription($, html);
    }
    
    if (domain.includes('workclass.co')) {
      return extractWorkclassJobDescription($, html);
    }
    
    // === GENERIC EXTRACTION STRATEGIES ===
    
    // Try common job description selectors
    const commonSelectors = [
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
      'section.description',
      '.vjs-highlight',
      '.job-desc',
      '[itemprop="description"]',
      '.listing-content'
    ];
    
    for (const selector of commonSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().trim().length > 100) {
        return cleanDescription(element.text());
      }
    }
    
    // Try article, main or content sections
    const contentSelectors = ['article', 'main', '.content', '.main', '.job', '.body'];
    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length && element.text().length > 300) {
        return cleanDescription(element.text());
      }
    }
    
    // Try to find structured data in JSON-LD format
    const jsonLdContent = extractFromJsonLd($);
    if (jsonLdContent) {
      return cleanDescription(jsonLdContent);
    }
    
    // Look for large div blocks with job-related content
    const bestDivText = findBestDivByKeywords($);
    if (bestDivText) {
      return cleanDescription(bestDivText);
    }
    
    // Last resort: Try extracting from meta description
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription && metaDescription.length > 100) {
      return cleanDescription(metaDescription);
    }
    
    // Finally, look in the entire body with content-based scoring
    const bodyText = $('body').text();
    if (bodyText && bodyText.length > 500) {
      // Try to find a section that looks like a job description
      const sections = splitIntoSections(bodyText);
      let bestSection = { text: "", score: 0 };
      
      for (const section of sections) {
        if (section.length > 200 && section.length < 5000) {
          const keywordCount = countJobKeywords(section);
          const score = keywordCount * 5 + Math.min(section.length / 100, 50);
          
          if (score > bestSection.score && score > 30) {
            bestSection = { text: section, score };
          }
        }
      }
      
      if (bestSection.score > 30) {
        return cleanDescription(bestSection.text);
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error extracting job description from ${url}:`, error);
    return null;
  }
}

/**
 * Extract job description from LinkedIn
 */
function extractLinkedInJobDescription($: cheerio.CheerioAPI, html: string): string | null {
  // LinkedIn specific selectors
  const selectors = [
    '.show-more-less-html',
    '.description__text',
    'section.description',
    '.job-description',
    '.jobs-box__html-content'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      return cleanDescription(element.text());
    }
  }
  
  // Try extracting from the HTML directly if selectors fail
  const linkedInPattern = /<div[^>]*class="[^"]*show-more-less-html[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
  const match = html.match(linkedInPattern);
  if (match && match[1]) {
    return cleanDescription(convertHtmlToText(match[1]));
  }
  
  return null;
}

/**
 * Extract job description from Indeed
 */
function extractIndeedJobDescription($: cheerio.CheerioAPI, html: string): string | null {
  // Indeed specific selectors
  const selectors = [
    '#jobDescriptionText',
    '.jobsearch-jobDescriptionText',
    '#job-content',
    '#jobDescription'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      return cleanDescription(element.text());
    }
  }
  
  // Try extracting from the HTML directly if selectors fail
  const indeedPattern = /<div[^>]*id="jobDescriptionText"[^>]*>([\s\S]*?)<\/div>/i;
  const match = html.match(indeedPattern);
  if (match && match[1]) {
    return cleanDescription(convertHtmlToText(match[1]));
  }
  
  return null;
}

/**
 * Extract job description from Glassdoor
 */
function extractGlassdoorJobDescription($: cheerio.CheerioAPI, html: string): string | null {
  // Glassdoor specific selectors
  const selectors = [
    '.jobDescriptionContent',
    '.desc',
    '[data-test="description"]',
    '.jobDesc'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      return cleanDescription(element.text());
    }
  }
  
  return null;
}

/**
 * Extract job description from MyCareersFuture (Singapore)
 */
function extractMyCareersFutureJobDescription($: cheerio.CheerioAPI, html: string): string | null {
  // MyCareersFuture specific selectors
  const selectors = [
    '[data-testid="job-description"]',
    '.job_description',
    '.job-description',
    '.jd-content'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      return cleanDescription(element.text());
    }
  }
  
  // For MyCareersFuture, also look for section headers
  const jobDetailsSection = $('h3:contains("Job Description")').next();
  if (jobDetailsSection.length && jobDetailsSection.text().length > 100) {
    return cleanDescription(jobDetailsSection.text());
  }
  
  // Try extracting all content within a main container
  const mainContent = $('.job-details-content').text();
  if (mainContent && mainContent.length > 200) {
    return cleanDescription(mainContent);
  }
  
  return null;
}

/**
 * Extract job description from Jobstreet
 */
function extractJobstreetJobDescription($: cheerio.CheerioAPI, html: string): string | null {
  // Jobstreet specific selectors
  const selectors = [
    '[data-automation="jobDescription"]',
    '.job-description',
    '.vjs-highlight',
    '#job-description'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      return cleanDescription(element.text());
    }
  }
  
  // Look for section with job info
  const jobInfoSection = $('h2:contains("Job Description")').parent().text();
  if (jobInfoSection && jobInfoSection.length > 200) {
    return cleanDescription(jobInfoSection);
  }
  
  return null;
}

/**
 * Extract job description from Workclass.co
 */
function extractWorkclassJobDescription($: cheerio.CheerioAPI, html: string): string | null {
  // Workclass.co specific selectors
  const selectors = [
    '.listing-content',
    '.job-description-content',
    '[data-testid="job-details"]'
  ];
  
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length && element.text().trim().length > 100) {
      return cleanDescription(element.text());
    }
  }
  
  return null;
}

/**
 * Extract job description from JSON-LD structured data
 */
function extractFromJsonLd($: cheerio.CheerioAPI): string | null {
  const jsonLdScripts = $('script[type="application/ld+json"]');
  
  for (let i = 0; i < jsonLdScripts.length; i++) {
    try {
      const scriptContent = $(jsonLdScripts[i]).html();
      if (!scriptContent) continue;
      
      const json = JSON.parse(scriptContent);
      
      // Look for job posting schema
      if (json['@type'] === 'JobPosting' && json.description) {
        return typeof json.description === 'string' ? 
          convertHtmlToText(json.description) : 
          JSON.stringify(json.description);
      }
      
      // Check for nested structures
      if (json['@graph']) {
        for (const item of json['@graph']) {
          if (item['@type'] === 'JobPosting' && item.description) {
            return typeof item.description === 'string' ? 
              convertHtmlToText(item.description) : 
              JSON.stringify(item.description);
          }
        }
      }
    } catch (e) {
      // Continue if JSON parsing fails
      continue;
    }
  }
  
  return null;
}

/**
 * Find the best div containing job description based on keywords
 */
function findBestDivByKeywords($: cheerio.CheerioAPI): string | null {
  let bestMatch = { text: "", score: 0 };
  
  $('div').each((_, element) => {
    const text = $(element).text().trim();
    if (text.length > 300 && text.length < 5000) {
      const keywordCount = countJobKeywords(text);
      const score = keywordCount * 5 + Math.min(text.length / 100, 50);
      
      if (score > bestMatch.score) {
        bestMatch = { text, score };
      }
    }
  });
  
  if (bestMatch.score > 30) {
    return bestMatch.text;
  }
  
  return null;
}

/**
 * Split text into logical sections
 */
function splitIntoSections(text: string): string[] {
  // Split by multiple newlines or headers
  return text
    .split(/(?:\n\s*\n\s*\n|\n\s*\n|#{1,6}\s+)/)
    .filter(section => section.trim().length > 0);
}

/**
 * Clean and format job description text
 */
function cleanDescription(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, '\n') // Normalize line breaks
    .replace(/\.(\w)/g, '. $1') // Add space after periods
    .replace(/\n +/g, '\n') // Remove leading spaces after line breaks
    .replace(/\n\n+/g, '\n\n') // Convert multiple line breaks to double
    .replace(/([.!?])\s+/g, '$1\n') // Add line breaks after sentences for readability
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
    .trim();
}
