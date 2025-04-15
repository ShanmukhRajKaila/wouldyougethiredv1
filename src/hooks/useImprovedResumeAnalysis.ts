
import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';

export interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

export interface ImprovedResumeData {
  improvedText: string;
  updatedAlignmentScore: number;
}

export const useImprovedResumeAnalysis = (
  resumeText: string,
  starAnalysis: StarAnalysisItem[]
): ImprovedResumeData => {
  const { analysisResults } = useAppContext();
  const [improvedData, setImprovedData] = useState<ImprovedResumeData>({
    improvedText: resumeText,
    updatedAlignmentScore: analysisResults?.alignmentScore || 0
  });

  useEffect(() => {
    if (!resumeText || !starAnalysis || starAnalysis.length === 0) {
      return;
    }

    let updatedText = resumeText;
    const validAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
    
    // Replace original bullet points with improved versions
    validAnalysis.forEach(item => {
      if (item.original && item.improved) {
        try {
          // We need to escape special characters in the original text for the regex
          const escapedOriginal = item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          // Create a regex that will match the original text with some flexibility for whitespace
          const regex = new RegExp(`(^|\\n|\\r)\\s*${escapedOriginal}\\s*($|\\n|\\r)`, 'g');
          updatedText = updatedText.replace(regex, `$1${item.improved}$2`);
        } catch (error) {
          console.error('Error replacing bullet point:', error);
          // Continue with the next item if there's an error with this one
        }
      }
    });
    
    // Calculate improved alignment score with a more nuanced approach based on number of improvements
    let originalScore = analysisResults?.alignmentScore || 0;
    
    // Base improvement is 1% per bullet point improved, up to a maximum of 20%
    const improvementFactor = Math.min(validAnalysis.length * 1, 20) / 100; 
    
    // Additional improvement for each bullet point that adds metrics (contains % or $)
    const metricsAddedCount = validAnalysis.filter(item => 
      (item.improved.includes('%') || item.improved.includes('$')) && 
      !(item.original.includes('%') || item.original.includes('$'))
    ).length;
    
    // Extra 0.5% per metric added, up to 5%
    const metricsBonus = Math.min(metricsAddedCount * 0.5, 5) / 100;
    
    // Total improvement capped at 25%
    const totalImprovement = Math.min(improvementFactor + metricsBonus, 0.25);
    let updatedScore = Math.min(Math.round(originalScore * (1 + totalImprovement)), 100);
    
    setImprovedData({
      improvedText: updatedText,
      updatedAlignmentScore: updatedScore
    });
  }, [resumeText, starAnalysis, analysisResults]);

  return improvedData;
};
