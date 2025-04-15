
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { AnalysisResult } from './types';

export const analyzeResume = async (
  resumeText: string, 
  jobDescription: string,
  coverLetterText?: string,
  companyName?: string
): Promise<AnalysisResult | null> => {
  try {
    console.log('Calling analyze-resume edge function...');
    
    // Further reduce the content length to prevent timeouts
    const maxResumeLength = 4000;
    const maxJobDescLength = 2000;
    const maxCoverLetterLength = 3000;
    
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
        companyName: companyName,
        options: {
          useFastModel: true,
          prioritizeSpeed: true,
          enhancedAtsAnalysis: true, // Enable enhanced ATS analysis
          keywordOptimization: true, // Enable intelligent keyword optimization
          atsCompatibilityCheck: true // Enable ATS compatibility checking
        }
      }),
      signal: AbortSignal.timeout(60000) // 60 second timeout
    });

    if (!response.ok) {
      console.error('Error response from analyze-resume:', response.status, response.statusText);
      
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
    
    return generateFallbackAnalysis(resumeText, jobDescription);
  }
};

// Improved fallback analysis with better ATS optimization suggestions
function generateFallbackAnalysis(resumeText: string, jobDescription: string): AnalysisResult {
  // Extract skills from job description (enhanced)
  const jobSkills = extractSkills(jobDescription);
  
  // Extract skills from resume (enhanced)
  const resumeSkills = extractSkills(resumeText);
  
  // Find matching skills with improved matching algorithm
  const matchingSkills = jobSkills.filter(skill => 
    resumeSkills.some(resumeSkill => 
      resumeSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(resumeSkill.toLowerCase()) ||
      areRelatedSkills(resumeSkill, skill)
    )
  );
  
  // Find missing skills
  const missingSkills = jobSkills.filter(skill => 
    !resumeSkills.some(resumeSkill => 
      resumeSkill.toLowerCase().includes(skill.toLowerCase()) || 
      skill.toLowerCase().includes(resumeSkill.toLowerCase()) ||
      areRelatedSkills(resumeSkill, skill)
    )
  );
  
  // Calculate a more sophisticated alignment score
  // Considers keyword matching, keyword positioning, and formatting factors
  const keywordScore = Math.min(
    Math.round((matchingSkills.length / Math.max(jobSkills.length, 1)) * 100),
    70 // Cap keyword score at 70% of total
  );
  
  // Check for proper formatting (estimate)
  const formattingScore = resumeText.includes('RESUME') || 
                         resumeText.includes('EXPERIENCE') || 
                         resumeText.includes('EDUCATION') ? 15 : 5;
  
  // Check for contact information (estimate)
  const contactScore = (resumeText.includes('@') && 
                       (resumeText.includes('phone') || 
                        resumeText.includes('tel') || 
                        /\d{3}[-\.\s]?\d{3}[-\.\s]?\d{4}/.test(resumeText))) ? 10 : 5;
  
  // Final alignment score
  const alignmentScore = Math.min(keywordScore + formattingScore + contactScore, 100);
  
  // Create dynamic recommendations based on analysis
  const recommendations = generateRecommendations(resumeText, jobDescription, missingSkills);
  
  // Extract bullet points from resume with improved detection
  const bulletPoints = extractBulletPoints(resumeText);
  
  // Create improved STAR analysis for bullet points - analyze up to 8 bullets
  const starAnalysis = bulletPoints.slice(0, 8).map(bullet => generateSTARAnalysis(bullet, jobDescription));
  
  return {
    alignmentScore,
    verdict: alignmentScore >= 60,
    strengths: matchingSkills.slice(0, 5),
    weaknesses: missingSkills.slice(0, 5),
    recommendations,
    starAnalysis
  };
}

// Check if two skills are related (synonyms or related concepts)
function areRelatedSkills(skill1: string, skill2: string): boolean {
  // Map of related skills
  const relatedSkillsMap: Record<string, string[]> = {
    'python': ['programming', 'coding', 'scripting', 'development'],
    'javascript': ['js', 'frontend', 'web development', 'coding'],
    'react': ['frontend', 'ui', 'javascript framework', 'web development'],
    'angular': ['frontend', 'ui', 'javascript framework', 'web development'],
    'vue': ['frontend', 'ui', 'javascript framework', 'web development'],
    'java': ['backend', 'programming', 'software development'],
    'sql': ['database', 'data', 'mysql', 'postgresql', 'oracle'],
    'leadership': ['management', 'team lead', 'supervision'],
    'communication': ['interpersonal skills', 'presentation', 'writing'],
    'analysis': ['analytics', 'data analysis', 'research', 'insights'],
  };
  
  const s1 = skill1.toLowerCase();
  const s2 = skill2.toLowerCase();
  
  // Check direct relations
  if (relatedSkillsMap[s1] && relatedSkillsMap[s1].some(rel => s2.includes(rel) || rel.includes(s2))) {
    return true;
  }
  
  if (relatedSkillsMap[s2] && relatedSkillsMap[s2].some(rel => s1.includes(rel) || rel.includes(s1))) {
    return true;
  }
  
  return false;
}

// More comprehensive skill extraction
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
  
  if (!text || typeof text !== 'string') {
    return Array.from(skills);
  }
  
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
  
  // Extract skills from bullet points
  const bulletPoints = text.split(/[\n\r]/).filter(line => 
    line && typeof line === 'string' && 
    (line.trim().startsWith('•') || line.trim().startsWith('-') || line.trim().startsWith('*'))
  );
  bulletPoints.forEach(point => {
    if (typeof point === 'string') {
      const words = point.split(/\s+/);
      words.forEach(word => {
        if (typeof word === 'string') {
          const cleaned = word.replace(/[.,;:()\[\]]/g, '');
          if (cleaned.length > 2 && cleaned.match(/^[A-Z][a-zA-Z0-9]*$/) && !cleaned.match(/^(I|We|They|He|She|It|You)$/)) {
            skills.add(cleaned);
          }
        }
      });
    }
  });
  
  return Array.from(skills).slice(0, 25);
}

// Extract bullet points with improved detection algorithm
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
  
  // If we don't find enough bullet points with markers, try to identify bullet-like sentences
  if (bulletPoints.length < 8) {
    const experienceSection = extractExperienceSection(text);
    if (experienceSection) {
      const sentences = experienceSection.match(/[^.!?]+[.!?]+/g) || [];
      // Get sentences that start with action verbs (common in resumes)
      const actionSentences = sentences.filter(s => {
        if (typeof s !== 'string') return false;
        const firstWord = s.trim().split(/\s+/)[0].toLowerCase();
        return ['developed', 'created', 'managed', 'led', 'implemented', 'designed', 
                'increased', 'decreased', 'improved', 'built', 'delivered', 'achieved', 
                'coordinated', 'established', 'executed', 'generated', 'launched', 
                'maintained', 'performed', 'reduced', 'resolved', 'streamlined'].includes(firstWord);
      }).slice(0, 8);
      
      if (actionSentences.length > 0) {
        return actionSentences.map(s => typeof s === 'string' ? s.trim() : '');
      }
    }
  }
  
  // Clean the bullet points and return top 8 (increased from 5)
  return bulletPoints
    .filter(b => typeof b === 'string')
    .map(b => b.trim().replace(/^[\-\•\*\✓\✔\→\♦\◆\o\◦\■\▪\▫\+\d\.]\s*/, ''))
    .filter(b => typeof b === 'string' && b.length > 10 && b.split(/\s+/).length > 3)
    .slice(0, 8);
}

// Extract experience section from resume text
function extractExperienceSection(text: string): string | null {
  if (!text || typeof text !== 'string') {
    return null;
  }
  
  const sections = text.split(/\n\s*\n/);
  
  // Look for experience section by common headers
  for (let i = 0; i < sections.length; i++) {
    const section = sections[i];
    if (typeof section === 'string' && section.match(/^EXPERIENCE|^WORK EXPERIENCE|^PROFESSIONAL EXPERIENCE|^EMPLOYMENT HISTORY/i)) {
      // Return this section and possibly the next one if it doesn't have a header
      let experienceText = section;
      if (i < sections.length - 1 && typeof sections[i+1] === 'string' && !sections[i+1].match(/^[A-Z\s]{5,30}$/m)) {
        experienceText += "\n\n" + sections[i+1];
      }
      return experienceText;
    }
  }
  
  // If no section header found, look for job titles with dates (common format)
  const jobTitlePattern = /(?:^|\n)([A-Z][A-Za-z\s&,]+)(?:[-–|]|\sat\s)([A-Z][A-Za-z\s&,.]+)(?:[-–|]|\s)(\w+\s\d{4}\s?[-–|]?\s?(?:\w+\s\d{4}|Present|Current))/;
  const match = text.match(jobTitlePattern);
  if (match) {
    // Find the section containing this job
    const jobStart = text.indexOf(match[0]);
    const nextSection = text.slice(jobStart).split(/\n\s*\n[A-Z\s]{5,30}\n/)[0];
    return nextSection;
  }
  
  return null;
}

// Generate improved STAR analysis for a bullet point
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
    const suggestedVerb = getRelevantActionVerb(bullet, jobDescription);
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
  
  // Add relevant keywords from job description if missing
  if (alignmentScore < 0.2) {
    // Find important keywords from job description that could be added
    const keyJobTerms = extractKeywordsByFrequency(jobDescription);
    const relevantKeyword = keyJobTerms.find(term => !lowerBullet.includes(term.toLowerCase()));
    
    if (relevantKeyword) {
      improved = improved + ` leveraging ${relevantKeyword} expertise`;
      feedback = feedback ? `${feedback} Added key term "${relevantKeyword}" from job description to improve ATS matching.` : `Added key term "${relevantKeyword}" from job description to improve ATS matching.`;
    }
  }
  
  return {
    original: bullet,
    improved: improved,
    feedback: feedback || "Enhanced for better ATS performance and hiring manager appeal."
  };
}

// Extract keywords by frequency from text
function extractKeywordsByFrequency(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const words = text.toLowerCase().split(/\W+/).filter(w => 
    w.length > 3 && 
    !['with', 'that', 'have', 'this', 'from', 'they', 'will', 'would', 'about', 'their', 'there', 'what', 'which'].includes(w)
  );
  
  const frequency: Record<string, number> = {};
  words.forEach(word => {
    frequency[word] = (frequency[word] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0])
    .slice(0, 10);
}

// Get a relevant action verb for the bullet point based on job description
function getRelevantActionVerb(bullet: string, jobDescription: string): string {
  if (!bullet || typeof bullet !== 'string') {
    return 'Achieved';
  }
  
  const lowerBullet = bullet.toLowerCase();
  const lowerJobDesc = jobDescription.toLowerCase();
  
  const technicalVerbs = ['developed', 'implemented', 'programmed', 'engineered', 'designed', 'architected', 'built'];
  const leadershipVerbs = ['led', 'managed', 'directed', 'supervised', 'oversaw', 'coordinated'];
  const analyticalVerbs = ['analyzed', 'assessed', 'evaluated', 'researched', 'investigated', 'studied'];
  const creativeVerbs = ['created', 'designed', 'conceived', 'established', 'formulated', 'initiated'];
  const communicationVerbs = ['presented', 'communicated', 'authored', 'documented', 'negotiated', 'persuaded'];
  const achievementVerbs = ['achieved', 'exceeded', 'improved', 'enhanced', 'increased', 'optimized'];
  
  // Determine the most appropriate verb category based on bullet and job description
  if ((lowerBullet.includes('code') || lowerBullet.includes('develop') || lowerBullet.includes('program')) ||
      (lowerJobDesc.includes('software') || lowerJobDesc.includes('develop') || lowerJobDesc.includes('engineer'))) {
    return technicalVerbs[Math.floor(Math.random() * technicalVerbs.length)];
  } else if ((lowerBullet.includes('team') || lowerBullet.includes('lead') || lowerBullet.includes('direct')) ||
            (lowerJobDesc.includes('manage') || lowerJobDesc.includes('lead') || lowerJobDesc.includes('direct'))) {
    return leadershipVerbs[Math.floor(Math.random() * leadershipVerbs.length)];
  } else if ((lowerBullet.includes('data') || lowerBullet.includes('research') || lowerBullet.includes('analysis')) ||
            (lowerJobDesc.includes('data') || lowerJobDesc.includes('research') || lowerJobDesc.includes('analysis'))) {
    return analyticalVerbs[Math.floor(Math.random() * analyticalVerbs.length)];
  } else if ((lowerBullet.includes('create') || lowerBullet.includes('design') || lowerBullet.includes('new')) ||
            (lowerJobDesc.includes('creative') || lowerJobDesc.includes('innovation') || lowerJobDesc.includes('design'))) {
    return creativeVerbs[Math.floor(Math.random() * creativeVerbs.length)];
  } else if ((lowerBullet.includes('present') || lowerBullet.includes('report') || lowerBullet.includes('communicate')) ||
            (lowerJobDesc.includes('communicate') || lowerJobDesc.includes('presentation') || lowerJobDesc.includes('stakeholder'))) {
    return communicationVerbs[Math.floor(Math.random() * communicationVerbs.length)];
  } else {
    return achievementVerbs[Math.floor(Math.random() * achievementVerbs.length)];
  }
}

// Generate dynamic recommendations based on analysis
function generateRecommendations(resumeText: string, jobDescription: string, missingSkills: string[]): string[] {
  const recommendations = [];
  
  // Check for missing skills
  if (missingSkills.length > 0) {
    recommendations.push(`Add these key skills to your resume: ${missingSkills.slice(0, 3).join(', ')}`);
  }
  
  // Check for metrics
  const hasMetrics = /\d+%|\$\d+|\d+x|\d+\s(?:percent|dollars|users|customers|clients|hours|days)/.test(resumeText);
  if (!hasMetrics) {
    recommendations.push('Quantify your achievements with specific metrics (e.g., "increased sales by 20%", "reduced costs by $50K")');
  }
  
  // Check for formatting issues
  if (!resumeText.includes('EXPERIENCE') && !resumeText.includes('EDUCATION') && !resumeText.includes('SKILLS')) {
    recommendations.push('Use clear section headings (EXPERIENCE, EDUCATION, SKILLS) to help ATS systems parse your resume correctly');
  }
  
  // Check for action verbs
  const actionVerbs = ['led', 'managed', 'developed', 'created', 'implemented', 'designed', 'increased', 'decreased'];
  const hasActionVerbs = actionVerbs.some(verb => resumeText.toLowerCase().includes(verb));
  if (!hasActionVerbs) {
    recommendations.push('Begin bullet points with strong action verbs (e.g., "Led", "Developed", "Achieved")');
  }
  
  // Check job description keywords
  const keyJobTerms = extractKeywordsByFrequency(jobDescription).slice(0, 5);
  const missingJobTerms = keyJobTerms.filter(term => !resumeText.toLowerCase().includes(term.toLowerCase()));
  if (missingJobTerms.length > 0) {
    recommendations.push(`Include these key terms from the job description: ${missingJobTerms.join(', ')}`);
  }
  
  // Always include these general best practices
  if (recommendations.length < 5) {
    recommendations.push('Customize your resume for each job application to maximize keyword matching');
    recommendations.push('Use a clean, ATS-friendly format with standard section headings');
    recommendations.push('Include a targeted professional summary at the top of your resume');
    recommendations.push('Focus on achievements rather than responsibilities in your bullet points');
    recommendations.push('Proofread carefully—ATS systems may reject resumes with spelling and grammar errors');
  }
  
  return recommendations.slice(0, 5);
}
