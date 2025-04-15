
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
    
    // Enhanced validation for job descriptions
    if (type === 'jobDescription') {
      // Check for common non-job description content - expanded patterns
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
        /cookies/i,
        /privacy\s*policy/i,
        /terms\s*of\s*service/i,
        /sign\s*up/i,
        /home\s*page/i,
        /website\s*uses\s*cookies/i,
        /javascript\s*is\s*disabled/i,
        /browser\s*is\s*out\s*of\s*date/i,
        /please\s*enable\s*javascript/i,
      ];
      
      // More aggressive validation: if ANY of these appear prominently in the text, it's likely not a job description
      const prominentInvalidContent = invalidPatterns.some(pattern => {
        const matches = text.match(pattern);
        if (!matches) return false;
        
        // Check if the match appears in the first 20% of the text (suggesting it's a login page, etc)
        const firstMatchPos = text.search(pattern);
        return firstMatchPos >= 0 && firstMatchPos < text.length * 0.2;
      });
      
      if (prominentInvalidContent) {
        handleExtractionError(type);
        return false;
      }
      
      // Check for job-related terms - expanded job-related patterns
      const jobTerms = [
        /responsibilities/i,
        /requirements/i,
        /qualifications/i,
        /experience/i,
        /skills/i,
        /role/i,
        /position/i,
        /job\s*description/i,
        /we\s*are\s*looking/i,
        /about\s*the\s*role/i,
        /about\s*the\s*position/i,
        /what\s*you\s*will\s*do/i,
        /what\s*you\s*ll\s*do/i,
        /day\s*to\s*day/i,
        /who\s*we\s*are\s*looking/i,
        /desired\s*skills/i,
        /key\s*skills/i,
        /what\s*you\s*bring/i,
        /your\s*background/i,
        /your\s*experience/i,
      ];
      
      // Count how many job-related terms appear (improved matching)
      const jobTermCount = jobTerms.filter(term => term.test(text)).length;
      
      // If there are very few job-related terms and the text is short, it's likely not a job description
      if (jobTermCount < 2 && text.length < 300) {
        handleExtractionError(type);
        return false;
      }
      
      // Check for extremely short paragraphs that suggest it's not a proper job description
      const paragraphs = text.split(/\n\s*\n/);
      if (paragraphs.length < 2 && text.length < 400) {
        handleExtractionError(type);
        return false;
      }
    }
    
    return true;
  };
  
  return { validateExtractedText };
};
