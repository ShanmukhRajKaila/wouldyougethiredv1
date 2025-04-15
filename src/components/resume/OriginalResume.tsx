
import React, { useState, useEffect } from 'react';
import ResumeExtractor from './ResumeExtractor';
import { extractBulletPoints } from '@/utils/UrlExtractor';

interface OriginalResumeProps {
  resumeFile: File | null;
  onTextExtracted: (text: string) => void;
  onBulletsExtracted: (bullets: string[]) => void;
}

const OriginalResume: React.FC<OriginalResumeProps> = ({ 
  resumeFile, 
  onTextExtracted, 
  onBulletsExtracted 
}) => {
  // Add state to track if extraction has been done
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  
  // Reset extraction flag when resumeFile changes
  useEffect(() => {
    if (resumeFile) {
      setHasExtracted(false);
    }
  }, [resumeFile]);
  
  const handleTextExtracted = (text: string) => {
    // Only process if we haven't already done so
    if (!hasExtracted && text) {
      setHasExtracted(true);
      onTextExtracted(text);
      const bullets = extractBulletPoints(text);
      onBulletsExtracted(bullets);
    }
  };
  
  return (
    <ResumeExtractor 
      resumeFile={resumeFile}
      onTextExtracted={handleTextExtracted}
      onBulletsExtracted={onBulletsExtracted}
      onExtractionError={() => {}}
    />
  );
};

export default OriginalResume;
