
import React, { useState, useEffect } from 'react';
import ResumeExtractor from './ResumeExtractor';
import { extractBulletPoints } from '@/utils/UrlExtractor';
import { toast } from 'sonner';

interface OriginalResumeProps {
  resumeFile: File | null;
  onTextExtracted: (text: string) => void;
  onBulletsExtracted: (bullets: string[]) => void;
  onExtractionError?: (error: string | null) => void;
}

const OriginalResume: React.FC<OriginalResumeProps> = ({ 
  resumeFile, 
  onTextExtracted, 
  onBulletsExtracted,
  onExtractionError = () => {} 
}) => {
  // Add state to track if extraction has been done
  const [hasExtracted, setHasExtracted] = useState<boolean>(false);
  const [extractionAttempts, setExtractionAttempts] = useState<number>(0);
  const maxExtractionAttempts = 2;
  
  // Reset extraction flag when resumeFile changes
  useEffect(() => {
    if (resumeFile) {
      setHasExtracted(false);
      setExtractionAttempts(0);
    }
  }, [resumeFile]);
  
  const handleTextExtracted = (text: string) => {
    // Only process if we haven't already done so
    if (!hasExtracted && text) {
      setHasExtracted(true);
      
      try {
        onTextExtracted(text);
        const bullets = extractBulletPoints(text);
        onBulletsExtracted(bullets || []);
      } catch (error) {
        console.error('Error processing extracted text:', error);
        
        // If there was an error in processing, but we have text, still try to use it
        if (extractionAttempts < maxExtractionAttempts) {
          setExtractionAttempts(prev => prev + 1);
          setHasExtracted(false); // Reset so we can try again
          
          // Simple fallback if bullet points extraction failed
          if (text.length > 0) {
            const simpleLines = text.split(/[\n\r]+/).filter(line => 
              line && line.trim().length > 20 && line.trim().length < 200
            ).slice(0, 5);
            
            onBulletsExtracted(simpleLines);
          }
        } else {
          toast.error('Error processing resume content.');
        }
      }
    }
  };
  
  return (
    <ResumeExtractor 
      resumeFile={resumeFile}
      onTextExtracted={handleTextExtracted}
      onBulletsExtracted={onBulletsExtracted}
      onExtractionError={onExtractionError}
    />
  );
};

export default OriginalResume;
