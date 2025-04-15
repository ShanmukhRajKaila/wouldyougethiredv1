
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
 * Improved function to convert job-based description to role-based format
 * Uses more advanced pattern recognition and section extraction
 */
export const convertJobToRoleDescription = async (
  jobDescription: string
): Promise<string | null> => {
  try {
    if (!jobDescription || jobDescription.length < 100) {
      return null;
    }
    
    // Extract structured sections from the job description
    const sections: string[] = [];
    const sectionPatterns = [
      // Main sections commonly found in job descriptions
      {
        name: "Responsibilities",
        patterns: [
          /(?:responsibilities|duties|what you['']ll do|key responsibilities|job duties|your role|role overview|in this role|what you will do)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i,
        ],
        title: "## Key Responsibilities"
      },
      {
        name: "Requirements",
        patterns: [
          /(?:requirements|qualifications|what you['']ll need|what we['']re looking for|required skills|must have|job requirements|essential)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i,
        ],
        title: "## Requirements & Qualifications"
      },
      {
        name: "Skills",
        patterns: [
          /(?:skills|expertise|technical abilities|competencies|technical skills|soft skills|core competencies)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i,
        ],
        title: "## Required Skills"
      },
      {
        name: "Experience",
        patterns: [
          /(?:experience|background|work history|previous roles|professional experience)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i,
        ],
        title: "## Experience"
      },
      {
        name: "Education",
        patterns: [
          /(?:education|academic|degree|educational|qualification|academic requirements)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i,
        ],
        title: "## Education"
      },
      {
        name: "About",
        patterns: [
          /(?:about the role|about the position|role summary|job summary|position overview|summary of role|overview)[\s\S]*?(?=\n\n|\n[A-Z]|\n\d|$)/i,
        ],
        title: "## Role Overview"
      }
    ];
    
    // Extract each section using its patterns
    for (const section of sectionPatterns) {
      for (const pattern of section.patterns) {
        const match = jobDescription.match(pattern);
        if (match && match[0]) {
          const content = match[0].replace(new RegExp(section.patterns[0].source, 'i'), '').trim();
          if (content.length > 20) {
            sections.push(`${section.title}\n${content}`);
            break; // Found a match for this section, move to next section
          }
        }
      }
    }
    
    // If no sections were found, try to extract bullet points
    if (sections.length === 0) {
      const bulletPoints = extractBulletPoints(jobDescription);
      if (bulletPoints.length > 0) {
        sections.push('## Key Points\n' + bulletPoints.map(point => `• ${point}`).join('\n'));
      } else {
        // Get the first 2000 characters as a fallback
        return jobDescription.substring(0, 2000) + (jobDescription.length > 2000 ? '...' : '');
      }
    }
    
    return sections.join('\n\n');
  } catch (error) {
    console.error('Error converting job to role description:', error);
    return null;
  }
};

/**
 * Helper function to extract bullet points from text
 */
const extractBulletPoints = (text: string): string[] => {
  const bullets: string[] = [];
  
  // Look for bullet points in the text
  const bulletRegex = /[•\-\*\+◦◆◇‣⁃⁌⁍]\s+([^\n]+)/g;
  let match;
  while ((match = bulletRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 10) {
      bullets.push(match[1].trim());
    }
  }
  
  // Also look for numbered points
  const numberedRegex = /\d+\.\s+([^\n]+)/g;
  while ((match = numberedRegex.exec(text)) !== null) {
    if (match[1] && match[1].trim().length > 10) {
      bullets.push(match[1].trim());
    }
  }
  
  return bullets;
};
