
import React from 'react';
import { useAppContext } from '@/context/AppContext';

const ProgressBar = () => {
  const { progress } = useAppContext();
  
  return (
    <div className="w-full mb-8">
      <div className="progress-bar">
        <div 
          className="progress-bar-fill" 
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="flex justify-between mt-2 text-sm text-consulting-gray">
        <span>Start</span>
        <span>Job Description</span>
        <span>Resume</span>
        <span>Analysis</span>
        <span>Results</span>
      </div>
    </div>
  );
};

export default ProgressBar;
