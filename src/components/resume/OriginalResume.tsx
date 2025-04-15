
import React from 'react';
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
  const handleTextExtracted = (text: string) => {
    onTextExtracted(text);
    const bullets = extractBulletPoints(text);
    onBulletsExtracted(bullets);
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
