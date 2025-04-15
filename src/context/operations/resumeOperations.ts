
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
