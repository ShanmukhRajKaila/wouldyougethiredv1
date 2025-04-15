
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
      : 'The job description content appears to be invalid. Please enter it manually.';
    
    toast.error(errorMessage);
    setCurrentStage(errorType === 'jobDescription' ? 'jobDescription' : 'resumeUpload');
    setIsSubmitting(false);
  };
  
  const validateExtractedText = (text: string | null, type: 'resume' | 'coverLetter' | 'jobDescription'): boolean => {
    if (!text || text.length === 0) {
      handleExtractionError(type);
      return false;
    }
    
    // Basic validation for any extracted text
    if (text.includes('Error extracting') || text.includes('binary file')) {
      handleExtractionError(type);
      return false;
    }
    
    // Length validation based on content type
    if ((type === 'resume' && text.length < 100) ||
        (type === 'coverLetter' && text.length < 50)) {
      handleExtractionError(type);
      return false;
    }
    
    // Enhanced validation for job descriptions
    if (type === 'jobDescription') {
      // Check for common non-job description content
      const invalidPatterns = [
        /log\s*in/i,
        /sign\s*in/i,
        /register/i,
        /create\s*account/i,
        /password/i,
        /404/i,
        /page\s*not\s*found/i,
        /access\s*denied/i,
        /subscription/i,
      ];
      
      // If multiple invalid patterns match, it's likely not a job description
      const matchCount = invalidPatterns.filter(pattern => pattern.test(text)).length;
      if (matchCount >= 2) {
        handleExtractionError(type);
        return false;
      }
      
      // Check for job-related terms
      const jobTerms = [
        /responsibilities/i,
        /requirements/i,
        /qualifications/i,
        /experience/i,
        /skills/i,
        /role/i,
        /position/i,
        /job\s*description/i
      ];
      
      // Count how many job-related terms appear
      const jobTermCount = jobTerms.filter(term => term.test(text)).length;
      
      // If there are few job-related terms, it's likely not a job description
      if (jobTermCount < 1 && text.length < 200) {
        handleExtractionError(type);
        return false;
      }
    }
    
    return true;
  };
  
  return { validateExtractedText };
};
