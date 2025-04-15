
import { CoverLetterAnalysis } from '@/context/types';

export const useCoverLetterRecommendations = () => {
  const applyRecommendations = (coverLetterText: string, analysis: CoverLetterAnalysis): string => {
    if (!coverLetterText || !analysis || !analysis.recommendations || analysis.recommendations.length === 0) {
      return coverLetterText;
    }
    
    let updatedText = coverLetterText;
    
    // Check if we have company insights to incorporate
    const hasCompanyInsights = analysis.companyInsights && analysis.companyInsights.length > 0;
    const hasKeyRequirements = analysis.keyRequirements && analysis.keyRequirements.length > 0;
    const hasSuggestedPhrases = analysis.suggestedPhrases && analysis.suggestedPhrases.length > 0;
    
    // If we have company insights, add a paragraph about the company
    if (hasCompanyInsights) {
      // Find the end of the first paragraph (introduction) to insert company-specific content
      const firstParaEnd = updatedText.indexOf("\n\n", 0);
      if (firstParaEnd !== -1) {
        // Insert after first paragraph
        const companyPara = "\n\nI'm particularly drawn to " + 
          analysis.companyInsights.slice(0, 2).join(" and ") + 
          ". " + (analysis.companyInsights[2] || "");
          
        updatedText = 
          updatedText.substring(0, firstParaEnd + 2) + 
          companyPara + 
          updatedText.substring(firstParaEnd + 2);
      }
    }
    
    // Add key requirements to the middle paragraphs
    if (hasKeyRequirements && hasSuggestedPhrases) {
      // Find a good spot to insert requirements-focused content (around middle of letter)
      const enhancedPara = "\n\nMy experience aligns well with the " + 
        analysis.keyRequirements?.join(", ") + 
        " that you're looking for. " + 
        analysis.suggestedPhrases?.slice(0, 2).join(" ") +
        "\n\n";
        
      // Insert roughly in the middle of the letter
      const insertPoint = Math.floor(updatedText.length / 2);
      const nearestPara = updatedText.indexOf("\n\n", insertPoint);
      
      if (nearestPara !== -1) {
        updatedText = 
          updatedText.substring(0, nearestPara) + 
          enhancedPara + 
          updatedText.substring(nearestPara + 2);
      } else {
        // If can't find a good spot, append to end
        updatedText += enhancedPara;
      }
    }
    
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
    
    // Add an enhanced closing if we have more suggested phrases
    if (hasSuggestedPhrases && analysis.suggestedPhrases.length > 2) {
      const closingPhrase = analysis.suggestedPhrases[analysis.suggestedPhrases.length - 1];
      
      if (closingPhrase) {
        // Find the last paragraph
        const lastParaStart = updatedText.lastIndexOf("\n\n");
        if (lastParaStart !== -1) {
          // Replace the closing or append to it
          updatedText = updatedText.substring(0, lastParaStart) + 
            "\n\nI am confident that " + closingPhrase + " Thank you for considering my application.\n\n" + 
            "Sincerely,\n[Your Name]";
        }
      }
    }
    
    return updatedText;
  };
  
  const calculateUpdatedRelevance = (analysis: CoverLetterAnalysis): number => {
    // Calculate improved relevance score with additional boost for company insights
    const originalScore = analysis.relevance || 0;
    
    // Base improvement factor from recommendations
    let improvementFactor = Math.min(analysis.recommendations.length * 2, 10) / 100;
    
    // Additional boost if we have company insights
    if (analysis.companyInsights && analysis.companyInsights.length > 0) {
      improvementFactor += 0.05; // +5%
    }
    
    // Additional boost if we have key requirements
    if (analysis.keyRequirements && analysis.keyRequirements.length > 0) {
      improvementFactor += 0.05; // +5%
    }
    
    // Additional boost if we have suggested phrases
    if (analysis.suggestedPhrases && analysis.suggestedPhrases.length > 0) {
      improvementFactor += 0.05; // +5%
    }
    
    // Cap the total improvement at 25%
    improvementFactor = Math.min(improvementFactor, 0.25);
    
    const updatedScore = Math.min(Math.round(originalScore * (1 + improvementFactor)), 100);
    
    return updatedScore;
  };
  
  return {
    applyRecommendations,
    calculateUpdatedRelevance
  };
};
