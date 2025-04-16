
import React from 'react';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface StarAnalysisProps {
  starAnalysis: StarAnalysisItem[];
}

const StarAnalysis: React.FC<StarAnalysisProps> = ({ starAnalysis }) => {
  // Ensure starAnalysis is properly initialized
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  if (validStarAnalysis.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow mb-4">
        <p className="text-consulting-gray">No enhanced bullet points available for this resume.</p>
      </div>
    );
  }
  
  // Generate a personalized suggestion based on the improved bullet point
  const generateSuggestion = (improved: string): string => {
    const lowerImproved = improved.toLowerCase();
    
    if (lowerImproved.includes("led")) {
      return "Beyond stating leadership experience, prepare to discuss what specifically distinguished your leadership approach. Were you more collaborative or directive? How did you adapt your style to the specific team dynamics? Hiring managers are looking for this level of self-awareness.";
    } 
    else if (lowerImproved.includes("managed")) {
      return "When discussing management roles, be ready to articulate your framework for decision-making under constraints. Employers are particularly interested in how you handled competing priorities—this reveals your strategic thinking more effectively than listing accomplishments.";
    } 
    else if (lowerImproved.includes("increase") || lowerImproved.includes("%")) {
      return "For metrics-based achievements, prepare to discuss the 'before' state that made your improvement significant. The context of your achievement often matters more than the percentage itself, as it demonstrates your ability to identify optimization opportunities.";
    } 
    else if (lowerImproved.includes("improve")) {
      return "With improvement initiatives, consider the resistance you encountered and how you overcame it. Change management skills are often what distinguish successful professionals, yet candidates rarely articulate this dimension of their experience.";
    } 
    else if (lowerImproved.includes("develop")) {
      return "For development accomplishments, prepare to discuss the constraints you operated under. Limited resources, tight timelines, or technical debt all create a more compelling narrative than the development work alone, showcasing your adaptability.";
    } 
    else if (lowerImproved.includes("implement")) {
      return "With implementations, prepare to discuss the unexpected challenges that emerged and how you adapted. This reveals your problem-solving process and resilience—qualities that transcend specific technical skills and demonstrate your value in ambiguous situations.";
    } 
    else if (lowerImproved.includes("create")) {
      return "When discussing creative initiatives, prepare to explain the specific insight that inspired your approach. Creative solutions that connect seemingly unrelated concepts or repurpose existing resources in novel ways demonstrate intellectual flexibility that employers increasingly value.";
    } 
    else if (lowerImproved.includes("customer")) {
      return "For customer-focused work, prepare examples of when customer feedback conflicted with internal priorities. Your approach to these tensions reveals your ability to balance competing stakeholder needs—a nuanced skill that becomes increasingly valuable as you advance.";
    } 
    else if (lowerImproved.includes("client")) {
      return "In client contexts, consider discussing moments when you had to push back on client requests. Your ability to manage expectations while maintaining relationships demonstrates emotional intelligence that purely technical candidates often lack.";
    } 
    else if (lowerImproved.includes("analyze")) {
      return "With analytical achievements, prepare to discuss instances where the data pointed to counterintuitive conclusions. Your willingness to follow evidence despite conventional wisdom signals intellectual honesty that sophisticated employers highly value.";
    } 
    else if (lowerImproved.includes("research")) {
      return "For research initiatives, be ready to discuss your approach when initial hypotheses proved incorrect. The pivot process often reveals more about your capabilities than successful projects where everything went according to plan.";
    } 
    else if (lowerImproved.includes("collaborate") || lowerImproved.includes("partner")) {
      return "When highlighting collaboration, prepare examples of when you successfully integrated conflicting perspectives. Cross-functional partnerships often involve natural tensions—your ability to synthesize diverse viewpoints shows rare organizational intelligence.";
    } 
    else if (lowerImproved.includes("optimiz") || lowerImproved.includes("efficien")) {
      return "For optimization work, consider preparing examples where you identified non-obvious inefficiencies that others had overlooked. This demonstrates systems thinking and an ability to question established processes—increasingly valuable traits in evolving organizations.";
    } 
    else if (lowerImproved.includes("negotiat") || lowerImproved.includes("contract")) {
      return "When discussing negotiations, prepare to explain how you determined your BATNA (Best Alternative To Negotiated Agreement). Your preparation process often reveals more sophisticated thinking than the outcome itself.";
    } 
    else if (lowerImproved.includes("present") || lowerImproved.includes("communicat")) {
      return "For communication accomplishments, consider discussing how you've tailored complex messages for different audiences. The ability to modulate technical depth based on audience needs demonstrates rare versatility that distinguishes senior professionals.";
    } 
    else {
      return "As you prepare for interviews, consider developing a 'failure narrative' related to this experience—a setback you encountered and what you learned. Research shows candidates who can thoughtfully discuss failures appear more authentic and self-aware than those who only present successes.";
    }
  };
  
  // Generate ATS-specific advice based on the bullet point
  const generateAtsAdvice = (original: string, improved: string): string => {
    // Check what's missing from the original that was added to the improved version
    
    // Check if improved version starts with an action verb while original doesn't
    const originalFirstWord = original.split(' ')[0].replace(/[^\w]/g, '');
    const improvedFirstWord = improved.split(' ')[0].replace(/[^\w]/g, '');
    const actionVerbs = ["Led", "Managed", "Developed", "Created", "Implemented", "Designed", "Increased", "Improved", 
                         "Achieved", "Delivered", "Spearheaded", "Executed", "Coordinated", "Analyzed", "Resolved"];
    
    if (actionVerbs.includes(improvedFirstWord) && !actionVerbs.includes(originalFirstWord)) {
      return "ATS systems are programmed to prioritize bullet points that start with strong action verbs. This simple formatting change significantly increases visibility to both algorithms and recruiters.";
    }
    
    if (improved.includes('%') && !original.includes('%')) {
      return "ATS systems prioritize quantifiable achievements. Numbers grab attention and provide concrete evidence of your impact, making your resume stand out in keyword-based filtering.";
    }
    
    if ((improved.match(/\$\d+[k|K|M]?/) || improved.match(/\d+\s*(dollars|USD)/i)) && 
        !(original.match(/\$\d+[k|K|M]?/) || original.match(/\d+\s*(dollars|USD)/i))) {
      return "ATS systems are trained to identify financial impact. Including dollar amounts helps your resume pass both algorithmic and human screening by demonstrating value creation.";
    }
    
    if ((improved.match(/\d+\s*(people|team members|employees|staff)/i)) && 
        !(original.match(/\d+\s*(people|team members|employees|staff)/i))) {
      return "ATS systems look for management scope. Quantifying team size signals leadership capability and organizational impact, which are key factors in advanced keyword algorithms.";
    }
    
    if ((improved.toLowerCase().includes("result") || 
        improved.toLowerCase().includes("leading to") || 
        improved.toLowerCase().includes("achieving")) &&
        !(original.toLowerCase().includes("result") || 
        original.toLowerCase().includes("leading to") || 
        original.toLowerCase().includes("achieving"))) {
      return "ATS systems are programmed to identify cause-effect relationships using the STAR method. Explicitly linking actions to outcomes significantly increases your resume's ranking in applicant pools.";
    }
    
    // Check for STAR method components
    const hasSTAR = improved.toLowerCase().includes("after") || improved.toLowerCase().includes("when") || 
                    improved.toLowerCase().includes("following") || improved.toLowerCase().includes("due to") ||
                    improved.toLowerCase().includes("resulting in") || improved.toLowerCase().includes("which led to");
                    
    if (hasSTAR && !original.toLowerCase().includes("after") && !original.toLowerCase().includes("when") &&
        !original.toLowerCase().includes("following") && !original.toLowerCase().includes("due to") &&
        !original.toLowerCase().includes("resulting in") && !original.toLowerCase().includes("which led to")) {
      return "ATS systems increasingly use semantic analysis to identify complete STAR method narratives (Situation, Task, Action, Result). Connecting your actions to specific contexts and outcomes boosts keyword relevance scores.";
    }
    
    return "ATS systems prioritize specific, concrete language over general descriptions. Adding industry terminology and metrics substantially increases match scores with job requirement algorithms.";
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-serif font-bold text-consulting-navy mb-2">
          STAR Analysis Enhancement
        </h2>
        <p className="text-consulting-gray mb-4">
          Below are your original experience bullet points transformed to better align with ATS (Applicant Tracking System) scanning patterns and hiring manager preferences.
        </p>
        <div className="bg-consulting-lightblue p-4 rounded-md">
          <h3 className="font-medium text-consulting-navy mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1 text-consulting-accent" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            ATS Optimization Strategy
          </h3>
          <p className="text-consulting-gray text-sm mb-2">
            <strong>S</strong>ituation, <strong>T</strong>ask, <strong>A</strong>ction, <strong>R</strong>esult - This framework helps reshape your experience into compelling narratives that pass ATS filters and resonate with hiring managers.
          </p>
          <div className="flex flex-col space-y-1 mt-2 text-sm text-consulting-gray">
            <p className="font-medium text-consulting-navy">Key ATS Optimization Rules:</p>
            <p>1. <span className="font-medium">Start with action verbs</span> - Begin each bullet point with a strong action verb like "Led" or "Implemented"</p>
            <p>2. <span className="font-medium">Quantify results</span> - Include specific numbers, percentages and metrics whenever possible</p>
            <p>3. <span className="font-medium">Use complete STAR format</span> - Include the Situation/Task, Action, and Result in each bullet point</p>
            <p>4. <span className="font-medium">Include keywords</span> - Incorporate relevant industry and role-specific terminology</p>
          </div>
        </div>
      </div>
      
      {validStarAnalysis.map((item, index) => (
        <div key={index} className="p-6 bg-white rounded-lg shadow mb-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-red-100 text-red-500 rounded-full mr-2 text-xs font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </span>
                Original Bullet Point:
              </h3>
              <p className="p-3 bg-gray-100 rounded text-consulting-gray">{item.original}</p>
            </div>
            
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-500 rounded-full mr-2 text-xs font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </span>
                ATS-Optimized Version:
              </h3>
              <p className="p-3 bg-consulting-lightblue rounded text-consulting-blue font-medium">
                {item.improved}
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1 flex items-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-amber-100 text-amber-500 rounded-full mr-2 text-xs font-bold">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </span>
                Why This Improves Alignment:
              </h3>
              <p className="text-consulting-gray">{item.feedback}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-consulting-charcoal font-medium">Interview Preparation:</p>
                <p className="text-xs text-consulting-gray mt-1">{generateSuggestion(item.improved)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-xs text-consulting-charcoal font-medium">ATS Insight:</p>
                <p className="text-xs text-consulting-gray mt-1">{generateAtsAdvice(item.original, item.improved)}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StarAnalysis;
