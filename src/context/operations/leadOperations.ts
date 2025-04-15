
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
