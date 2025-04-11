
import { supabase } from '@/integrations/supabase/client';

interface ExtractionResult {
  companyName: string | null;
  jobDescription: string | null;
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
            browserHeaders: true
          }
        }
      });

      if (error) {
        console.error('Error calling extract-job-content function:', error);
        throw new Error(error.message || 'Failed to extract content from URL');
      }

      // Log the extraction results for debugging
      console.log('Extraction results:', data);
      
      let companyName = data.companyName;
      
      // If the extracted company name is "View" (which is likely incorrect from LinkedIn),
      // or if no company name was found, try our URL-based extraction as fallback
      if (!companyName || companyName === "View") {
        companyName = this.extractCompanyFromUrl(url);
      }
      
      // For LinkedIn, do additional parsing of the job description to find company name
      if (isLinkedIn && data.jobDescription && (!companyName || companyName === "View")) {
        companyName = this.extractCompanyFromJobDescription(data.jobDescription);
      }
      
      // Return the extracted data, even if partial
      return {
        companyName: companyName || null,
        jobDescription: data.jobDescription || null,
        error: (!companyName && !data.jobDescription) ? 
               'Could not extract complete information from the provided URL' : 
               undefined
      };
    } catch (error) {
      console.error('Error extracting content from URL:', error);
      return { 
        companyName: null, 
        jobDescription: null,
        error: error instanceof Error ? error.message : 'Failed to extract content from the provided URL'
      };
    }
  }
  
  // Extract company name from job description for cases when it's mentioned there
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
  
  // Helper method to extract company name from URL as a fallback
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
  
  // Format company name to be more readable
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
