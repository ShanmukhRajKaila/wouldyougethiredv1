
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { convertHtmlToText, countJobKeywords } from "./html-utils.ts";

/**
 * Extract job description using Cheerio
 */
export function extractJobDescriptionWithCheerio($: cheerio.CheerioAPI, url: string): string | null {
  const domain = new URL(url).hostname.toLowerCase();
  
  // Common job description selectors by site
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
    '.jobs-box__html-content'
  ];
  
  // LinkedIn specific selectors
  if (domain.includes('linkedin.com')) {
    const linkedinSelectors = [
      '.show-more-less-html',
      '.description__text',
      'section.description',
      '.job-description'
    ];
    
    for (const selector of linkedinSelectors) {
      const element = $(selector).first();
      if (element.length) {
        return element.text().trim();
      }
    }
  }
  
  // Try all common selectors
  for (const selector of selectors) {
    const element = $(selector).first();
    if (element.length) {
      return element.text().trim();
    }
  }
  
  // Try article or main content
  const contentSelectors = ['article', 'main', '.content', '.main', '.job', '.body'];
  for (const selector of contentSelectors) {
    const element = $(selector).first();
    if (element.length && element.text().length > 300) {
      return element.text().trim();
    }
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
}

/**
 * ADDED: Specialized extraction function for MBA Exchange website
 */
export function extractMBAExchangeJobDescription(html: string, debug = false): string | null {
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

/**
 * Enhanced function to extract job description with better pattern matching
 */
export function extractJobDescription(html: string, url: string, debug = false): string | null {
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
