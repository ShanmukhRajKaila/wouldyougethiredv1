
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
    
    // Store our enhancement suggestions in a more structured way
    let enhancementSections = {
      companyInsights: [],
      keyRequirements: [],
      suggestedPhrases: []
    };
    
    // Generate company insight enhancement
    if (hasCompanyInsights && analysis.companyInsights.length > 0) {
      analysis.companyInsights.forEach((insight, index) => {
        enhancementSections.companyInsights.push(`• ${insight}`);
      });
    }
    
    // Generate key requirements enhancement
    if (hasKeyRequirements && analysis.keyRequirements.length > 0) {
      analysis.keyRequirements.forEach((requirement, index) => {
        enhancementSections.keyRequirements.push(`• Demonstrate how your skills match "${requirement}"`);
      });
    }
    
    // Generate suggested phrases enhancement
    if (hasSuggestedPhrases && analysis.suggestedPhrases.length > 0) {
      analysis.suggestedPhrases.forEach((phrase, index) => {
        enhancementSections.suggestedPhrases.push(`• "${phrase}"`);
      });
    }
    
    // Add the enhancements at the end with clear instructions and better formatting
    let enhancedText = `${originalText}\n\n\n`;
    enhancedText += "─────── Suggested Enhancements ───────\n\n";
    enhancedText += "Please incorporate these suggestions into your cover letter. This guidance is meant to help improve your application but should be adapted to maintain your authentic voice.\n\n";
    
    if (enhancementSections.companyInsights.length > 0) {
      enhancedText += "Company Insights (for first or second paragraph):\n";
      enhancedText += enhancementSections.companyInsights.join("\n");
      enhancedText += "\n\n";
    }
    
    if (enhancementSections.keyRequirements.length > 0) {
      enhancedText += "Key Requirements (for body paragraphs):\n";
      enhancedText += enhancementSections.keyRequirements.join("\n");
      enhancedText += "\n\n";
    }
    
    if (enhancementSections.suggestedPhrases.length > 0) {
      enhancedText += "Suggested Phrases (integrate strategically):\n";
      enhancedText += enhancementSections.suggestedPhrases.join("\n");
      enhancedText += "\n\n";
    }
    
    // Add an implementation example for clarity
    enhancedText += "Sample Implementation:\n";
    enhancedText += `Consider adding a sentence like: \"I'm particularly drawn to ${companyName}'s ${analysis.companyInsights?.[0] || 'company culture'}, and I believe my background in ${analysis.keyRequirements?.[0] || 'the required skills'} would allow me to contribute effectively to your team.\"\n`;
    
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
      // Scale the boost based on how many insights we have (up to 5)
      const insightCount = Math.min(analysis.companyInsights.length, 5);
      improvementFactor += 0.01 * insightCount; // +1% per insight up to 5%
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
