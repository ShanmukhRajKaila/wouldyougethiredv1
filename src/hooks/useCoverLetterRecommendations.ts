
import { CoverLetterAnalysis } from '@/context/types';

export const useCoverLetterRecommendations = () => {
  const applyRecommendations = (coverLetterText: string, analysis: CoverLetterAnalysis): string => {
    if (!coverLetterText || !analysis || !analysis.recommendations || analysis.recommendations.length === 0) {
      return coverLetterText;
    }
    
    let paragraphs = coverLetterText.split(/\n{2,}/);
    
    // Check if we have company insights to incorporate
    const hasCompanyInsights = analysis.companyInsights && analysis.companyInsights.length > 0;
    const hasKeyRequirements = analysis.keyRequirements && analysis.keyRequirements.length > 0;
    const hasSuggestedPhrases = analysis.suggestedPhrases && analysis.suggestedPhrases.length > 0;
    
    // Extract company name from insights if available
    const companyName = analysis.companyInsights && analysis.companyInsights[0] ? 
      extractCompanyName(analysis.companyInsights[0]) : 
      "the company";
    
    // Find the greeting/salutation to preserve it at the top
    const firstParagraph = paragraphs[0] || "";
    const hasSalutation = /^(dear|to whom|hello)/i.test(firstParagraph.trim());
    
    // The original text with proper paragraphs
    const originalText = paragraphs.join("\n\n");
    
    // Store our enhancement suggestions
    let enhancements = [];
    
    // Generate company insight enhancement
    if (hasCompanyInsights && analysis.companyInsights.length > 0) {
      const companyInsight = analysis.companyInsights.slice(0, 2).join(" and ");
      enhancements.push(`[COMPANY INSIGHT: Weave this into the first or second paragraph - Highlight your connection to ${companyName}'s ${companyInsight}."]`);
    }
    
    // Generate key requirements enhancement
    if (hasKeyRequirements && analysis.keyRequirements.length > 0) {
      const requirements = analysis.keyRequirements.join(", ");
      enhancements.push(`[KEY REQUIREMENTS: Align with body paragraphs - Demonstrate how your skills match the ${requirements} ${companyName} seeks."]`);
    }
    
    // Generate suggested phrases enhancement
    if (hasSuggestedPhrases && analysis.suggestedPhrases.length > 0) {
      analysis.suggestedPhrases.forEach((phrase, index) => {
        enhancements.push(`[SUGGESTED PHRASE ${index + 1}: Integrate strategically - "${phrase}"]`);
      });
    }
    
    // Add the enhancements at the end with clear instructions
    const enhancedText = `${originalText}\n\n\n==== SUGGESTED ENHANCEMENTS ====\n(CAREFULLY READ AND INCORPORATE THESE SUGGESTIONS INTO THE APPROPRIATE SECTIONS OF YOUR COVER LETTER)\n\n${enhancements.join("\n\n")}`;
    
    return enhancedText;
  };
  
  // Helper function to extract company name from insights
  const extractCompanyName = (insight: string): string => {
    const companyMatches = insight.match(/\b([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\b/);
    return companyMatches && companyMatches[0] ? companyMatches[0] : "the company";
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
