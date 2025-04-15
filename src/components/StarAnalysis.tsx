
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
    if (improved.toLowerCase().includes("led") || improved.toLowerCase().includes("managed")) {
      return "Emphasize leadership abilities by quantifying the team size and outcome achievements. Consider adding metrics like team growth or performance improvements under your guidance.";
    } else if (improved.toLowerCase().includes("increase") || improved.toLowerCase().includes("improve") || improved.toLowerCase().includes("%")) {
      return "Continue highlighting measurable results with specific metrics. Consider adding the timeframe in which these results were achieved to provide more context.";
    } else if (improved.toLowerCase().includes("develop") || improved.toLowerCase().includes("implement") || improved.toLowerCase().includes("create")) {
      return "Elaborate further on your technical contributions by mentioning specific technologies or methodologies used. Consider adding the business impact of your implementation.";
    } else if (improved.toLowerCase().includes("customer") || improved.toLowerCase().includes("client")) {
      return "When discussing client-facing work, quantify the client base and highlight your direct impact on client satisfaction or retention metrics.";
    } else if (improved.toLowerCase().includes("analyze") || improved.toLowerCase().includes("research")) {
      return "For analytical achievements, consider specifying the tools or methodologies used and how your insights directly impacted business decisions.";
    } else {
      return "Consider adding specific industry terminology and quantifiable metrics to further enhance this bullet point and demonstrate your impact more clearly.";
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
