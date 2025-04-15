
import React from 'react';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface ImprovedBulletPointProps {
  originalBullet: string;
  improvedBullet?: StarAnalysisItem;
}

const ImprovedBulletPoint: React.FC<ImprovedBulletPointProps> = ({ 
  originalBullet, 
  improvedBullet 
}) => {
  const cleanBullet = originalBullet.trim();
  
  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <div className="text-consulting-charcoal mb-2">
        <h3 className="text-sm text-gray-500">Original:</h3>
        <p className="text-sm italic text-gray-600 mb-3">"{cleanBullet}"</p>
        
        <h3 className="text-sm text-consulting-blue">Enhanced:</h3>
        {improvedBullet ? (
          <>
            <p className="font-medium text-consulting-navy">{improvedBullet.improved}</p>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <h4 className="text-xs font-semibold text-gray-500">Why this improves alignment:</h4>
              <p className="text-xs text-gray-600 mt-1">{improvedBullet.feedback}</p>
            </div>
          </>
        ) : (
          <div className="p-3 bg-gray-100 border border-gray-200 rounded text-gray-600">
            <p className="font-medium text-gray-700">This bullet point is already well-written for this role.</p>
            <p className="mt-2 text-sm">
              <span className="font-semibold">Justification:</span> This experience demonstrates relevant skills and 
              uses appropriate terminology for the position. It effectively highlights your capabilities in a 
              way that aligns with the job requirements. For maximum impact, consider adding specific metrics 
              or quantifiable results if available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImprovedBulletPoint;
