
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
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-consulting-navy">
        Enhanced Experience Statements
      </h2>
      <p className="text-consulting-gray">
        Here's how your experience could be better communicated to highlight relevant skills and achievements:
      </p>
      
      {validStarAnalysis.map((item, index) => (
        <div key={index} className="p-6 bg-white rounded-lg shadow mb-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1">Original:</h3>
              <p className="p-3 bg-gray-100 rounded text-consulting-gray">"{item.original}"</p>
            </div>
            
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1">ATS-Optimized Version:</h3>
              <p className="p-3 bg-consulting-lightblue rounded text-consulting-blue font-medium">
                "{item.improved}"
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1">Why It Improves Alignment:</h3>
              <p className="text-consulting-gray">{item.feedback}</p>
            </div>
            
            <div className="bg-gray-50 p-3 rounded mt-2">
              <p className="text-xs text-consulting-charcoal font-medium">Next step suggestion:</p>
              <p className="text-xs text-consulting-gray mt-1">{generateSuggestion(item.improved)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StarAnalysis;
