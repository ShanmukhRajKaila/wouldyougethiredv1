
import * as cheerio from "https://esm.sh/cheerio@1.0.0-rc.12";

/**
 * Extract company name using Cheerio
 */
export function extractCompanyNameWithCheerio($: cheerio.CheerioAPI, url: string): string | null {
  const domain = new URL(url).hostname.toLowerCase();
  
  // LinkedIn specific selectors
  if (domain.includes('linkedin.com')) {
    const linkedinSelectors = [
      '.topcard__org-name-link',
      '.company-name',
      '[data-testid="topcard-org-name"]',
      '.jobs-unified-top-card__company-name'
    ];
    
    for (const selector of linkedinSelectors) {
      const element = $(selector).first();
      if (element.length) {
        return cleanCompanyName(element.text());
      }
    }
  }
  
  // General selectors
  const companySelectors = [
    '[data-testid="company-name"]',
    '[itemprop="hiringOrganization"]',
    '.company-name',
    '.employer-name',
    '.organization-name',
    '.hiring-organization',
    '[data-automation="jobCompany"]'
  ];
  
  for (const selector of companySelectors) {
    const element = $(selector).first();
    if (element.length) {
      return cleanCompanyName(element.text());
    }
  }
  
  // Try to find company in text patterns
  const aboutCompanySection = $(':contains("About ")').filter((_, el) => {
    const text = $(el).text();
    return /About [A-Z][a-z]+/.test(text) && text.length < 200;
  });
  
  if (aboutCompanySection.length) {
    const text = aboutCompanySection.first().text();
    const match = text.match(/About ([A-Z][a-zA-Z0-9\s&]+)(?:[\.\n]|$|\sis)/);
    if (match && match[1]) {
      return cleanCompanyName(match[1]);
    }
  }
  
  // Extract from domain if all else fails
  return extractFromDomain(url);
}

/**
 * Enhanced function to extract company name with more dynamic patterns
 */
export function extractCompanyName(html: string, url: string): string | null {
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
export function extractFromDomain(url: string): string | null {
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
export function cleanCompanyName(name: string): string {
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
