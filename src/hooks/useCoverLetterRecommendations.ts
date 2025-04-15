
import { CoverLetterAnalysis } from '@/context/types';

export const useCoverLetterRecommendations = () => {
  const applyRecommendations = (coverLetterText: string, analysis: CoverLetterAnalysis): string => {
    if (!coverLetterText || !analysis || !analysis.recommendations || analysis.recommendations.length === 0) {
      return coverLetterText;
    }
    
    let updatedText = coverLetterText;
    
    // Apply recommendations to improve the text based on weaknesses
    analysis.weaknesses.forEach(weakness => {
      // Simple approach: Add a paragraph addressing each weakness
      const weaknessLower = weakness.toLowerCase();
      
      // Check if the weakness is already addressed in the text
      if (!updatedText.toLowerCase().includes(weaknessLower)) {
        // Add an improvement paragraph at the end
        const improvement = analysis.recommendations.find(rec => 
          rec.toLowerCase().includes(weaknessLower)
        );
        
        if (improvement) {
          const enhancedParagraph = `\n\nRegarding ${weakness}: ${improvement}`;
          updatedText += enhancedParagraph;
        }
      }
    });
    
    return updatedText;
  };
  
  const calculateUpdatedRelevance = (analysis: CoverLetterAnalysis): number => {
    // Calculate improved relevance score
    // The score can improve by up to 15% based on the number of recommendations applied
    const originalScore = analysis.relevance || 0;
    const improvementFactor = Math.min(analysis.recommendations.length * 2.5, 15) / 100;
    const updatedScore = Math.min(Math.round(originalScore * (1 + improvementFactor)), 100);
    
    return updatedScore;
  };
  
  return {
    applyRecommendations,
    calculateUpdatedRelevance
  };
};
