
import { toast } from 'sonner';
import { AppStage, AnalysisResult } from '@/context/types';

interface AnalysisOperationsProps {
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: AppStage) => void;
  saveAnalysisResults: (params: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: AnalysisResult;
  }) => Promise<void>;
  analyzeResume: (resumeText: string, jobDescText: string) => Promise<AnalysisResult | null>;
  jobDescription: string;
  setRetryCount: (value: (prev: number) => number) => void;
  setReducedMode: (value: boolean) => void;
  retryCount: number;
  reducedMode: boolean;
}

export const useAnalysisOperations = ({
  setProgress,
  setCurrentStage,
  saveAnalysisResults,
  analyzeResume,
  jobDescription,
  setRetryCount,
  setReducedMode,
  retryCount,
  reducedMode
}: AnalysisOperationsProps) => {

  const performAnalysis = async (
    resumeText: string, 
    currentLeadId: string, 
    resumeId: string, 
    jobDescId: string
  ): Promise<boolean> => {
    try {
      const loadingToast = toast.loading('Analyzing your documents...');
      
      let analysisResults = null;
      let attemptError = null;
      
      try {
        // If we've already retried before, use reduced mode
        const shouldUseReducedMode = retryCount > 0 || reducedMode;
        
        // In reduced mode, trim the resume text
        if (shouldUseReducedMode) {
          console.log('Using reduced mode for analysis');
          const trimmedResume = resumeText.substring(0, 4000) + "...";
          // Also trim the job description
          const trimmedJobDesc = jobDescription.length > 2000 ? 
            jobDescription.substring(0, 2000) + "..." : 
            jobDescription;
            
          analysisResults = await analyzeResume(trimmedResume, trimmedJobDesc);
        } else {
          analysisResults = await analyzeResume(resumeText, jobDescription);
        }
      } catch (error: any) {
        console.error('First analysis attempt failed:', error);
        attemptError = error;
        
        // Only retry once if it's not a token limit error
        if (!error.message?.includes('token') && retryCount < 1) {
          setRetryCount(prev => prev + 1);
          
          // Wait a moment before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
          toast.loading('Retrying analysis with reduced content...');
          
          try {
            // Try with a shortened resume if the first attempt failed
            setReducedMode(true);
            const shortenedResume = resumeText.substring(0, 3000) + "...";
            const shortenedJobDesc = jobDescription.substring(0, 1500) + "...";
              
            analysisResults = await analyzeResume(shortenedResume, shortenedJobDesc);
          } catch (retryError) {
            console.error('Retry analysis attempt failed:', retryError);
            // Continue to use the fallback analysis
          }
        }
      }
      
      toast.dismiss(loadingToast);
      
      if (analysisResults) {
        console.log('Analysis complete. Results received.');
        
        // Validate that we have all required fields in the results
        if (!analysisResults.starAnalysis || analysisResults.starAnalysis.length === 0) {
          console.log('Adding fallback STAR analysis since none was provided');
          // Extract bullet points from resume
          const bulletPoints = extractBulletPoints(resumeText);
          
          // Create improved STAR analysis for bullet points
          analysisResults.starAnalysis = bulletPoints
            .slice(0, 3)
            .map(bullet => generateSTARAnalysis(bullet, jobDescription));
        }
        
        // Save the analysis results
        await saveAnalysisResults({
          leadId: currentLeadId,
          resumeId: resumeId,
          jobDescriptionId: jobDescId,
          results: analysisResults
        });
        
        setCurrentStage('results');
        setProgress(100);
        toast.success('Analysis complete!');
        return true;
      } else {
        console.log('Analysis failed, using fallback analysis');
        // Use fallback analysis
        const fallbackResults = generateFallbackAnalysis(resumeText, jobDescription);
        
        // Save the fallback results
        await saveAnalysisResults({
          leadId: currentLeadId,
          resumeId: resumeId,
          jobDescriptionId: jobDescId,
          results: fallbackResults
        });
        
        setCurrentStage('results');
        setProgress(100);
        toast.success('Analysis complete with basic evaluation!');
        return true;
      }
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      setCurrentStage('resumeUpload');
      
      if (error.message?.includes('token') || error.message?.includes('too large')) {
        toast.error('Your documents are too large to analyze. Please try with shorter or simpler files.');
      } else {
        toast.error('Failed to analyze your documents. Please try again later.');
      }
      return false;
    }
  };
  
  return { performAnalysis };
};

// Helper functions to support the fallback analysis
function extractBulletPoints(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const lines = text.split(/[\n\r]/);
  
  // Get all lines that look like bullet points
  const bulletPoints = lines.filter(line => {
    if (typeof line !== 'string') return false;
    const trimmed = line.trim();
    return trimmed.startsWith('•') || 
           trimmed.startsWith('-') || 
           trimmed.startsWith('*') || 
           trimmed.match(/^\d+\./) || 
           trimmed.match(/^[\s]*[\-\•\*\✓\✔\→\♦\◆\o\◦\■\▪\▫\+][\s]/);
  });
  
  // If we don't find bullet points with markers, try to identify bullet-like sentences
  if (bulletPoints.length < 3) {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
    // Get sentences that start with action verbs (common in resumes)
    const actionSentences = sentences.filter(s => {
      if (typeof s !== 'string') return false;
      const firstWord = s.trim().split(/\s+/)[0].toLowerCase();
      return ['developed', 'created', 'managed', 'led', 'implemented', 'designed', 
              'increased', 'decreased', 'improved', 'built', 'delivered', 'achieved', 
              'coordinated', 'established', 'executed', 'generated', 'launched', 
              'maintained', 'performed', 'reduced', 'resolved', 'streamlined'].includes(firstWord);
    }).slice(0, 5);
    
    if (actionSentences.length > 0) {
      return actionSentences.map(s => typeof s === 'string' ? s.trim() : '');
    }
  }
  
  // Clean the bullet points and return top 5
  return bulletPoints
    .filter(b => typeof b === 'string')
    .map(b => b.trim().replace(/^[\-\•\*\✓\✔\→\♦\◆\o\◦\■\▪\▫\+\d\.]\s*/, ''))
    .filter(b => typeof b === 'string' && b.length > 10 && b.split(/\s+/).length > 3)
    .slice(0, 5);
}

function extractSkills(text: string): string[] {
  const commonSkills = [
    // Technical skills
    'python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'go', 'rust', 'swift',
    'react', 'angular', 'vue', 'svelte', 'node', 'express', 'django', 'flask',
    'sql', 'nosql', 'mongodb', 'postgresql', 'mysql', 'oracle', 'firebase',
    'aws', 'azure', 'gcp', 'cloud', 'docker', 'kubernetes', 'terraform',
    'machine learning', 'deep learning', 'ai', 'artificial intelligence', 'nlp', 'data science',
    'git', 'github', 'gitlab', 'bitbucket', 'ci/cd', 'jenkins', 'github actions',
    
    // Business skills
    'excel', 'powerpoint', 'word', 'office', 'google workspace', 'g suite',
    'leadership', 'management', 'team lead', 'project management', 'scrum', 'agile',
    'communication', 'presentation', 'public speaking', 'negotiation', 'conflict resolution',
    'analytics', 'data analysis', 'research', 'market research', 'competitive analysis',
    'strategy', 'strategic thinking', 'business development', 'sales', 'marketing',
    'financial analysis', 'budgeting', 'forecasting', 'accounting', 'finance',
    'customer service', 'client relationship', 'account management', 'stakeholder management',
    'operations', 'supply chain', 'logistics', 'procurement', 'inventory management',
    'human resources', 'recruiting', 'talent acquisition', 'employee development',
    'product management', 'product development', 'ux', 'ui', 'user research', 'wireframing',
    'content creation', 'copywriting', 'editing', 'social media', 'seo', 'digital marketing'
  ];
  
  const skills = new Set<string>();
  const lowerText = text.toLowerCase();
  
  // Find common skills in text
  commonSkills.forEach(skill => {
    if (lowerText.includes(skill.toLowerCase())) {
      skills.add(skill);
    }
  });
  
  // Extract technical skills (typically capitalized terms or terms after "with" or "using")
  const techMatches = text.match(/(?:using|with|in|through|via)\s+([A-Za-z0-9/\-+#]+(?:\s+[A-Za-z0-9/\-+#]+){0,2})/gi) || [];
  techMatches.forEach(match => {
    const skill = match.replace(/(?:using|with|in|through|via)\s+/i, '').trim();
    if (skill.length > 2 && !commonSkills.includes(skill.toLowerCase())) {
      skills.add(skill);
    }
  });
  
  // Look for capitalized words that might be technologies
  const capitalizedMatches = text.match(/\b[A-Z][a-zA-Z0-9]*(?:\.[A-Za-z0-9]+)*\b/g) || [];
  capitalizedMatches.forEach(match => {
    if (match.length > 2 && !match.match(/^(I|We|They|He|She|It|You|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Mon|Tue|Wed|Thu|Fri|Sat|Sun)$/)) {
      skills.add(match);
    }
  });
  
  return Array.from(skills).slice(0, 25);
}

function generateSTARAnalysis(bullet: string, jobDescription: string) {
  if (!bullet || typeof bullet !== 'string') {
    return {
      original: '',
      improved: 'No valid bullet point provided',
      feedback: 'Please provide a valid bullet point for analysis'
    };
  }
  
  const lowerBullet = bullet.toLowerCase();
  const lowerJobDesc = jobDescription.toLowerCase();
  
  // Check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'increased', 'decreased'];
  const hasActionVerb = actionVerbs.some(verb => lowerBullet.includes(verb));
  
  // Check for metrics
  const hasMetrics = /\d+%|\$\d+|\d+x|\d+\s(?:percent|dollars|users|customers|clients|hours|days)/.test(lowerBullet);
  
  // Check for alignment with job description
  const jobWords = lowerJobDesc.split(/\W+/).filter(w => w.length > 3);
  const bulletWords = lowerBullet.split(/\W+/).filter(w => w.length > 3);
  const matchingWords = jobWords.filter(w => bulletWords.includes(w));
  const alignmentScore = matchingWords.length / Math.max(bulletWords.length, 1);
  
  // Create improved version
  let improved = bullet;
  let feedback = "";
  
  if (!hasActionVerb) {
    const suggestedVerbs = ['Led', 'Developed', 'Implemented', 'Managed', 'Created', 'Designed', 'Executed'];
    const suggestedVerb = suggestedVerbs[Math.floor(Math.random() * suggestedVerbs.length)];
    improved = `${suggestedVerb} ${improved.charAt(0).toLowerCase() + improved.slice(1)}`;
    feedback = "Added a strong action verb to start the bullet point for greater impact.";
  }
  
  if (!hasMetrics) {
    // Look for potential achievements to quantify
    if (lowerBullet.includes("improve") || lowerBullet.includes("increase") || lowerBullet.includes("enhance")) {
      improved = improved + " by 25%, exceeding team targets";
      feedback = feedback ? `${feedback} Added specific metrics to quantify your achievement.` : "Added specific metrics to quantify your achievement.";
    } else if (lowerBullet.includes("project") || lowerBullet.includes("initiative")) {
      improved = improved + " resulting in $100K annual savings";
      feedback = feedback ? `${feedback} Added concrete outcome metrics to demonstrate business impact.` : "Added concrete outcome metrics to demonstrate business impact.";
    } else if (lowerBullet.includes("team") || lowerBullet.includes("collaborat")) {
      improved = improved + " across 3 departments, improving efficiency by 15%";
      feedback = feedback ? `${feedback} Added scope and outcome details to highlight cross-functional impact.` : "Added scope and outcome details to highlight cross-functional impact.";
    }
  }
  
  // If no feedback was given yet, provide general enhancement
  if (!feedback) {
    improved = improved + " utilizing industry best practices and achieving tangible results";
    feedback = "Enhanced the bullet point with achievement focus and clarity for better ATS matching";
  }
  
  return {
    original: bullet,
    improved: improved,
    feedback: feedback
  };
}

function generateFallbackAnalysis(resumeText: string, jobDescription: string): any {
  // Extract skills from job description
  const jobSkills = extractSkills(jobDescription);
  
  // Extract skills from resume
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
  
  // Calculate alignment score based on matching skills
  const alignmentScore = Math.round((matchingSkills.length / Math.max(jobSkills.length, 1)) * 100);
  const cappedScore = Math.min(Math.max(alignmentScore, 40), 80);
  
  // Extract bullet points from resume
  const bulletPoints = extractBulletPoints(resumeText);
  
  // Create improved STAR analysis for bullet points
  const starAnalysis = bulletPoints
    .slice(0, 3)
    .map(bullet => generateSTARAnalysis(bullet, jobDescription));
  
  return {
    alignmentScore: cappedScore,
    verdict: cappedScore >= 60,
    strengths: matchingSkills.slice(0, 5),
    weaknesses: missingSkills.slice(0, 5),
    recommendations: [
      "Add missing keywords from the job description to improve ATS match score",
      "Quantify achievements with specific metrics (e.g., increased sales by 20%)",
      "Begin bullet points with strong action verbs (Led, Developed, Created)",
      "Tailor your resume to emphasize experience relevant to this specific role",
      "Include technical skills section that clearly lists your capabilities"
    ],
    starAnalysis: starAnalysis
  };
}
