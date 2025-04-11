
interface ExtractionResult {
  companyName: string | null;
  jobDescription: string | null;
  error?: string;
}

export class UrlExtractor {
  // Extract job details from a URL
  static async extractFromUrl(url: string): Promise<ExtractionResult> {
    try {
      // Make a request to our edge function to extract content
      const response = await fetch('https://mqvstzxrxrmgdseepwzh.supabase.co/functions/v1/extract-job-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to extract content from URL');
      }

      const extractionResult = await response.json();
      return extractionResult;
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
