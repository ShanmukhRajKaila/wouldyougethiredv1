
import React from 'react';

interface RecommendedAdditionsProps {
  recommendations: string[] | undefined;
}

const RecommendedAdditions: React.FC<RecommendedAdditionsProps> = ({ recommendations }) => {
  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200">
      <h2 className="text-lg font-semibold text-consulting-navy mb-3">
        Recommended Additions for this Role
      </h2>
      {recommendations && recommendations.length > 0 ? (
        <ul className="list-disc pl-6 space-y-3 text-sm">
          {recommendations.map((recommendation, idx) => (
            <li key={idx} className="text-gray-700">{recommendation}</li>
          ))}
        </ul>
      ) : (
        <ul className="list-disc pl-6 space-y-3 text-sm">
          <li className="text-gray-700">
            <span className="font-medium">Skills emphasis:</span> Highlight any experience with stakeholder management, communication, and project delivery
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Quantify results:</span> Add metrics and specific outcomes to strengthen your bullet points
          </li>
          <li className="text-gray-700">
            <span className="font-medium">Keywords:</span> Incorporate terminology from the job description into your resume
          </li>
        </ul>
      )}
    </div>
  );
};

export default RecommendedAdditions;
