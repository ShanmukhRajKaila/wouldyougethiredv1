
import React from 'react';
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
  if (!resumeBullets || resumeBullets.length === 0) {
    return (
      <div className="p-6">
        <p className="text-consulting-gray">No bullet points detected in your resume.</p>
      </div>
    );
  }

  // Filter out empty bullets
  const validBullets = resumeBullets.filter(bullet => bullet.trim().length > 0);

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
        Enhanced Experience Bullets
      </h2>
      <div className="space-y-6">
        {validBullets.map((bullet, idx) => {
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
    </div>
  );
};

export default EnhancedExperience;
