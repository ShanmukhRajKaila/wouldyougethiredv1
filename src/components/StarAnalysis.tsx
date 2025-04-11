
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
              <p className="text-xs text-consulting-charcoal font-medium">Pro tip: This enhanced version better aligns with the role requirements while incorporating industry terminology that helps pass ATS screening and demonstrates your relevant experience.</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StarAnalysis;
