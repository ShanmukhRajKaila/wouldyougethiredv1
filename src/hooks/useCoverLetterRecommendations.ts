import { CoverLetterAnalysis } from '@/context/types';

export const useCoverLetterRecommendations = () => {
  // Action verbs library for ATS optimization - expanded with more powerful leadership verbs
  const actionVerbs = [
    // Leadership verbs
    "Led", "Spearheaded", "Managed", "Directed", "Oversaw", "Supervised", "Chaired", "Coordinated",
    // Achievement verbs
    "Achieved", "Attained", "Completed", "Delivered", "Exceeded", "Improved", "Increased", "Reduced",
    // Initiative verbs
    "Launched", "Created", "Developed", "Established", "Founded", "Implemented", "Initiated", "Introduced",
    // Analysis verbs
    "Analyzed", "Assessed", "Calculated", "Diagnosed", "Evaluated", "Examined", "Identified", "Researched",
    // Communication verbs
    "Authored", "Collaborated", "Consulted", "Educated", "Negotiated", "Presented", "Promoted", "Recommended",
    // Technical verbs
    "Administered", "Configured", "Designed", "Engineered", "Integrated", "Optimized", "Programmed", "Streamlined",
    // Problem-solving verbs
    "Resolved", "Solved", "Transformed", "Troubleshot", "Revamped", "Revitalized", "Pioneered", "Formulated"
  ];

  // MANDATORY: Always ensure phrases start with a strong action verb
  const enforceActionVerbStart = (phrase: string): string => {
    // Check if phrase already starts with an action verb
    const firstWord = phrase.split(' ')[0].replace(/[^\w]/g, '');
    
    if (!actionVerbs.includes(firstWord)) {
      // Select an appropriate action verb based on content
      let verb = selectContextualActionVerb(phrase);
      
      // Format the phrase to start with the action verb
      // Remove any existing verb-like starts and capitalize first letter of remaining text
      const cleanedPhrase = phrase.replace(/^(I |We |They |He |She |The team |The company |The department )/i, '');
      return `${verb} ${cleanedPhrase.charAt(0).toLowerCase()}${cleanedPhrase.slice(1)}`;
    }
    
    return phrase;
  };
  
  // Select an action verb that matches the context of the phrase
  const selectContextualActionVerb = (phrase: string): string => {
    const lowerPhrase = phrase.toLowerCase();
    
    // Leadership context
    if (lowerPhrase.includes("team") || lowerPhrase.includes("group") || lowerPhrase.includes("department")) {
      return getRandomVerb(["Led", "Spearheaded", "Managed", "Directed", "Oversaw", "Supervised"]);
    }
    
    // Achievement context
    if (lowerPhrase.includes("achiev") || lowerPhrase.includes("accomplish") || lowerPhrase.includes("success")) {
      return getRandomVerb(["Achieved", "Attained", "Delivered", "Exceeded", "Accomplished"]);
    }
    
    // Improvement context
    if (lowerPhrase.includes("improv") || lowerPhrase.includes("enhanc") || lowerPhrase.includes("increas") || 
        lowerPhrase.includes("better") || lowerPhrase.includes("reduc")) {
      return getRandomVerb(["Improved", "Enhanced", "Increased", "Optimized", "Strengthened", "Reduced"]);
    }
    
    // Creation context
    if (lowerPhrase.includes("creat") || lowerPhrase.includes("develop") || lowerPhrase.includes("build") || 
        lowerPhrase.includes("design") || lowerPhrase.includes("launch")) {
      return getRandomVerb(["Created", "Developed", "Designed", "Established", "Launched", "Implemented"]);
    }
    
    // Analysis context
    if (lowerPhrase.includes("analyz") || lowerPhrase.includes("research") || lowerPhrase.includes("stud") || 
        lowerPhrase.includes("examin") || lowerPhrase.includes("assess")) {
      return getRandomVerb(["Analyzed", "Researched", "Assessed", "Evaluated", "Examined", "Identified"]);
    }
    
    // Problem-solving context
    if (lowerPhrase.includes("solv") || lowerPhrase.includes("fix") || lowerPhrase.includes("resolv") || 
        lowerPhrase.includes("problem") || lowerPhrase.includes("issue")) {
      return getRandomVerb(["Resolved", "Solved", "Addressed", "Troubleshot", "Remedied"]);
    }
    
    // Communication context
    if (lowerPhrase.includes("communicat") || lowerPhrase.includes("present") || lowerPhrase.includes("speak") || 
        lowerPhrase.includes("report") || lowerPhrase.includes("writ")) {
      return getRandomVerb(["Communicated", "Presented", "Authored", "Articulated", "Conveyed"]);
    }
    
    // Default to general strong verbs if no specific context is found
    return getRandomVerb(["Implemented", "Developed", "Managed", "Executed", "Coordinated", "Delivered"]);
  };
  
  // Get a random verb from the specific category
  const getRandomVerb = (verbs: string[]): string => {
    return verbs[Math.floor(Math.random() * verbs.length)];
  };

  const applyRecommendations = (coverLetterText: string, analysis: CoverLetterAnalysis): string => {
    // Ensure cover letter insights are action verb-driven
    const enhanceWithActionVerbs = (phrases: string[]): string[] => {
      return phrases.map(phrase => enforceActionVerbStart(phrase));
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
          "Demonstrated technical expertise in cutting-edge technologies",
          "Highlighted problem-solving skills through concrete examples",
          "Showcased ability to collaborate across cross-functional teams",
          "Illustrated leadership potential and strategic thinking",
          "Proved adaptability in dynamic and challenging environments"
        ];

    // Enhance suggested phrases with action verb optimization and STAR method
    const suggestedPhrases = analysis.suggestedPhrases
      ? enhanceWithActionVerbs(analysis.suggestedPhrases)
      : [
          "Engineered solutions that directly addressed critical business challenges, resulting in 30% improved efficiency",
          "Delivered measurable results that exceeded key performance indicators by identifying process bottlenecks",
          "Transformed team dynamics through innovative leadership approaches, increasing productivity by 25%",
          "Developed strategic frameworks that optimized operational efficiency after analyzing workflow inefficiencies",
          "Spearheaded initiatives that generated significant competitive advantages by leveraging market research"
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
    
    // STAR method explanation for ATS optimization
    enhancementSections.tone.push(`• Apply the STAR method (Situation, Task, Action, Result) in your accomplishments`);
    enhancementSections.tone.push(`• Quantify achievements with specific numbers and percentages where possible`);
    
    // Generate company insight enhancement - ensure we have at least 5 insights
    if (hasCompanyInsights) {
      // Take up to 5 insights from analysis
      const insightsToShow = analysis.companyInsights.slice(0, 5);
      insightsToShow.forEach((insight) => {
        enhancementSections.companyInsights.push(`• ${enforceActionVerbStart(insight)}`);
      });
    } else {
      // Generic placeholders if no insights were found
      enhancementSections.companyInsights = [
        `• Researched ${companyName}'s mission statement and reference it specifically`,
        `• Identified a recent company achievement or news item to demonstrate knowledge`,
        `• Analyzed the company's core values and how they align with your professional beliefs`,
        `• Examined specific products or services the company offers to show targeted interest`,
        `• Demonstrated how your values align with the company's vision through specific examples`
      ];
    }
    
    // Generate key requirements enhancement - ensure we have at least 5 requirements with STAR formatting
    if (hasKeyRequirements) {
      // Take up to 5 requirements from analysis and format using STAR
      const requirementsToShow = analysis.keyRequirements.slice(0, 5);
      requirementsToShow.forEach((requirement) => {
        const formattedRequirement = enforceActionVerbStart(requirement);
        enhancementSections.keyRequirements.push(`• ${formattedRequirement} (include a specific example with measurable result)`);
      });
      
      // Add generic requirements if we don't have enough
      if (requirementsToShow.length < 5) {
        const genericRequirements = [
          "Demonstrated technical expertise relevant to the role by implementing [specific technology/method]",
          "Leveraged communication skills by successfully presenting to executive stakeholders",
          "Resolved complex problems by applying [specific methodology] resulting in [measurable outcome]",
          "Led cross-functional teams to achieve [specific goal] within [timeframe]",
          "Utilized industry knowledge to identify [specific opportunity] leading to [business impact]"
        ];
        
        for (let i = requirementsToShow.length; i < 5; i++) {
          enhancementSections.keyRequirements.push(`• ${genericRequirements[i % genericRequirements.length]}`);
        }
      }
    } else {
      // Generic placeholders if no requirements were found - all with strong action verbs
      enhancementSections.keyRequirements = [
        `• Demonstrated technical expertise by implementing [specific tools] mentioned in the job posting`,
        `• Solved complex problems by applying [methodology], resulting in [measurable outcome]`,
        `• Led collaborative initiatives with cross-functional teams, achieving [specific result]`,
        `• Developed innovative solutions that increased [relevant metric] by [percentage]`,
        `• Executed strategic projects that aligned with company objectives, resulting in [business impact]`
      ];
    }
    
    // Generate suggested phrases enhancement - ensure all phrases start with action verbs and include STAR elements
    if (hasSuggestedPhrases) {
      // Take the top phrases from analysis (up to 5) and ensure they all start with action verbs
      analysis.suggestedPhrases.slice(0, 5).forEach((phrase) => {
        enhancementSections.suggestedPhrases.push(`• "${enforceActionVerbStart(phrase)}"`);
      });
    } else {
      // Use generic action-verb led phrases with STAR components if none provided
      enhancementSections.suggestedPhrases = [
        `• "Implemented solutions that resulted in [specific outcome relevant to the role] after identifying [specific challenge]"`,
        `• "Spearheaded process improvements that reduced [metric] by [percentage] through detailed workflow analysis"`,
        `• "Led cross-functional teams of [team size] to deliver [relevant project] under budget by [amount/percentage]"`,
        `• "Analyzed complex data sets to identify opportunities for [relevant improvement], resulting in [business impact]"`,
        `• "Developed strategic partnerships with [stakeholder type], increasing [relevant metric] by [percentage]"`
      ];
    }
    
    // Add the enhancements at the end with clear instructions and better formatting
    let enhancedText = `${originalText}\n\n\n`;
    enhancedText += "─────── Suggested Enhancements ───────\n\n";
    enhancedText += "Please incorporate these ATS-optimized suggestions into your cover letter. This guidance is designed to help your application pass automated screening systems while maintaining your authentic voice.\n\n";
    
    if (enhancementSections.tone.length > 0) {
      enhancedText += `Tone and ATS Strategy:\n`;
      enhancedText += enhancementSections.tone.join("\n");
      enhancedText += "\n\n";
    }
    
    enhancedText += "Company Insights (for first or second paragraph):\n";
    enhancedText += enhancementSections.companyInsights.join("\n");
    enhancedText += "\n\n";
    
    enhancedText += "Key Requirements (for body paragraphs using STAR method):\n";
    enhancedText += enhancementSections.keyRequirements.join("\n");
    enhancedText += "\n\n";
    
    enhancedText += "Suggested ATS-Optimized Phrases (with action verbs):\n";
    enhancedText += enhancementSections.suggestedPhrases.join("\n");
    enhancedText += "\n\n";
    
    // Add an implementation example for clarity
    enhancedText += "Sample ATS-Optimized Implementation:\n";
    enhancedText += `Consider revising your experience paragraph to something like:\n\n`;
    
    // Create a sample paragraph using company insights, action verbs, and STAR method
    const sampleInsight = analysis.companyInsights?.[0]?.toLowerCase() || 'innovative approach and industry leadership';
    const sampleRequirement = analysis.keyRequirements?.[0] || 'the required skills';
    const sampleVerb = actionVerbs[Math.floor(Math.random() * actionVerbs.length)];
    
    enhancedText += `"Dear Hiring Manager,\n\nI am writing to express my strong interest in the [Position] role at ${companyName}. After researching ${companyName}'s ${sampleInsight}, I'm particularly impressed by the company's commitment to innovation and excellence. Throughout my career, I have ${sampleVerb.toLowerCase()} projects that closely align with your requirements for ${sampleRequirement}, resulting in [specific measurable outcome] that demonstrates my ability to deliver value immediately to your team."\n`;

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
        return actionVerbs.includes(firstWord);
      }).length;
      
      improvementFactor += 0.02 * actionVerbCount; // +2% per action verb phrase
    }
    
    // Enhanced boost for STAR method implementation
    const starMethodImplementation = analysis.suggestedPhrases?.filter(phrase => 
      (phrase.includes("resulting in") || phrase.includes("leading to") || phrase.includes("achieved") || 
       phrase.includes("increased") || phrase.includes("reduced") || phrase.includes("improved")) &&
      /\d+%|\d+ percent|by \d+/.test(phrase)  // Contains numbers/percentages
    ).length || 0;
    
    improvementFactor += 0.03 * starMethodImplementation; // +3% per phrase with quantifiable results
    
    // Cap the total improvement at 40%
    improvementFactor = Math.min(improvementFactor, 0.40);
    
    // Ensure the score never exceeds 100
    const updatedScore = Math.min(Math.round(originalScore * (1 + improvementFactor)), 100);
    
    return updatedScore;
  };

  return {
    applyRecommendations,
    calculateUpdatedRelevance
  };
};
