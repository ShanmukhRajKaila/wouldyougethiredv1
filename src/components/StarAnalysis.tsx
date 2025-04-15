
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
    if (improved.toLowerCase().includes("led")) {
      return "When discussing leadership experience, prepare to articulate your specific leadership style and how it evolved in this context. Be ready to explain how you handled resistance or conflicts within the team, as these stories demonstrate emotional intelligence that complements your technical skills.";
    } else if (improved.toLowerCase().includes("managed")) {
      return "For management experiences, consider preparing examples that showcase different aspects of management: resource allocation, performance development, and strategic guidance. Highlight situations where you had to make difficult trade-off decisions with limited resources.";
    } else if (improved.toLowerCase().includes("increase") || improved.toLowerCase().includes("%")) {
      return "When discussing quantifiable improvements, be prepared to explain the methodology behind your measurements and any controls you implemented. Sophisticated employers value understanding the context behind metrics as much as the numbers themselves.";
    } else if (improved.toLowerCase().includes("improve")) {
      return "With improvement initiatives, consider discussing the diagnostic process that led to your approach. Explaining how you identified the root cause of issues demonstrates analytical thinking valuable across various organizational contexts.";
    } else if (improved.toLowerCase().includes("develop")) {
      return "For development work, prepare to discuss both the technical implementation and the business value proposition. Being able to connect your technical decisions to organizational outcomes demonstrates valuable strategic thinking beyond execution.";
    } else if (improved.toLowerCase().includes("implement")) {
      return "When discussing implementations, consider preparing a brief explanation of your approach to change management and stakeholder buy-in. The most technically perfect solution fails without effective implementation strategy.";
    } else if (improved.toLowerCase().includes("create")) {
      return "For creative initiatives, prepare to discuss your inspiration sources and how you validated that your creation would solve the intended problem. This demonstrates your ability to balance innovation with pragmatic business needs.";
    } else if (improved.toLowerCase().includes("customer")) {
      return "When highlighting customer-focused work, prepare specific examples of how you gathered and incorporated customer feedback into your approach. Stories that show your ability to translate customer needs into actionable insights are particularly valuable.";
    } else if (improved.toLowerCase().includes("client")) {
      return "For client work, consider preparing examples that demonstrate how you balanced client requests with business constraints or technical limitations. Navigating these tensions effectively is a sophisticated skill that many candidates struggle to articulate.";
    } else if (improved.toLowerCase().includes("analyze")) {
      return "When discussing analytical work, prepare to explain not just your methodology but also how you communicated complex findings to different audiences. The ability to translate technical analysis into actionable business insights is increasingly valuable in data-driven organizations.";
    } else if (improved.toLowerCase().includes("research")) {
      return "For research initiatives, consider discussing how you determined research priorities and balanced exploration with execution. This demonstrates strategic thinking that extends beyond pure analytical capabilities.";
    } else if (improved.toLowerCase().includes("collaborate") || improved.toLowerCase().includes("partner")) {
      return "When highlighting collaborative experiences, prepare examples that demonstrate how you navigated different working styles or priorities across teams. Stories that show you building consensus among diverse stakeholders showcase valuable organizational intelligence.";
    } else if (improved.toLowerCase().includes("optimiz") || improved.toLowerCase().includes("efficien")) {
      return "For optimization work, be ready to discuss the broader business context that prioritized this efficiency. Understanding and articulating the balance between optimization and other business considerations demonstrates valuable strategic thinking.";
    } else if (improved.toLowerCase().includes("negotiat") || improved.toLowerCase().includes("contract")) {
      return "When discussing negotiations, prepare to explain your preparation process and how you determined your position. The methodology behind negotiation often demonstrates more sophisticated thinking than the outcome itself.";
    } else if (improved.toLowerCase().includes("present") || improved.toLowerCase().includes("communicat")) {
      return "For communication experiences, consider discussing how you adapted your approach for different audiences or in response to feedback. This flexibility demonstrates emotional intelligence that complements your technical capabilities.";
    } else {
      return "As you refine this bullet point further, consider adding a brief narrative element that illustrates the before and after states. Storytelling elements make your experiences more memorable during interviews and demonstrate the contextual understanding employers value.";
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
