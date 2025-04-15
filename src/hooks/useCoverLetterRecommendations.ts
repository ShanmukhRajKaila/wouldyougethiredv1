
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
    
    // Find the greeting/salutation to preserve it at the top
    const salutationRegex = /(dear\s+[\w\s\.]+,|to\s+whom\s+it\s+may\s+concern:?|hello\s+[\w\s\.]+,)/i;
    const salutationMatch = updatedText.match(salutationRegex);
    let salutation = '';
    
    if (salutationMatch && salutationMatch[0]) {
      salutation = salutationMatch[0];
      // Add the salutation and a line break to the beginning
      updatedText = updatedText.replace(salutationRegex, '').trim();
    }
    
    // If we have company insights, add a paragraph about the company
    // but preserve the salutation at the top
    if (hasCompanyInsights) {
      // Insert after salutation
      const companyPara = "I'm particularly drawn to " + 
        analysis.companyInsights.slice(0, 2).join(" and ") + 
        ". " + (analysis.companyInsights[2] || "");
        
      // Build the improved letter with proper structure
      updatedText = 
        (salutation ? salutation + "\n\n" : "") +
        companyPara + "\n\n" + 
        updatedText;
    } else {
      // If no company insights, just make sure salutation is at the top
      updatedText = (salutation ? salutation + "\n\n" : "") + updatedText;
    }
    
    // Add key requirements to the middle paragraphs
    if (hasKeyRequirements && hasSuggestedPhrases) {
      // Find a good spot to insert requirements-focused content (around middle of letter)
      const enhancedPara = "\n\nMy experience aligns well with the " + 
        analysis.keyRequirements?.join(", ") + 
        " that you're looking for. " + 
        analysis.suggestedPhrases?.slice(0, 2).join(" ");
        
      // Insert roughly in the middle of the letter
      const paragraphs = updatedText.split("\n\n");
      
      if (paragraphs.length > 2) {
        const middleIndex = Math.floor(paragraphs.length / 2);
        
        // Insert the enhanced paragraph in the middle
        paragraphs.splice(middleIndex, 0, enhancedPara.trim());
        updatedText = paragraphs.join("\n\n");
      } else {
        // If not enough paragraphs, add to the end of existing content
        updatedText += enhancedPara;
      }
    }
    
    // Apply recommendations to improve the text based on weaknesses
    if (analysis.weaknesses && analysis.weaknesses.length > 0) {
      let improvementsParagraph = "\n\n";
      
      analysis.weaknesses.forEach((weakness, index) => {
        // Find a recommendation that addresses this weakness
        const improvement = analysis.recommendations.find(rec => 
          rec.toLowerCase().includes(weakness.toLowerCase())
        );
        
        if (improvement) {
          improvementsParagraph += improvement + " ";
        }
      });
      
      // Only add if we found relevant improvements
      if (improvementsParagraph.trim().length > 0) {
        updatedText += improvementsParagraph;
      }
    }
    
    // Add an enhanced closing if we have more suggested phrases
    if (hasSuggestedPhrases && analysis.suggestedPhrases.length > 2) {
      const closingPhrase = analysis.suggestedPhrases[analysis.suggestedPhrases.length - 1];
      
      if (closingPhrase) {
        // Find if there's already a closing paragraph
        const closingMatches = updatedText.match(/(sincerely|thank you|regards|respectfully|yours)/i);
        
        if (closingMatches) {
          // Replace existing closing
          const closingIndex = updatedText.lastIndexOf(closingMatches[0]);
          if (closingIndex !== -1) {
            updatedText = updatedText.substring(0, closingIndex) + 
              "\n\nI am confident that " + closingPhrase + " Thank you for considering my application.\n\n" + 
              "Sincerely,\n[Your Name]";
          }
        } else {
          // Add new closing
          updatedText += "\n\nI am confident that " + closingPhrase + " Thank you for considering my application.\n\n" + 
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
