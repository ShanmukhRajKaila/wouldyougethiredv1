
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
      hasWeaknesses: !!result.weaknesses?.length
    });
    
    return result;
  } catch (error: any) {
    console.error('Error in analyzeResume service:', error);
    // Re-throw the error to be handled by the caller
    throw error;
  }
};
