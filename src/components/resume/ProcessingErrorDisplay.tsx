
import React from 'react';

interface ProcessingErrorDisplayProps {
  processingError: string | null;
}

const ProcessingErrorDisplay: React.FC<ProcessingErrorDisplayProps> = ({ processingError }) => {
  if (!processingError) return null;
  
  return (
    <div className="mb-8 p-4 border border-red-300 bg-red-50 rounded-md">
      <h3 className="font-medium text-red-700 mb-2">Analysis Error</h3>
      <p className="text-sm text-red-600">{processingError}</p>
      <p className="text-sm text-gray-600 mt-2">
        For better results:
        <ul className="list-disc pl-5 mt-1">
          <li>Try using a Word document (.docx) or plain text (.txt) format</li>
          <li>Reduce the size of your resume (2-3 pages maximum)</li>
          <li>Remove any images or complex formatting</li>
        </ul>
      </p>
    </div>
  );
};

export default ProcessingErrorDisplay;
