
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface RoleDescription {
  id: string;
  role: string;
  custom_role?: string;
  description: string;
  created_at: string;
}

export interface RoleSearchResult {
  consolidatedDescription: string;
  jobDescriptions: string[];
  sectionData?: Record<string, string>;
  jobUrlsSearched: number;
  successfulExtractions: number;
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
): Promise<RoleSearchResult | null> => {
  try {
    const loadingToast = toast.loading('Searching for role descriptions...');
    
    const { data, error } = await supabase.functions.invoke('search-role-descriptions', {
      body: { 
        role,
        customRole: customRole || undefined
      }
    });

    toast.dismiss(loadingToast);

    if (error) {
      console.error('Error searching role descriptions:', error);
      toast.error('Failed to search for role descriptions');
      return null;
    }

    if (data.jobDescriptions && data.jobDescriptions.length > 0) {
      toast.success(`Found ${data.jobDescriptions.length} job descriptions`);
    } else {
      toast.warning('Could not find detailed job descriptions for this role');
    }

    return data;
  } catch (error) {
    console.error('Exception searching role descriptions:', error);
    toast.error('An unexpected error occurred during role search');
    return null;
  }
};

/**
 * Convert job-based description to role-based format
 */
export const convertJobToRoleDescription = async (
  jobDescription: string
): Promise<string | null> => {
  try {
    if (!jobDescription || jobDescription.length < 100) {
      return null;
    }
    
    // Extract just the most relevant parts from the job description
    // This is a simplified approach - a more advanced implementation could use AI
    const sections: string[] = [];
    
    // Extract responsibilities section
    const responsibilitiesMatch = jobDescription.match(/(?:responsibilities|duties|what you['']ll do)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i);
    if (responsibilitiesMatch) {
      sections.push('## Key Responsibilities\n' + responsibilitiesMatch[0].replace(/responsibilities|duties|what you['']ll do/i, '').trim());
    }
    
    // Extract requirements section
    const requirementsMatch = jobDescription.match(/(?:requirements|qualifications|what you['']ll need)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i);
    if (requirementsMatch) {
      sections.push('## Requirements\n' + requirementsMatch[0].replace(/requirements|qualifications|what you['']ll need/i, '').trim());
    }
    
    // Extract skills section
    const skillsMatch = jobDescription.match(/(?:skills|expertise|what we['']re looking for)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i);
    if (skillsMatch) {
      sections.push('## Required Skills\n' + skillsMatch[0].replace(/skills|expertise|what we['']re looking for/i, '').trim());
    }
    
    // If no sections were found, return a subset of the job description
    if (sections.length === 0) {
      // Get the first 2000 characters as a fallback
      return jobDescription.substring(0, 2000) + (jobDescription.length > 2000 ? '...' : '');
    }
    
    return sections.join('\n\n');
  } catch (error) {
    console.error('Error converting job to role description:', error);
    return null;
  }
};
