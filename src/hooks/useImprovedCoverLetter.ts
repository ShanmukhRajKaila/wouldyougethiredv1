
import { useState, useEffect } from 'react';
import { CoverLetterAnalysis } from '@/context/types';

export interface ImprovedCoverLetterData {
  improvedText: string;
  updatedRelevance: number;
}

export const useImprovedCoverLetter = (
  coverLetterText: string,
  analysis: CoverLetterAnalysis | undefined
): ImprovedCoverLetterData => {
  const [improvedData, setImprovedData] = useState<ImprovedCoverLetterData>({
    improvedText: coverLetterText,
    updatedRelevance: analysis?.relevance || 0
  });

  useEffect(() => {
    if (!coverLetterText || !analysis) {
      return;
    }

    // Generate improved text by applying recommendations
    let updatedText = coverLetterText;
    
    // Apply recommendations to improve the text
    // This is a simplified implementation - in a real scenario, 
    // we would use more advanced NLP techniques
    if (analysis.recommendations && analysis.recommendations.length > 0) {
      // For each weakness, try to find and improve relevant sections
      analysis.weaknesses.forEach(weakness => {
        // Simple approach: Add a paragraph addressing each weakness
        // In a real implementation, you'd want more sophisticated text modification
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
    }
    
    // Calculate improved relevance score
    // The score can improve by up to 15% based on the number of recommendations applied
    const originalScore = analysis.relevance || 0;
    const improvementFactor = Math.min(analysis.recommendations.length * 2.5, 15) / 100;
    const updatedScore = Math.min(Math.round(originalScore * (1 + improvementFactor)), 100);
    
    setImprovedData({
      improvedText: updatedText,
      updatedRelevance: updatedScore
    });
  }, [coverLetterText, analysis]);

  return improvedData;
};
