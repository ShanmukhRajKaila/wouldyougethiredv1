
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
      // Use supabase client to call our edge function
      const { data, error } = await supabase.functions.invoke('extract-job-content', {
        body: { url }
      });

      if (error) {
        console.error('Error calling extract-job-content function:', error);
        throw new Error(error.message || 'Failed to extract content from URL');
      }

      // Log the extraction results for debugging
      console.log('Extraction results:', data);
      
      if (!data.companyName && !data.jobDescription) {
        return { 
          companyName: null, 
          jobDescription: null,
          error: 'Could not extract company name or job description from the provided URL'
        };
      }

      return data as ExtractionResult;
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
