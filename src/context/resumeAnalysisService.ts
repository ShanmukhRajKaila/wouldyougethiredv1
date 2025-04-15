
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AnalysisResult } from './types';

export const analyzeResume = async (
  resumeText: string, 
  jobDescription: string,
  coverLetterText?: string
): Promise<AnalysisResult | null> => {
  try {
    console.log('Calling analyze-resume edge function...');
    
    // Trim the inputs if they're too long to avoid timeouts
    const maxResumeLength = 8000;
    const maxJobDescLength = 4000;
    const maxCoverLetterLength = 6000;
    
    const trimmedResume = resumeText.length > maxResumeLength 
      ? resumeText.substring(0, maxResumeLength) + "... [trimmed for processing]" 
      : resumeText;
      
    const trimmedJobDesc = jobDescription.length > maxJobDescLength
      ? jobDescription.substring(0, maxJobDescLength) + "... [trimmed for processing]"
      : jobDescription;

    const trimmedCoverLetter = coverLetterText && coverLetterText.length > maxCoverLetterLength
      ? coverLetterText.substring(0, maxCoverLetterLength) + "... [trimmed for processing]"
      : coverLetterText;
    
    const { data: sessionData } = await supabase.auth.getSession();
    
    const response = await fetch('https://mqvstzxrxrmgdseepwzh.supabase.co/functions/v1/analyze-resume', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`,
      },
      body: JSON.stringify({
        resumeText: trimmedResume,
        jobDescription: trimmedJobDesc,
        coverLetterText: trimmedCoverLetter,
        options: {
          useFastModel: true, // Hint to use a faster model if possible
          prioritizeSpeed: true // Hint to prioritize speed over detail
        }
      }),
      // Set a longer timeout for the fetch request
      signal: AbortSignal.timeout(50000) // 50 second timeout
    });

    if (!response.ok) {
      console.error('Error response from analyze-resume:', response.status, response.statusText);
      let errorMessage = 'Failed to analyze resume';
      
      try {
        const errorData = await response.json();
        console.error('Error details:', errorData);
        errorMessage = errorData.error || errorMessage;
      } catch (parseError) {
        console.error('Could not parse error response:', parseError);
      }
      
      throw new Error(errorMessage);
    }

    const analysisResult = await response.json();
    console.log('Analysis result received:', analysisResult);
    return analysisResult as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    toast.error('Failed to analyze your resume. Please try again.');
    return null;
  }
};
