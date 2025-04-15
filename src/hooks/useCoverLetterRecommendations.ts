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
    
    // Keep track of the sections we've modified to avoid duplicate enhancements
    const modifiedSections = new Set();
    
    // Preserve salutation if it exists
    const result = [];
    if (paragraphs.length > 0) {
      // Always keep the first paragraph (salutation) unchanged
      result.push(paragraphs[0]);
      modifiedSections.add(0);
    }
    
    // Enhance introduction paragraph with company insights (after salutation)
    if (hasCompanyInsights && paragraphs.length > 1) {
      let introductionIndex = hasSalutation ? 1 : 0;
      
      if (!modifiedSections.has(introductionIndex)) {
        const introduction = paragraphs[introductionIndex];
        
        // Create enhanced introduction with company insights
        const companyInsight = analysis.companyInsights.slice(0, 2).join(" and ");
        const enhancedIntro = `I am particularly drawn to ${companyName} because of its ${companyInsight}. ${paragraphs[introductionIndex]}`;
        
        result.push(enhancedIntro);
        modifiedSections.add(introductionIndex);
      }
    }
    
    // Add key requirements to a middle paragraph
    if (hasKeyRequirements && hasSuggestedPhrases) {
      // Find a good spot to insert requirements-focused content (around middle of letter)
      const middleIndex = Math.floor(paragraphs.length / 2);
      
      if (middleIndex > 0 && middleIndex < paragraphs.length && !modifiedSections.has(middleIndex)) {
        const middleParagraph = paragraphs[middleIndex];
        
        // Create enhanced paragraph with requirements
        const enhancedPara = `${middleParagraph} My experience aligns well with the ${
          analysis.keyRequirements?.join(", ")
        } that ${companyName} is looking for. ${
          analysis.suggestedPhrases?.slice(0, 1).join(" ")
        }`;
        
        result.push(enhancedPara);
        modifiedSections.add(middleIndex);
      }
    }
    
    // Add remaining paragraphs that haven't been modified yet
    for (let i = 0; i < paragraphs.length; i++) {
      if (!modifiedSections.has(i)) {
        result.push(paragraphs[i]);
      }
    }
    
    // Enhance the closing paragraph (second to last) if we haven't already
    const lastContentIndex = result.length - 2;
    if (lastContentIndex >= 0 && hasSuggestedPhrases && analysis.suggestedPhrases.length > 1) {
      const lastContentPara = result[lastContentIndex];
      const closingPhrase = analysis.suggestedPhrases[analysis.suggestedPhrases.length - 1];
      
      result[lastContentIndex] = `${lastContentPara} I am confident that ${closingPhrase}`;
    }
    
    return result.join("\n\n");
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
