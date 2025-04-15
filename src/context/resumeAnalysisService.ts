
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
    
    // Further reduce the content length to prevent timeouts
    const maxResumeLength = 4000;  // Reduced from 8000 
    const maxJobDescLength = 2000; // Reduced from 4000
    const maxCoverLetterLength = 3000; // Reduced from 6000
    
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
    
    // Use a longer timeout for the fetch request (60 seconds)
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
          useFastModel: true,
          prioritizeSpeed: true
        }
      }),
      // Set a longer timeout for the fetch request
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });

    // If we get a status code that's not in the 200-299 range, check for error
    if (!response.ok) {
      console.error('Error response from analyze-resume:', response.status, response.statusText);
      
      // If timeout (408) or server error (5xx), generate fallback analysis
      if (response.status === 408 || response.status >= 500) {
        console.log('Generating fallback analysis due to timeout or server error');
        return generateFallbackAnalysis(trimmedResume, trimmedJobDesc);
      }
      
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
    console.log('Analysis result received');
    return analysisResult as AnalysisResult;
  } catch (error) {
    console.error('Error analyzing resume:', error);
    toast.error('Our analysis service is currently experiencing high volume. Using simplified analysis instead.');
    
    // Generate a simple fallback analysis if the main analysis fails
    return generateFallbackAnalysis(resumeText, jobDescription);
  }
};

// Fallback function to generate a simple analysis when the edge function times out
function generateFallbackAnalysis(resumeText: string, jobDescription: string): AnalysisResult {
  // Extract skills from job description (simplified)
  const jobSkills = extractSkills(jobDescription);
  
  // Extract skills from resume (simplified)
  const resumeSkills = extractSkills(resumeText);
  
  // Find matching skills
  const matchingSkills = jobSkills.filter(skill => 
    resumeSkills.some(resumeSkill => 
      resumeSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(resumeSkill.toLowerCase())
    )
  );
  
  // Find missing skills
  const missingSkills = jobSkills.filter(skill => 
    !resumeSkills.some(resumeSkill => 
      resumeSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(resumeSkill.toLowerCase())
    )
  );
  
  // Calculate a simple alignment score based on matching skills
  const alignmentScore = Math.min(
    Math.round((matchingSkills.length / Math.max(jobSkills.length, 1)) * 100),
    100
  );
  
  // Create recommendations
  const recommendations = [
    "Add more specific metrics and results to your achievements",
    "Tailor your resume to better match the job requirements",
    "Highlight your most relevant experience more prominently"
  ];
  
  // Extract bullet points from resume
  const bulletPoints = resumeText
    .split(/[\n\r]/g)
    .filter(line => line.trim().startsWith('•') || line.trim().startsWith('-'))
    .slice(0, 3);
  
  // Create STAR analysis for bullet points
  const starAnalysis = bulletPoints.map(bullet => ({
    original: bullet.trim(),
    improved: bullet.trim() + " (quantify this achievement with specific metrics)",
    feedback: "Add specific numbers and outcomes to strengthen this bullet point"
  }));
  
  return {
    alignmentScore,
    verdict: alignmentScore >= 60,
    strengths: matchingSkills.slice(0, 5),
    weaknesses: missingSkills.slice(0, 5),
    recommendations,
    starAnalysis
  };
}

// Simple function to extract potential skills
function extractSkills(text: string): string[] {
  const commonSkills = [
    'python', 'javascript', 'java', 'sql', 'aws', 'azure', 'react', 'angular', 'vue', 'node',
    'excel', 'powerpoint', 'word', 'leadership', 'communication', 'teamwork', 'project management',
    'agile', 'scrum', 'analytics', 'data analysis', 'marketing', 'sales', 'customer service',
    'presentation', 'research', 'writing', 'editing', 'design', 'photoshop', 'illustrator',
    'html', 'css', 'database', 'cloud', 'machine learning', 'ai', 'product management'
  ];
  
  const skills = new Set<string>();
  
  // Look for common skills in the text
  commonSkills.forEach(skill => {
    if (text.toLowerCase().includes(skill.toLowerCase())) {
      skills.add(skill);
    }
  });
  
  // Look for capitalized multi-word phrases that might be technologies or skills
  const potentialSkillMatches = text.match(/\b[A-Z][a-z]+ [A-Z][a-z]+\b/g) || [];
  potentialSkillMatches.forEach(match => skills.add(match));
  
  // Look for words after "experience with" or "expertise in"
  const experienceMatches = text.match(/experience (?:with|in) ([\w\s,]+)/gi) || [];
  experienceMatches.forEach(match => {
    const skill = match.replace(/experience (?:with|in) /i, '').trim();
    skills.add(skill);
  });
  
  return Array.from(skills).slice(0, 15);
}
