
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
      `https://mqvstzxrxrmgdseepwzh.supabase.co/functions/v1/analyze-resume`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Don't use process.env in browser code
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xdnN0enhyeHJtZ2RzZWVwd3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyOTAwNjcsImV4cCI6MjA1OTg2NjA2N30.APvORBlZNkWFQLt_gNgCQJkubf3CZ6AWqEDf7QCY5zc`,
        },
        body: JSON.stringify({
          resumeText,
          jobDescription: jobDescText,
          coverLetterText,
          companyName,
          options: {
            forceFull: true, // Force full content analysis
            enhancedAtsAnalysis: true,
            keywordOptimization: true
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Analysis API error:', response.status, errorText);
      throw new Error(`API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    console.log('Analysis completed successfully', {
      alignmentScore: result.alignmentScore,
      hasStarAnalysis: !!result.starAnalysis?.length,
      hasStrengths: !!result.strengths?.length,
      hasWeaknesses: !!result.weaknesses?.length,
      coverLetterAnalysisInfo: result.coverLetterAnalysis ? {
        relevance: result.coverLetterAnalysis.relevance,
        hasCompanyInsights: !!result.coverLetterAnalysis.companyInsights?.length,
        hasKeyRequirements: !!result.coverLetterAnalysis.keyRequirements?.length,
        hasSuggestedPhrases: !!result.coverLetterAnalysis.suggestedPhrases?.length
      } : 'No cover letter analysis'
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in analyzeResume service:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
};
