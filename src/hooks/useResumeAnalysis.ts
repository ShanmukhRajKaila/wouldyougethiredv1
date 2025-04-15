
import { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import { useFileExtraction } from './useFileExtraction';
import { useAnalysisSubmission } from './useAnalysisSubmission';

export const useResumeAnalysis = () => {
  const {
    resumeFile,
    coverLetterFile,
    isCoverLetterIncluded,
    setCurrentStage,
  } = useAppContext();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Extract file extraction functionality to a separate hook
  const { 
    extractionWarning, 
    setExtractionWarning, 
    checkFileExtraction 
  } = useFileExtraction(resumeFile, isCoverLetterIncluded ? coverLetterFile : null);

  // Extract submission logic to a separate hook
  const { handleSubmission } = useAnalysisSubmission({
    setIsSubmitting,
    setProcessingError,
    setCurrentStage
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }
    
    if (isCoverLetterIncluded && !coverLetterFile) {
      toast.error('Please upload your cover letter or disable cover letter analysis');
      return;
    }
    
    handleSubmission();
  };

  return {
    isSubmitting,
    processingError,
    extractionWarning,
    setExtractionWarning,
    checkFileExtraction,
    handleSubmit
  };
};
