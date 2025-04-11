
import { supabase } from '@/integrations/supabase/client';

interface ExtractionResult {
  companyName: string | null;
  jobDescription: string | null;
  jobTitle?: string | null;
  error?: string;
}

export class UrlExtractor {
  // Extract job details from a URL
  static async extractFromUrl(url: string): Promise<ExtractionResult> {
    try {
      console.log('Extracting content from URL:', url);
      
      // First check if this is a LinkedIn URL to apply special extraction
      const isLinkedIn = url.includes('linkedin.com');
      
      // Use supabase client to call our edge function with additional headers
      const { data, error } = await supabase.functions.invoke('extract-job-content', {
        body: { 
          url,
          options: {
            // Pass additional options for extraction
            followRedirects: true,
            extractLinkedInCompanyName: isLinkedIn,
            // Add browser-like headers to avoid being blocked
            browserHeaders: true,
            // Add debug flag to get more information
            debug: true
          }
        }
      });

      if (error) {
        console.error('Error calling extract-job-content function:', error);
        throw new Error(error.message || 'Failed to extract content from URL');
      }

      // Log the extraction results for debugging
      console.log('Extraction results (detailed):', data);
      
      // Return the extracted data, prioritizing job description
      return {
        companyName: data.companyName || null,
        jobDescription: data.jobDescription || null,
        jobTitle: data.jobTitle || null,
        error: (!data.jobDescription) ? 
               'Could not extract job description from the provided URL' : 
               undefined
      };
    } catch (error) {
      console.error('Error extracting content from URL:', error);
      return { 
        companyName: null, 
        jobDescription: null,
        jobTitle: null,
        error: error instanceof Error ? error.message : 'Failed to extract content from the provided URL'
      };
    }
  }
  
  // Helper method that stays the same
  private static extractCompanyFromJobDescription(jobDescription: string): string | null {
    if (!jobDescription) return null;
    
    // Common patterns for company introductions in job descriptions
    const patterns = [
      /About ([\w\s&\-,.]+?)(?:\.|is|\n|seeking)/i,    // "About Company Name." or "About Company Name is"
      /([\w\s&\-,.]+?) is (?:a|the|an|looking|seeking)/i,   // "Company Name is a..."
      /At ([\w\s&\-,.]+?),/i,                         // "At Company Name,"
      /Join (?:the )?([\w\s&\-,.]+?) team/i,          // "Join the Company Name team"
      /working (?:at|with) ([\w\s&\-,.]+?)[,\.\n]/i,  // "working at Company Name."
      /([\w\s&\-,.]+?) (?:was founded|is hiring)/i    // "Company Name was founded" or "is hiring"
    ];
    
    for (const pattern of patterns) {
      const matches = jobDescription.match(pattern);
      if (matches && matches[1]) {
        const candidate = matches[1].trim();
        // Validate the extracted company name (min 2 chars, max 50 chars, not generic terms)
        if (candidate.length > 1 && candidate.length < 50 && 
            !['the company', 'our company', 'this role', 'this position'].includes(candidate.toLowerCase())) {
          return candidate;
        }
      }
    }
    
    return null;
  }
  
  // Helper method that stays the same
  private static extractCompanyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // For LinkedIn URLs
      if (hostname.includes('linkedin.com')) {
        // Example: https://www.linkedin.com/company/acme-corp/
        if (url.includes('/company/')) {
          const companyPath = url.split('/company/')[1].split('/')[0];
          return this.formatCompanyName(companyPath);
        }
        
        // For job postings, find "at Company" in the URL
        if (url.includes('/jobs/view/')) {
          // Check if there's a company name in the URL path
          const atCompanyMatch = urlObj.pathname.match(/at-([\w-]+)/i);
          if (atCompanyMatch && atCompanyMatch[1]) {
            return this.formatCompanyName(atCompanyMatch[1]);
          }
          
          // Check for company in query parameters
          const params = new URLSearchParams(urlObj.search);
          const referer = params.get('referer');
          if (referer && referer.includes('at=')) {
            const company = referer.split('at=')[1].split('&')[0];
            return this.formatCompanyName(company);
          }
        }
      } 
      
      // For other job boards and company websites
      // Remove www. and extract domain name
      const domain = hostname.replace('www.', '').split('.')[0];
      if (!['linkedin', 'indeed', 'glassdoor', 'monster', 'jobs'].includes(domain)) {
        return this.formatCompanyName(domain);
      }
      
      return null;
    } catch (e) {
      console.error('Error parsing URL:', e);
      return null;
    }
  }
  
  // Helper method that stays the same
  private static formatCompanyName(name: string): string {
    if (!name) return '';
    
    // Replace hyphens and underscores with spaces
    let formatted = name.replace(/[-_]/g, ' ');
    
    // Capitalize words
    formatted = formatted.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
      
    return formatted;
  }
}

// Export the extractBulletPoints function as a standalone function
export const extractBulletPoints = (resumeText: string): string[] => {
  if (!resumeText) return [];
  
  const bullets: string[] = [];
  
  // Pattern 1: Look for bullet points after line breaks
  const pattern1 = /[\n\r][\s]*[•\-\*\[\]\>\+◦◆◇‣⁃⁌⁍][\s]+(.*?)(?=[\n\r]|$)/g;
  let match;
  while ((match = pattern1.exec(resumeText)) !== null) {
    if (match[1] && match[1].trim().length > 10) {
      bullets.push(match[1].trim());
    }
  }
  
  // Pattern 2: Look for sequences of text that appear to be bullet points based on structure
  if (bullets.length < 3) {
    const lines = resumeText.split(/[\n\r]+/);
    let experienceSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect experience section headers
      if (/^(?:experience|work experience|employment|professional experience)/i.test(line)) {
        experienceSection = true;
        continue;
      }
      
      // In experience sections, look for bullet-like items (short phrases with action verbs)
      if (experienceSection && 
          line.length > 20 && 
          line.length < 500 && 
          /^(?:Led|Developed|Created|Managed|Built|Designed|Implemented|Increased|Reduced|Achieved|Improved|Analyzed)/i.test(line)) {
        bullets.push(line);
      }
      
      // If we found a new section header, exit experience section
      if (experienceSection && /^(?:education|skills|projects|publications|certifications|languages)/i.test(line)) {
        experienceSection = false;
      }
    }
  }
  
  // Deduplicate bullets
  return [...new Set(bullets)];
};
