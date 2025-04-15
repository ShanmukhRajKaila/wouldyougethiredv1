
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
      console.error('Error saving analysis results:', error);
      toast.error('Failed to save analysis results');
    }
  } catch (error) {
    console.error('Exception saving analysis results:', error);
    toast.error('An unexpected error occurred');
  }
};
