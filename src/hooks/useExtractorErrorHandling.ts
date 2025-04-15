
import { toast } from 'sonner';
import { AppStage } from '@/context/types';

interface ExtractorErrorHandlingProps {
  setCurrentStage: (stage: AppStage) => void;
  setIsSubmitting: (value: boolean) => void;
}

export const useExtractorErrorHandling = ({ 
  setCurrentStage, 
  setIsSubmitting 
}: ExtractorErrorHandlingProps) => {
  
  const handleExtractionError = (errorType: 'resume' | 'coverLetter' | 'jobDescription') => {
    const errorMessage = errorType === 'resume' 
      ? 'Could not properly read your resume. Please try uploading a Word document (.docx) or a .txt file instead.'
      : errorType === 'coverLetter'
      ? 'Could not properly read your cover letter. Please try uploading a Word document (.docx) or a .txt file instead.'
      : 'The job description content may be invalid. Please check and try again if needed.';
    
    toast.error(errorMessage);
    setCurrentStage(errorType === 'jobDescription' ? 'jobDescription' : 'resumeUpload');
    setIsSubmitting(false);
  };
  
  const validateExtractedText = (text: string | null | undefined, type: 'resume' | 'coverLetter' | 'jobDescription'): boolean => {
    // Ensure text is a non-empty string
    if (!text || typeof text !== 'string' || text.length === 0) {
      handleExtractionError(type);
      return false;
    }
    
    // Enhanced validation for any extracted text
    if (text.includes('Error extracting') || 
        text.includes('binary file') || 
        text.includes('unable to parse') ||
        text.includes('invalid format')) {
      handleExtractionError(type);
      return false;
    }
    
    // Length validation based on content type with improved thresholds
    if ((type === 'resume' && text.length < 200) ||
        (type === 'coverLetter' && text.length < 100)) {
      handleExtractionError(type);
      return false;
    }
    
    // Enhanced validation for job descriptions - MUCH LESS AGGRESSIVE
    if (type === 'jobDescription') {
      // Only check for obvious non-job description content
      const invalidPatterns = [
        /404 not found/i,
        /page\s*not\s*found/i,
        /access\s*denied/i
      ];
      
      // Only fail if multiple invalid patterns match
      const matchCount = invalidPatterns.filter(pattern => text.match(pattern)).length;
      if (matchCount >= 2) {
        handleExtractionError(type);
        return false;
      }
      
      // Only do minimal check for extremely short content
      if (text.length < 50) {
        handleExtractionError(type);
        return false;
      }
    }
    
    return true;
  };
  
  return { validateExtractedText };
};
