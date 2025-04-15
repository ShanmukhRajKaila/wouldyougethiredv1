
import { useEffect, useRef } from 'react';
import { CoverLetterAnalysis } from '@/context/types';
import { useCoverLetterState, ImprovedCoverLetterData } from './useCoverLetterState';
import { useCoverLetterRecommendations } from './useCoverLetterRecommendations';
import { useAppContext } from '@/context/AppContext';

export type { ImprovedCoverLetterData } from './useCoverLetterState';

export const useImprovedCoverLetter = (
  coverLetterText: string,
  analysis: CoverLetterAnalysis | undefined
): ImprovedCoverLetterData => {
  const { improvedData, setImprovedData } = useCoverLetterState(coverLetterText, analysis?.relevance || 0);
  const { applyRecommendations, calculateUpdatedRelevance } = useCoverLetterRecommendations();
  const { selectedCompany } = useAppContext();
  const hasRun = useRef(false);
  
  useEffect(() => {
    if (!coverLetterText || !analysis || hasRun.current) {
      return;
    }
    
    // Update the analysis with the selected company name if available
    const enhancedAnalysis = { ...analysis };
    if (selectedCompany?.name && enhancedAnalysis.companyInsights) {
      // Make sure company name is included in the insights
      const hasCompanyName = enhancedAnalysis.companyInsights.some(
        insight => insight.includes(selectedCompany.name)
      );
      
      if (!hasCompanyName && enhancedAnalysis.companyInsights.length > 0) {
        // Replace or add company name to insights
        enhancedAnalysis.companyInsights = [
          `${selectedCompany.name}'s ${enhancedAnalysis.companyInsights[0]}`,
          ...enhancedAnalysis.companyInsights.slice(1)
        ];
      }
    }
    
    // Generate improved text by applying recommendations with company context
    const updatedText = applyRecommendations(coverLetterText, enhancedAnalysis);
    
    // Calculate improved relevance score
    const updatedScore = calculateUpdatedRelevance(enhancedAnalysis);
    
    setImprovedData({
      improvedText: updatedText,
      updatedRelevance: updatedScore
    });
    
    // Mark as run to prevent infinite loop
    hasRun.current = true;
  }, [coverLetterText, analysis, applyRecommendations, calculateUpdatedRelevance, selectedCompany, setImprovedData]);

  return improvedData;
};
