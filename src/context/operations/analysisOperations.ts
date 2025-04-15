
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AnalysisResult } from '../types';

export const saveAnalysisResults = async ({
  leadId,
  resumeId,
  jobDescriptionId,
  results
}: {
  leadId: string;
  resumeId: string;
  jobDescriptionId: string;
  results: AnalysisResult;
}): Promise<void> => {
  try {
    // Add retry logic for database operations
    const maxRetries = 3;
    let retryCount = 0;
    let success = false;
    
    while (retryCount < maxRetries && !success) {
      try {
        const { error } = await supabase
          .from('analysis_results')
          .insert([{
            lead_id: leadId,
            resume_id: resumeId,
            job_description_id: jobDescriptionId,
            match_score: results.alignmentScore,
            alignment_score: results.alignmentScore,
            verdict: results.verdict,
            strengths: results.strengths,
            weaknesses: results.weaknesses,
            recommendations: results.recommendations
          }]);

        if (error) {
          throw error;
        }
        
        success = true;
        console.log('Analysis results saved successfully');
      } catch (error: any) {
        retryCount++;
        console.error(`Error saving analysis results (attempt ${retryCount}/${maxRetries}):`, error);
        
        if (retryCount < maxRetries) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)));
        } else {
          throw error;
        }
      }
    }
  } catch (error: any) {
    console.error('Exception saving analysis results:', error);
    
    // Don't show error toast in production - just log it
    // This prevents users from seeing unexpected errors
    if (process.env.NODE_ENV === 'development') {
      toast.error('Failed to save analysis results');
    }
  }
};
