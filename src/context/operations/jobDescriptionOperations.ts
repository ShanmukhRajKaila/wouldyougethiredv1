
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Company } from '../types';

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
