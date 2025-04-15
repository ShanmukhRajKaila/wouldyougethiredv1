
import { AnalysisResult } from './types';

// Service that handles resume analysis by calling the external API
export const analyzeResume = async (
  resumeText: string, 
  jobDescText: string,
  coverLetterText?: string,
  companyName?: string
): Promise<AnalysisResult | null> => {
  try {
    console.log(`Sending analysis request for resume length: ${resumeText.length}, job desc length: ${jobDescText.length}`);
    if (coverLetterText) {
      console.log(`Including cover letter of length: ${coverLetterText.length}`);
    }
    if (companyName) {
      console.log(`Company name provided: ${companyName}`);
    }
    
    // Simulated analysis - in a real implementation, this would call an API
    const starAnalysis = generateMockAnalysis(resumeText, jobDescText);
    
    // Calculate match percentage based on keyword overlap
    const alignmentScore = calculateAlignmentScore(resumeText, jobDescText);
    
    // Generate strengths and weaknesses
    const { strengths, weaknesses } = extractStrengthsAndWeaknesses(resumeText, jobDescText);
    
    return {
      alignmentScore,
      verdict: alignmentScore > 65,
      strengths,
      weaknesses,
      recommendations: getRecommendations(alignmentScore, resumeText, jobDescText),
      starAnalysis
    };
  } catch (error) {
    console.error("Error in analyzeResume service:", error);
    throw new Error("Failed to analyze resume");
  }
};

// Helper functions for the mock analysis

function generateMockAnalysis(resumeText: string, jobDescText: string) {
  const bulletPoints = extractBulletPoints(resumeText);
  return bulletPoints.slice(0, 3).map(bullet => ({
    original: bullet,
    improved: improveBulletPoint(bullet),
    feedback: generateFeedback(bullet, jobDescText)
  }));
}

function extractBulletPoints(text: string): string[] {
  if (!text) return [];
  
  const lines = text.split(/\n/).filter(Boolean);
  return lines
    .filter(line => 
      line.trim().startsWith('-') || 
      line.trim().startsWith('•') || 
      /^\s*[\d]+\./.test(line))
    .map(line => line.replace(/^[\s•\-\d\.]+/, '').trim())
    .filter(line => line.length > 15)
    .slice(0, 5);
}

function improveBulletPoint(bullet: string): string {
  if (!bullet) return '';
  
  // Add action verb if not present
  const actionVerbs = ['Developed', 'Led', 'Managed', 'Created', 'Implemented'];
  const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
  
  if (!/^(Developed|Led|Managed|Created|Implemented)/i.test(bullet)) {
    bullet = `${randomVerb} ${bullet.charAt(0).toLowerCase() + bullet.slice(1)}`;
  }
  
  // Add metrics if not present
  if (!/\d+%|\$\d+|\d+ percent|\d+ users/.test(bullet)) {
    const metrics = [
      "resulting in 30% productivity improvement",
      "leading to $50K in cost savings",
      "boosting team efficiency by 25%",
      "increasing user engagement by 40%"
    ];
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    bullet = `${bullet} ${randomMetric}`;
  }
  
  return bullet;
}

function generateFeedback(bullet: string, jobDesc: string): string {
  const feedbackOptions = [
    "Added a strong action verb to start your bullet point.",
    "Incorporated specific metrics to quantify your achievement.",
    "Connected your experience directly to job requirements.",
    "Enhanced specificity with industry terminology from the job posting."
  ];
  
  return feedbackOptions[Math.floor(Math.random() * feedbackOptions.length)];
}

function calculateAlignmentScore(resumeText: string, jobDescText: string): number {
  if (!resumeText || !jobDescText) return 50;
  
  const resumeWords = new Set(resumeText.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  const jobWords = new Set(jobDescText.toLowerCase().split(/\W+/).filter(w => w.length > 3));
  
  let matches = 0;
  jobWords.forEach(word => {
    if (resumeWords.has(word)) matches++;
  });
  
  // Calculate percentage match, with bounds
  const baseScore = Math.min(Math.round((matches / Math.max(jobWords.size, 1)) * 100), 95);
  
  // Add some randomness for demo purposes
  return Math.max(40, Math.min(95, baseScore + (Math.random() * 10 - 5)));
}

function extractStrengthsAndWeaknesses(resumeText: string, jobDescText: string) {
  const resumeLower = resumeText.toLowerCase();
  
  // Common skill keywords
  const skillKeywords = [
    "javascript", "react", "python", "java", "c++", "node.js",
    "management", "leadership", "communication", "teamwork",
    "problem-solving", "analytics", "customer service", "project management",
    "data analysis", "research", "design", "strategy", "marketing", "sales"
  ];
  
  // Find skills in job description
  const jobSkills = skillKeywords.filter(skill => 
    jobDescText.toLowerCase().includes(skill)
  );
  
  // Find matching skills in resume
  const matchingSkills = jobSkills.filter(skill => 
    resumeLower.includes(skill)
  );
  
  // Find missing skills
  const missingSkills = jobSkills.filter(skill => 
    !resumeLower.includes(skill)
  );
  
  // Generate strengths based on matching skills
  const strengths = matchingSkills.map(skill => 
    `Strong ${skill} experience that aligns with job requirements`
  );
  
  // Add some generic strengths if needed
  if (strengths.length < 3) {
    const genericStrengths = [
      "Clear and concise communication style",
      "Well-structured resume format",
      "Relevant educational background",
      "Demonstrated progression in career path"
    ];
    
    while (strengths.length < 3 && genericStrengths.length > 0) {
      strengths.push(genericStrengths.pop()!);
    }
  }
  
  // Generate weaknesses based on missing skills
  const weaknesses = missingSkills.slice(0, 3).map(skill => 
    `Missing ${skill} keyword that appears in the job description`
  );
  
  // Add some generic weaknesses if needed
  if (weaknesses.length < 3) {
    const genericWeaknesses = [
      "Achievements could be more quantified with metrics",
      "Professional summary could be more tailored to the role",
      "Some experiences may appear less relevant to this specific position",
      "Skills section could better highlight technical proficiencies"
    ];
    
    while (weaknesses.length < 3 && genericWeaknesses.length > 0) {
      weaknesses.push(genericWeaknesses.pop()!);
    }
  }
  
  return {
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5)
  };
}

function getRecommendations(alignmentScore: number, resumeText: string, jobDescText: string): string[] {
  const baseRecommendations = [
    "Tailor your professional summary to specifically address the job requirements",
    "Begin each bullet point with a strong action verb (e.g., Developed, Led, Created)",
    "Quantify your achievements with specific metrics (e.g., increased sales by 20%)"
  ];
  
  const lowScoreRecommendations = [
    "Add more keywords from the job description throughout your resume",
    "Remove experiences that aren't relevant to this specific position",
    "Reorganize your resume to highlight most relevant skills first"
  ];
  
  const highScoreRecommendations = [
    "Consider adding a brief section highlighting your most relevant project",
    "Prepare examples of your listed skills for potential interview questions",
    "Ensure your cover letter expands on the strengths in your resume"
  ];
  
  // Combine recommendations based on score
  return [
    ...baseRecommendations,
    ...(alignmentScore < 70 ? lowScoreRecommendations : highScoreRecommendations)
  ].slice(0, 5);
}
