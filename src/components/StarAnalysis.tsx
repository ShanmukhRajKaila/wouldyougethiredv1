
import React from 'react';

interface StarAnalysisProps {
  starAnalysis: {
    original: string;
    improved: string;
    feedback: string;
  }[];
}

const StarAnalysis: React.FC<StarAnalysisProps> = ({ starAnalysis }) => {
  if (!starAnalysis || starAnalysis.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow mb-4">
        <p className="text-consulting-gray">No STAR analysis available for this resume.</p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif font-bold text-consulting-navy">
        STAR Method Analysis
      </h2>
      <p className="text-consulting-gray">
        The STAR method (Situation, Task, Action, Result) helps structure your resume bullets for maximum impact. 
        Here's how your experience could be better communicated:
      </p>
      
      {starAnalysis.map((item, index) => (
        <div key={index} className="p-6 bg-white rounded-lg shadow mb-4">
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1">Original Bullet:</h3>
              <p className="p-3 bg-gray-100 rounded text-consulting-gray">"{item.original}"</p>
            </div>
            
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1">Improved Version:</h3>
              <p className="p-3 bg-consulting-lightblue rounded text-consulting-blue font-medium">
                "{item.improved}"
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-consulting-charcoal mb-1">Why It's Better:</h3>
              <p className="text-consulting-gray">{item.feedback}</p>
            </div>
            
            <div className="grid grid-cols-4 gap-2 mt-4">
              <div className="bg-consulting-navy/10 p-2 rounded">
                <p className="text-xs font-bold text-consulting-navy">Situation</p>
                <p className="text-xs">Context & challenge</p>
              </div>
              <div className="bg-consulting-navy/10 p-2 rounded">
                <p className="text-xs font-bold text-consulting-navy">Task</p>
                <p className="text-xs">Your responsibility</p>
              </div>
              <div className="bg-consulting-navy/10 p-2 rounded">
                <p className="text-xs font-bold text-consulting-navy">Action</p>
                <p className="text-xs">How you did it</p>
              </div>
              <div className="bg-consulting-navy/20 p-2 rounded">
                <p className="text-xs font-bold text-consulting-navy">Result</p>
                <p className="text-xs">Quantifiable impact</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StarAnalysis;
