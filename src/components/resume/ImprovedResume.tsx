
import React from 'react';
import MissingSkillsCard from './MissingSkillsCard';
import EnhancedExperience from './EnhancedExperience';
import RecommendedAdditions from './RecommendedAdditions';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface ImprovedResumeProps {
  resumeBullets: string[];
  improvedBullets: Record<string, StarAnalysisItem>;
  missingSkills: string[];
  recommendations: string[] | undefined;
}

const ImprovedResume: React.FC<ImprovedResumeProps> = ({ 
  resumeBullets, 
  improvedBullets,
  missingSkills,
  recommendations
}) => {
  return (
    <div className="space-y-6">
      <MissingSkillsCard missingSkills={missingSkills} />
      
      <EnhancedExperience 
        resumeBullets={resumeBullets}
        improvedBullets={improvedBullets}
      />
      
      <RecommendedAdditions recommendations={recommendations} />
    </div>
  );
};

export default ImprovedResume;
