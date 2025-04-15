
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
  
  const handleExtractionError = (errorType: 'resume' | 'coverLetter') => {
    const errorMessage = errorType === 'resume' 
      ? 'Could not properly read your resume. Please try uploading a Word document (.docx) or a .txt file instead.'
      : 'Could not properly read your cover letter. Please try uploading a Word document (.docx) or a .txt file instead.';
    
    toast.error(errorMessage);
    setCurrentStage('resumeUpload');
    setIsSubmitting(false);
  };
  
  const validateExtractedText = (text: string | null, type: 'resume' | 'coverLetter'): boolean => {
    if (!text || 
        text.includes('Error extracting') || 
        text.includes('binary file') ||
        (type === 'resume' && text.length < 100) ||
        (type === 'coverLetter' && text.length < 50)) {
      handleExtractionError(type);
      return false;
    }
    return true;
  };
  
  return { validateExtractedText };
};
