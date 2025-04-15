
import React from 'react';

interface ResultsHeaderProps {
  selectedCompanyName?: string;
  selectedRole: string;
}

const ResultsHeader: React.FC<ResultsHeaderProps> = ({ selectedCompanyName, selectedRole }) => {
  return (
    <div>
      <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-2">
        Your Resume Analysis Results
      </h1>
      <p className="text-consulting-gray">
        {selectedCompanyName ? (
          <><span className="font-medium">Company:</span> {selectedCompanyName} | <span className="font-medium">Role:</span> {selectedRole}</>
        ) : (
          <><span className="font-medium">Role:</span> {selectedRole}</>
        )}
      </p>
    </div>
  );
};

export default ResultsHeader;
