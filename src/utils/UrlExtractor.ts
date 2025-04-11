
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
      
      // First, attempt to extract company name from URL for fallback
      const urlCompanyName = this.extractCompanyFromUrl(url);
      
      // Use supabase client to call our edge function with additional headers
      const { data, error } = await supabase.functions.invoke('extract-job-content', {
        body: { 
          url,
          options: {
            // Pass additional options for extraction
            followRedirects: true,
            extractLinkedInCompanyName: true,
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
      
      // Use fallback company name from URL if none was extracted
      const companyName = data.companyName || urlCompanyName || null;
      
      // Return the extracted data, even if partial
      return {
        companyName: companyName,
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
        
        // For job postings, try to extract from the path
        if (url.includes('/jobs/view/')) {
          // Sometimes company name is in the URL or query parameters
          const pathParts = urlObj.pathname.split('/');
          for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] === 'at' && i + 1 < pathParts.length) {
              return this.formatCompanyName(pathParts[i + 1]);
            }
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
