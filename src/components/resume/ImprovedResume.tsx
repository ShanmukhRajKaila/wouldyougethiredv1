
import React from 'react';
import MissingSkillsCard from './MissingSkillsCard';
import EnhancedExperience from './EnhancedExperience';
import RecommendedAdditions from './RecommendedAdditions';
import Gauge from '@/components/Gauge';

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
  improvedText?: string;
  updatedAlignmentScore?: number;
}

const ImprovedResume: React.FC<ImprovedResumeProps> = ({ 
  resumeBullets, 
  improvedBullets,
  missingSkills,
  recommendations,
  improvedText,
  updatedAlignmentScore
}) => {
  return (
    <div className="space-y-6">
      {updatedAlignmentScore && updatedAlignmentScore > 0 && (
        <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
          <h3 className="text-md font-medium text-consulting-navy mb-2">Enhanced Alignment Score</h3>
          <div className="flex items-center">
            <div className="w-full max-w-[300px]">
              <Gauge 
                value={updatedAlignmentScore} 
                size="md" 
                showLabel={true}
                className="mb-1"
              />
            </div>
            <div className="ml-4 text-sm text-gray-600">
              <p>After applying ATS-optimized bullet points</p>
            </div>
          </div>
        </div>
      )}
      
      <MissingSkillsCard missingSkills={missingSkills} />
      
      <EnhancedExperience 
        resumeBullets={resumeBullets}
        improvedBullets={improvedBullets}
      />
      
      {improvedText && (
        <div className="bg-white p-4 rounded-lg border border-blue-200 mt-4">
          <h3 className="text-md font-medium text-consulting-navy mb-2">Complete Enhanced Resume</h3>
          <div className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm text-gray-700">
            {improvedText}
          </div>
        </div>
      )}
      
      <RecommendedAdditions recommendations={recommendations} />
    </div>
  );
};

export default ImprovedResume;
