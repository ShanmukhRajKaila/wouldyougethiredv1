
import React, { useState } from 'react';
import ImprovedBulletPoint from './ImprovedBulletPoint';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface EnhancedExperienceProps {
  resumeBullets: string[];
  improvedBullets: Record<string, StarAnalysisItem>;
}

const EnhancedExperience: React.FC<EnhancedExperienceProps> = ({ 
  resumeBullets, 
  improvedBullets 
}) => {
  const [displayLimit, setDisplayLimit] = useState<number>(5);
  
  if (resumeBullets.length === 0) {
    return (
      <div className="p-6">
        <p className="text-consulting-gray">No bullet points detected in your resume.</p>
      </div>
    );
  }

  const handleShowMore = () => {
    setDisplayLimit(prevLimit => prevLimit + 5);
  };

  const displayedBullets = resumeBullets.slice(0, displayLimit);
  const hasMoreToShow = displayLimit < resumeBullets.length;
  
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
        Enhanced Experience Bullets
      </h2>
      
      <p className="text-sm text-gray-500 mb-4">
        Showing {displayedBullets.length} of {resumeBullets.length} bullet points
      </p>
      
      <div className="space-y-6">
        {displayedBullets.map((bullet, idx) => {
          const cleanBullet = bullet.trim();
          const improved = improvedBullets[cleanBullet];
          
          return (
            <ImprovedBulletPoint 
              key={idx}
              originalBullet={cleanBullet}
              improvedBullet={improved}
            />
          );
        })}
      </div>
      
      {hasMoreToShow && (
        <div className="flex justify-center mt-6">
          <button 
            onClick={handleShowMore}
            className="px-4 py-2 bg-consulting-navy text-white rounded-md hover:bg-consulting-blue transition-colors"
          >
            Load More Bullet Points
          </button>
        </div>
      )}
    </div>
  );
};

export default EnhancedExperience;
