
import { useEffect, useRef } from 'react';
import { CoverLetterAnalysis } from '@/context/types';
import { useCoverLetterState, ImprovedCoverLetterData } from './useCoverLetterState';
import { useCoverLetterRecommendations } from './useCoverLetterRecommendations';

export type { ImprovedCoverLetterData } from './useCoverLetterState';

export const useImprovedCoverLetter = (
  coverLetterText: string,
  analysis: CoverLetterAnalysis | undefined
): ImprovedCoverLetterData => {
  const { improvedData, setImprovedData } = useCoverLetterState(coverLetterText, analysis?.relevance || 0);
  const { applyRecommendations, calculateUpdatedRelevance } = useCoverLetterRecommendations();
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (!coverLetterText || !analysis || hasRun.current) {
      return;
    }
    
    // Generate improved text by applying recommendations
    const updatedText = applyRecommendations(coverLetterText, analysis);
    
    // Calculate improved relevance score
    const updatedScore = calculateUpdatedRelevance(analysis);
    
    setImprovedData({
      improvedText: updatedText,
      updatedRelevance: updatedScore
    });
    
    // Mark as run to prevent infinite loop
    hasRun.current = true;
  }, [coverLetterText, analysis, applyRecommendations, calculateUpdatedRelevance]);

  return improvedData;
};
