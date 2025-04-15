
import React from 'react';

interface MissingSkillsCardProps {
  missingSkills: string[];
}

const MissingSkillsCard: React.FC<MissingSkillsCardProps> = ({ missingSkills }) => {
  if (missingSkills.length === 0) {
    return null;
  }
  
  return (
    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
      <h3 className="text-blue-800 font-medium mb-2">Key skills to highlight or develop for this role:</h3>
      <div className="flex flex-wrap gap-2">
        {missingSkills.map((skill, idx) => (
          <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
            {skill}
          </span>
        ))}
      </div>
      <p className="mt-3 text-xs text-gray-600">
        These skills are explicitly mentioned in the job description but not found in your resume. 
        Consider adding relevant experiences or demonstrating how your existing experience relates to these areas.
      </p>
    </div>
  );
};

export default MissingSkillsCard;
