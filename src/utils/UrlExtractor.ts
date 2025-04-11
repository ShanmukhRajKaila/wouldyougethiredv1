
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
      
      // Use supabase client to call our edge function with additional headers
      const { data, error } = await supabase.functions.invoke('extract-job-content', {
        body: { 
          url,
          options: {
            // Pass additional options for extraction
            followRedirects: true,
            extractLinkedInCompanyName: true
          }
        }
      });

      if (error) {
        console.error('Error calling extract-job-content function:', error);
        throw new Error(error.message || 'Failed to extract content from URL');
      }

      // Log the extraction results for debugging
      console.log('Extraction results:', data);
      
      // Return the extracted data, even if partial
      return {
        companyName: data.companyName || null,
        jobDescription: data.jobDescription || null,
        error: (!data.companyName && !data.jobDescription) ? 
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
}
