
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoleDescription {
  id: string;
  role: string;
  custom_role?: string;
  description: string;
  created_at: string;
}

/**
 * Save a role-based job description to the database
 */
export const saveRoleDescription = async (
  leadId: string,
  role: string,
  customRole: string | null,
  description: string
): Promise<string | null> => {
  try {
    if (!description) {
      toast.error('Please provide a role description');
      return null;
    }

    const { data, error } = await supabase
      .from('role_descriptions')
      .insert([{ 
        lead_id: leadId, 
        role: role,
        custom_role: customRole || null,
        description: description 
      }])
      .select('id')
      .single();

    if (error) {
      console.error('Error saving role description:', error);
      toast.error('Failed to save role description');
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error('Exception saving role description:', error);
    toast.error('An unexpected error occurred');
    return null;
  }
};

/**
 * Fetch a role description by ID
 */
export const getRoleDescriptionById = async (id: string): Promise<RoleDescription | null> => {
  try {
    const { data, error } = await supabase
      .from('role_descriptions')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching role description:', error);
      return null;
    }

    return data as RoleDescription;
  } catch (error) {
    console.error('Exception fetching role description:', error);
    return null;
  }
};

/**
 * Search for role descriptions in the web
 */
export const searchRoleDescriptions = async (
  role: string,
  customRole?: string
): Promise<{ 
  consolidatedDescription: string;
  jobDescriptions: string[];
  jobUrlsSearched: number;
  successfulExtractions: number;
} | null> => {
  try {
    const { data, error } = await supabase.functions.invoke('search-role-descriptions', {
      body: { 
        role,
        customRole: customRole || undefined
      }
    });

    if (error) {
      console.error('Error searching role descriptions:', error);
      toast.error('Failed to search for role descriptions');
      return null;
    }

    return data;
  } catch (error) {
    console.error('Exception searching role descriptions:', error);
    toast.error('An unexpected error occurred during role search');
    return null;
  }
};
