import { CoverLetterAnalysis } from '@/context/types';

export const useCoverLetterRecommendations = () => {
  // Action verbs library for ATS optimization
  const actionVerbs = [
    "Achieved", "Advanced", "Analyzed", "Authored", "Championed", 
    "Collaborated", "Coordinated", "Created", "Delivered", "Developed", 
    "Engineered", "Enhanced", "Established", "Executed", "Facilitated", 
    "Generated", "Implemented", "Improved", "Increased", "Innovated", 
    "Launched", "Led", "Managed", "Optimized", "Pioneered", 
    "Recommended", "Refined", "Resolved", "Streamlined", "Transformed"
  ];

  const applyRecommendations = (coverLetterText: string, analysis: CoverLetterAnalysis): string => {
    // Ensure cover letter insights are action verb-driven
    const enhanceWithActionVerbs = (phrases: string[]): string[] => {
      return phrases.map(phrase => {
        // Check if phrase already starts with an action verb
        const firstWord = phrase.split(' ')[0].replace(/[^\w]/g, '');
        
        if (!actionVerbs.includes(firstWord)) {
          // Select a random action verb that makes sense
          const verb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
          return `${verb} ${phrase.charAt(0).toLowerCase()}${phrase.slice(1)}`;
        }
        
        return phrase;
      });
    };

    // Enhance company insights with action verbs
    const companyInsights = analysis.companyInsights 
      ? enhanceWithActionVerbs(analysis.companyInsights)
      : [
          "Researched company's innovative approach and market positioning",
          "Identified core values and strategic objectives",
          "Analyzed company's recent achievements and industry impact",
          "Explored corporate social responsibility initiatives",
          "Examined leadership team's vision and growth strategy"
        ];

    // Enhance key requirements with action verb focus
    const keyRequirements = analysis.keyRequirements 
      ? enhanceWithActionVerbs(analysis.keyRequirements)
      : [
          "Demonstrate technical expertise in cutting-edge technologies",
          "Highlight problem-solving skills through concrete examples",
          "Showcase ability to collaborate across cross-functional teams",
          "Illustrate leadership potential and strategic thinking",
          "Prove adaptability in dynamic and challenging environments"
        ];

    // Enhance suggested phrases with action verb optimization
    const suggestedPhrases = analysis.suggestedPhrases
      ? enhanceWithActionVerbs(analysis.suggestedPhrases)
      : [
          "Engineered solutions that directly addressed critical business challenges",
          "Delivered measurable results that exceeded key performance indicators",
          "Transformed team dynamics through innovative leadership approaches",
          "Developed strategic frameworks that optimized operational efficiency",
          "Pioneered initiatives that generated significant competitive advantages"
        ];

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
      suggestedPhrases: [],
      tone: []
    };
    
    // Add tone suggestions
    if (analysis.tone) {
      enhancementSections.tone.push(`• Maintain a ${analysis.tone.toLowerCase()} tone throughout the letter`);
      
      // Add specific suggestions based on tone
      if (analysis.tone.toLowerCase().includes('professional')) {
        enhancementSections.tone.push(`• Use formal language and avoid colloquialisms`);
        enhancementSections.tone.push(`• Focus on achievements and qualifications`);
      } else if (analysis.tone.toLowerCase().includes('enthusiastic')) {
        enhancementSections.tone.push(`• Express genuine excitement for the opportunity`);
        enhancementSections.tone.push(`• Demonstrate passion for the company's mission`);
      } else if (analysis.tone.toLowerCase().includes('confident')) {
        enhancementSections.tone.push(`• Use strong, active verbs to describe accomplishments`);
        enhancementSections.tone.push(`• Clearly state how your background makes you an ideal candidate`);
      }
    }
    
    // Generate company insight enhancement - ensure we have at least 5 insights
    if (hasCompanyInsights) {
      // Take up to 5 insights from analysis
      const insightsToShow = analysis.companyInsights.slice(0, 5);
      insightsToShow.forEach((insight) => {
        enhancementSections.companyInsights.push(`• ${insight}`);
      });
    } else {
      // Generic placeholders if no insights were found
      enhancementSections.companyInsights = [
        `• Research ${companyName}'s mission statement and reference it specifically`,
        `• Mention a recent company achievement or news item`,
        `• Reference the company's core values or culture`,
        `• Mention specific products or services the company offers`,
        `• Discuss how your values align with the company's vision`
      ];
    }
    
    // Generate key requirements enhancement - ensure we have at least 5 requirements
    if (hasKeyRequirements) {
      // Take up to 5 requirements from analysis
      const requirementsToShow = analysis.keyRequirements.slice(0, 5);
      requirementsToShow.forEach((requirement) => {
        enhancementSections.keyRequirements.push(`• Demonstrate how your skills match "${requirement}"`);
      });
      
      // Add generic requirements if we don't have enough
      if (requirementsToShow.length < 5) {
        const genericRequirements = [
          "technical expertise relevant to the role",
          "communication and collaboration skills",
          "problem-solving abilities",
          "leadership experience",
          "industry knowledge"
        ];
        
        for (let i = requirementsToShow.length; i < 5; i++) {
          enhancementSections.keyRequirements.push(`• Address your ${genericRequirements[i % genericRequirements.length]}`);
        }
      }
    } else {
      // Generic placeholders if no requirements were found
      enhancementSections.keyRequirements = [
        `• Address your technical expertise directly relevant to the position`,
        `• Highlight your experience with specific tools mentioned in the job posting`,
        `• Demonstrate your problem-solving abilities with concrete examples`,
        `• Emphasize your communication and collaboration skills`,
        `• Showcase your adaptability and willingness to learn`
      ];
    }
    
    // Generate suggested phrases enhancement - ensure all phrases start with action verbs
    if (hasSuggestedPhrases) {
      // Take the top phrases from analysis (up to 5)
      analysis.suggestedPhrases.slice(0, 5).forEach((phrase) => {
        enhancementSections.suggestedPhrases.push(`• "${phrase}"`);
      });
    } else {
      // Use generic action-verb led phrases if none provided
      enhancementSections.suggestedPhrases = [
        `• "I implemented solutions that resulted in [specific outcome relevant to the role]"`,
        `• "Developed strategies that improved [relevant metric] by [percentage]"`,
        `• "Led cross-functional teams to achieve [relevant accomplishment]"`,
        `• "Analyzed complex data to identify opportunities for [relevant improvement]"`,
        `• "Collaborated with stakeholders to deliver [relevant project outcome]"`
      ];
    }
    
    // Add the enhancements at the end with clear instructions and better formatting
    let enhancedText = `${originalText}\n\n\n`;
    enhancedText += "─────── Suggested Enhancements ───────\n\n";
    enhancedText += "Please incorporate these suggestions into your cover letter. This guidance is meant to help improve your application but should be adapted to maintain your authentic voice.\n\n";
    
    if (enhancementSections.tone.length > 0) {
      enhancedText += `Tone and Style:\n`;
      enhancedText += enhancementSections.tone.join("\n");
      enhancedText += "\n\n";
    }
    
    enhancedText += "Company Insights (for first or second paragraph):\n";
    enhancedText += enhancementSections.companyInsights.join("\n");
    enhancedText += "\n\n";
    
    enhancedText += "Key Requirements (for body paragraphs):\n";
    enhancedText += enhancementSections.keyRequirements.join("\n");
    enhancedText += "\n\n";
    
    enhancedText += "Suggested Phrases with Action Verbs (integrate strategically):\n";
    enhancedText += enhancementSections.suggestedPhrases.join("\n");
    enhancedText += "\n\n";
    
    // Add an implementation example for clarity
    enhancedText += "Sample Implementation:\n";
    enhancedText += `Consider revising your opening paragraph to something like:\n\n`;
    
    // Create a sample paragraph using company insights and action verbs
    const sampleInsight = analysis.companyInsights?.[0]?.toLowerCase() || 'innovative approach and industry leadership';
    const sampleRequirement = analysis.keyRequirements?.[0] || 'the required skills';
    const sampleVerb = analysis.suggestedPhrases?.[0]?.split(' ')[0] || "Implemented";
    
    enhancedText += `"Dear Hiring Manager,\n\nI am writing to express my strong interest in the [Position] role at ${companyName}. I'm particularly drawn to ${companyName}'s ${sampleInsight}, and I believe my background in ${sampleRequirement} would allow me to contribute effectively to your team. Throughout my career, I have ${sampleVerb.toLowerCase()} solutions that align perfectly with your company's goals."\n`;

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
    let improvementFactor = Math.min(analysis.recommendations?.length * 2 || 0, 10) / 100;
    
    // Additional boost if we have company insights
    if (analysis.companyInsights && analysis.companyInsights.length > 0) {
      // Scale the boost based on how many insights we have (up to 5)
      const insightCount = Math.min(analysis.companyInsights.length, 5);
      improvementFactor += 0.03 * insightCount; // +3% per insight up to 15%
    }
    
    // Additional boost if we have key requirements
    if (analysis.keyRequirements && analysis.keyRequirements.length > 0) {
      // Scale the boost based on number of requirements (up to 5)
      const requirementCount = Math.min(analysis.keyRequirements.length, 5);
      improvementFactor += 0.03 * requirementCount; // +3% per requirement up to 15%
    }
    
    // Additional boost if we have suggested phrases
    if (analysis.suggestedPhrases && analysis.suggestedPhrases.length > 0) {
      // Count how many phrases start with action verbs
      const actionVerbCount = analysis.suggestedPhrases.filter(phrase => {
        const firstWord = phrase.split(' ')[0];
        return /^[A-Z][a-z]+ed$|^[A-Z][a-z]+s$|^[A-Z][a-z]+ing$/.test(firstWord);
      }).length;
      
      improvementFactor += 0.02 * actionVerbCount; // +2% per action verb phrase
    }
    
    // Cap the total improvement at 35%
    improvementFactor = Math.min(improvementFactor, 0.35);
    
    // Ensure the score never exceeds 100
    const updatedScore = Math.min(Math.round(originalScore * (1 + improvementFactor)), 100);
    
    return updatedScore;
  };

  return {
    applyRecommendations,
    calculateUpdatedRelevance
  };
};
