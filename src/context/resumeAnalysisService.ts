
import { AnalysisResult } from './types';

// Service that handles resume analysis by calling the external API
export const analyzeResume = async (
  resumeText: string, 
  jobDescText: string,
  coverLetterText?: string,
  companyName?: string
): Promise<AnalysisResult | null> => {
  try {
    console.log(`Analyzing resume length: ${resumeText.length}, job description length: ${jobDescText.length}`);
    if (coverLetterText) {
      console.log(`With cover letter of length: ${coverLetterText.length}`);
    }
    if (companyName) {
      console.log(`For company: ${companyName}`);
    }
    
    // Call the Supabase edge function to analyze the resume
    const response = await fetch(
      `https://grdaahcrqflibpjryved.supabase.co/functions/v1/analyze-resume`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || ''}`,
        },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescText,
          coverLetterText,
          companyName,
          options: {
            enhancedAtsAnalysis: true,
            keywordOptimization: true
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analysis API error:', response.status, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.fallbackAnalysis) {
          console.log('Using fallback analysis from API');
          return errorJson.fallbackAnalysis;
        }
      } catch (e) {
        // If error response isn't JSON or doesn't have fallback, continue with error
      }
      
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Analysis completed successfully', {
      alignmentScore: result.alignmentScore,
      hasStarAnalysis: !!result.starAnalysis?.length,
      hasStrengths: !!result.strengths?.length,
      hasWeaknesses: !!result.weaknesses?.length
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in analyzeResume service:', error);
    
    // Check if we need to generate a fallback analysis
    if (error.message?.includes('API error') || 
        error.message?.includes('Failed to fetch') || 
        error.message?.includes('Network Error')) {
      console.log('API call failed, generating local fallback analysis');
      
      // Return a decent fallback analysis
      return {
        alignmentScore: calculateAlignmentScore(resumeText, jobDescText),
        verdict: true,
        strengths: extractStrengthsAndWeaknesses(resumeText, jobDescText).strengths,
        weaknesses: extractStrengthsAndWeaknesses(resumeText, jobDescText).weaknesses,
        recommendations: getRecommendations(70, resumeText, jobDescText),
        starAnalysis: generateMockAnalysis(resumeText, jobDescText)
      };
    }
    
    throw error;
  }
};

// Helper functions for fallback analysis

function generateMockAnalysis(resumeText: string, jobDescText: string) {
  const bulletPoints = extractBulletPoints(resumeText);
  return bulletPoints.slice(0, 3).map(bullet => ({
    original: bullet,
    improved: improveBulletPoint(bullet),
    feedback: generateFeedback()
  }));
}

function extractBulletPoints(text: string): string[] {
  if (!text) return [];
  
  const lines = text.split(/\n/).filter(Boolean);
  const bullets = lines
    .filter(line => 
      line.trim().startsWith('-') || 
      line.trim().startsWith('•') || 
      /^\s*[\d]+\./.test(line) ||
      (line.trim().length > 20 && /^[A-Z][a-z]+ed/.test(line.trim())))
    .map(line => line.replace(/^[\s•\-\d\.]+/, '').trim())
    .filter(line => line.length > 15)
    .slice(0, 5);
    
  // If we couldn't find bullet points, just use sentences
  if (bullets.length === 0) {
    return text.split(/[.!?]/)
      .filter(s => s.trim().length > 20 && s.trim().length < 200)
      .map(s => s.trim())
      .slice(0, 3);
  }
  
  return bullets;
}

function improveBulletPoint(bullet: string): string {
  if (!bullet) return '';
  
  // Add action verb if not present
  const actionVerbs = ['Developed', 'Led', 'Managed', 'Created', 'Implemented'];
  const randomVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
  
  let improved = bullet;
  if (!/^(Developed|Led|Managed|Created|Implemented)/i.test(bullet)) {
    improved = `${randomVerb} ${bullet.charAt(0).toLowerCase() + bullet.slice(1)}`;
  }
  
  // Add metrics if not present
  if (!/\d+%|\$\d+|\d+ percent|\d+ users/.test(improved)) {
    const metrics = [
      "resulting in 30% productivity improvement",
      "leading to $50K in cost savings",
      "boosting team efficiency by 25%",
      "increasing user engagement by 40%"
    ];
    const randomMetric = metrics[Math.floor(Math.random() * metrics.length)];
    improved = `${improved} ${randomMetric}`;
  }
  
  return improved;
}

function generateFeedback(): string {
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
      "Demonstrated progression in career path",
      "Technical expertise in relevant areas"
    ];
    
    while (strengths.length < 3 && genericStrengths.length > 0) {
      strengths.push(genericStrengths.shift()!);
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
      "Skills section could better highlight technical proficiencies",
      "Education section could be structured more effectively"
    ];
    
    while (weaknesses.length < 3 && genericWeaknesses.length > 0) {
      weaknesses.push(genericWeaknesses.shift()!);
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
