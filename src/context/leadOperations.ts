
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Company, AnalysisResult } from './types';

export const saveLeadInfo = async (
  userName: string, 
  userEmail: string
): Promise<string | null> => {
  try {
    if (!userName || !userEmail) {
      toast.error('Please provide your name and email');
      return null;
    }

    const { data, error } = await supabase
      .from('leads')
      .insert([{ name: userName, email: userEmail }])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving lead:', error);
      toast.error('Failed to save your information');
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Exception saving lead:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
};

export const saveJobDescription = async (
  leadId: string,
  jobDescription: string,
  selectedCompany: Company | null
): Promise<string | null> => {
  try {
    if (!jobDescription) {
      toast.error('Please provide a job description');
      return null;
    }

    const { data, error } = await supabase
      .from('job_descriptions')
      .insert([{ 
        lead_id: leadId, 
        company: selectedCompany?.name || null, 
        description: jobDescription 
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving job description:', error);
      toast.error('Failed to save job description');
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Exception saving job description:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
};

export const saveResume = async (
  leadId: string,
  resumeFile: File | null
): Promise<string | null> => {
  try {
    if (!resumeFile) {
      toast.error('Please upload a resume');
      return null;
    }

    const fileExt = resumeFile.name.split('.').pop();
    const filePath = `${leadId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, resumeFile);

    if (uploadError) {
      console.error('Error uploading resume:', uploadError);
      toast.error('Failed to upload resume');
      return null;
    }

    const { data, error } = await supabase
      .from('resumes')
      .insert([{ 
        lead_id: leadId, 
        file_name: resumeFile.name, 
        file_path: filePath 
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving resume metadata:', error);
      toast.error('Failed to save resume information');
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Exception saving resume:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
};

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
