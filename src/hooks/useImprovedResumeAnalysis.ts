
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
        // We need to escape special characters in the original text for the regex
        const escapedOriginal = item.original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Create a regex that will match the original text with some flexibility for whitespace
        const regex = new RegExp(`(^|\\n|\\r)\\s*${escapedOriginal}\\s*($|\\n|\\r)`, 'g');
        updatedText = updatedText.replace(regex, `$1${item.improved}$2`);
      }
    });
    
    // Calculate improved alignment score
    // The score can improve by up to 20% based on the number of improvements applied
    let originalScore = analysisResults?.alignmentScore || 0;
    const improvementFactor = Math.min(validAnalysis.length * 2, 20) / 100; // Cap at 20% improvement
    let updatedScore = Math.min(Math.round(originalScore * (1 + improvementFactor)), 100);
    
    setImprovedData({
      improvedText: updatedText,
      updatedAlignmentScore: updatedScore
    });
  }, [resumeText, starAnalysis, analysisResults]);

  return improvedData;
};
