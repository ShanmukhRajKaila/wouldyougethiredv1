import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";
import { convertHtmlToText, countJobKeywords } from "./html-utils.ts";

/**
 * Extract job description using Cheerio
 */
export function extractJobDescriptionWithCheerio($: cheerio.CheerioAPI, url: string): string | null {
  const domain = new URL(url).hostname.toLowerCase();
  
  // Special handling for MBA Exchange
  if (domain.includes('mbaexchange') || domain.includes('mba-exchange')) {
    return extractMBAExchangeJobDescription($);
  }
  
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
 * Specialized extraction function for MBA Exchange website
 */
export function extractMBAExchangeJobDescription($: cheerio.CheerioAPI): string | null {
  console.log("Using specialized MBA Exchange extraction method");
  
  // First look for specific MBA Exchange job content structure
  const jobDetailsTable = $('table.jobdetailtable');
  if (jobDetailsTable.length) {
    const tableText = jobDetailsTable.text().trim();
    if (tableText.length > 300) {
      return tableText;
    }
  }
  
  // Look for the main job content div (improved selector)
  const jobContent = $('.jobscontent, .job-content, .jd').text().trim();
  if (jobContent && jobContent.length > 300) {
    return jobContent;
  }
  
  // Check for tbody that has job description content
  const descriptionTbody = $('tbody:contains("Job Description"), tbody:contains("Position Description")');
  if (descriptionTbody.length) {
    const tbodyText = descriptionTbody.text().trim();
    if (tbodyText.length > 300) {
      // Filter out login/register links by checking for job-related content
      if (tbodyText.match(/experience|requirements|responsibilities|qualifications|skills|role/gi)) {
        return tbodyText;
      }
    }
  }
  
  // Try to find specific job details in a table
  const jobTable = $('table:contains("Job Description"), table:contains("Position Description")');
  if (jobTable.length) {
    const tableContent = jobTable.text().trim();
    if (tableContent.length > 300) {
      return tableContent;
    }
  }
  
  // Look for containers with job-related content
  const jobSections = [
    'Job Description',
    'Position Description', 
    'Responsibilities', 
    'Requirements', 
    'Qualifications'
  ];
  
  for (const section of jobSections) {
    // Try to find section headers
    const header = $(`h1:contains("${section}"), h2:contains("${section}"), h3:contains("${section}"), h4:contains("${section}")`);
    if (header.length) {
      // Get the parent and try to extract content
      const parentContent = header.parent().text().trim();
      if (parentContent.length > 300) {
        return parentContent;
      }
    }
    
    // Look for TD cells containing section headers
    const tdHeader = $(`td:contains("${section}")`);
    if (tdHeader.length) {
      const row = tdHeader.closest('tr');
      // Get the next row that might contain the actual content
      const contentRow = row.next('tr');
      if (contentRow.length) {
        const content = contentRow.text().trim();
        if (content.length > 300) {
          return content;
        }
      }
      
      // Also try the next TD cell that might contain the content
      const nextCell = tdHeader.next('td');
      if (nextCell.length) {
        const content = nextCell.text().trim();
        if (content.length > 300) {
          return content;
        }
      }
    }
  }
  
  // Try to find job-related content in any TD cell that's not tiny
  $('td').each((_, element) => {
    const content = $(element).text().trim();
    if (content.length > 500) {
      // Check for job-related keywords
      const jobKeywords = /experience|responsibilities|requirements|qualifications|skills|role/gi;
      if (content.match(jobKeywords) && 
          !content.match(/login|register|password|subscription|sign\s*in/gi)) {
        return content;
      }
    }
  });
  
  // Final attempt - try to find the job description in any content that contains job keywords
  let bestContent = { text: "", score: 0 };
  
  $('div, td, section').each((_, element) => {
    const content = $(element).text().trim();
    if (content.length > 300 && content.length < 5000) {
      // Score based on presence of job-related keywords and absence of login keywords
      let score = 0;
      
      const jobKeywords = ['responsibilities', 'requirements', 'qualifications', 'experience', 'skills', 'role'];
      for (const keyword of jobKeywords) {
        if (content.toLowerCase().includes(keyword)) {
          score += 10;
        }
      }
      
      const loginKeywords = ['login', 'register', 'password', 'sign in', 'create account'];
      for (const keyword of loginKeywords) {
        if (content.toLowerCase().includes(keyword)) {
          score -= 15; // Penalize login content heavily
        }
      }
      
      if (score > bestContent.score) {
        bestContent = { text: content, score };
      }
    }
  });
  
  if (bestContent.score >= 20) {
    return bestContent.text;
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
  
  // Special handling for MBA Exchange
  if (domain.includes('mbaexchange') || domain.includes('mba-exchange')) {
    // Use dedicated pattern matching for MBA Exchange
    return extractMBAExchangeJobDescriptionFromHTML(cleanedHtml, debug);
  }
  
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

/**
 * Special extraction function for MBA Exchange specifically from raw HTML
 */
function extractMBAExchangeJobDescriptionFromHTML(html: string, debug = false): string | null {
  if (debug) {
    console.log("Using specialized MBA Exchange HTML extraction method");
  }
  
  // Target the main job details table
  const jobDetailsPattern = /<table[^>]*class="[^"]*jobdetailtable[^"]*"[^>]*>([\s\S]*?)<\/table>/i;
  const jobDetailsMatch = html.match(jobDetailsPattern);
  
  if (jobDetailsMatch && jobDetailsMatch[1]) {
    const jobDetailsContent = convertHtmlToText(jobDetailsMatch[1]);
    
    // Validate that this actually looks like job content and not login garbage
    if (jobDetailsContent.length > 300 && 
        jobDetailsContent.match(/experience|responsibilities|requirements|qualifications|skills/gi) &&
        !jobDetailsContent.match(/login|register|password|subscription|sign in/gi)) {
      return jobDetailsContent;
    }
  }
  
  // Try to find the job content in specific table rows that contain job details
  const tableRowPattern = /<tr[^>]*>\s*<td[^>]*>[^<]*(?:job\s*description|position\s*description|responsibilities|requirements)[^<]*<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<\/tr>/gi;
  let match;
  let bestRowContent = { text: "", length: 0 };
  
  while ((match = tableRowPattern.exec(html)) !== null) {
    if (match[1]) {
      const content = convertHtmlToText(match[1]);
      if (content.length > 200 && content.length > bestRowContent.length) {
        bestRowContent = { text: content, length: content.length };
      }
    }
  }
  
  if (bestRowContent.text) {
    return bestRowContent.text;
  }
  
  // Try to find a job detail section
  const jobContentPattern = /<div[^>]*class="[^"]*(?:jobscontent|job-content|jd)[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
  const jobContentMatch = html.match(jobContentPattern);
  
  if (jobContentMatch && jobContentMatch[1]) {
    const content = convertHtmlToText(jobContentMatch[1]);
    if (content.length > 300) {
      return content;
    }
  }
  
  // As a last resort, look for tables with substantial job-related content
  const tablePattern = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  let tableMatch;
  let bestTableContent = { text: "", score: 0 };
  
  while ((tableMatch = tablePattern.exec(html)) !== null) {
    if (tableMatch[1]) {
      const content = convertHtmlToText(tableMatch[1]);
      if (content.length > 300) {
        // Score based on job-related terms
        const jobTerms = ['experience', 'responsibilities', 'requirements', 'qualifications', 'skills', 'job description'];
        let score = 0;
        
        for (const term of jobTerms) {
          const regex = new RegExp(term, 'gi');
          const matches = content.match(regex);
          if (matches) {
            score += matches.length * 10;
          }
        }
        
        // Penalize login/register content
        const loginTerms = ['login', 'sign in', 'register', 'password'];
        for (const term of loginTerms) {
          if (content.toLowerCase().includes(term)) {
            score -= 25;
          }
        }
        
        if (score > bestTableContent.score) {
          bestTableContent = { text: content, score };
        }
      }
    }
  }
  
  if (bestTableContent.score > 20) {
    return bestTableContent.text;
  }
  
  return null;
}

/**
 * Validate if the extracted text looks like a job description - LESS STRICT VERSION
 */
export function validateJobDescription(text: string): boolean {
  if (!text || text.length < 100) return false;
  
  // Check for obvious non-job description content only
  const invalidPatterns = [
    /404 not found/i,
    /page\s*not\s*found/i,
    /access\s*denied/i,
  ];
  
  // If more than one invalid pattern matches, it's likely not a job description
  const matchCount = invalidPatterns.filter(pattern => pattern.test(text)).length;
  if (matchCount >= 2) return false;
  
  // Most content longer than 100 chars that's not an error page is probably valid
  return true;
}

/**
 * Clean and format job description text
 */
function cleanDescription(text: string): string {
  if (!text) return "";
  
  const cleaned = text
    .replace(/\s+/g, ' ') // Normalize whitespace
    .replace(/\n+/g, '\n') // Normalize line breaks
    .replace(/\.(\w)/g, '. $1') // Add space after periods
    .replace(/\n +/g, '\n') // Remove leading spaces after line breaks
    .replace(/\n\n+/g, '\n\n') // Convert multiple line breaks to double
    .replace(/([.!?])\s+/g, '$1\n') // Add line breaks after sentences for readability
    .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
    .trim();
    
  // Final validation
  if (validateJobDescription(cleaned)) {
    return cleaned;
  } else {
    console.log("Extracted content doesn't seem to be a valid job description");
    return ""; // Return empty if validation fails
  }
}
