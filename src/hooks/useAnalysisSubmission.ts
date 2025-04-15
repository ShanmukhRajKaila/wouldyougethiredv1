
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import PDFExtractor from '@/utils/PDFExtractor';
import { AppStage } from '@/context/types';
import { useAnalysisState } from './useAnalysisState';
import { useExtractorErrorHandling } from './useExtractorErrorHandling';
import { useAnalysisOperations } from './useAnalysisOperations';

interface AnalysisSubmissionProps {
  setIsSubmitting: (value: boolean) => void;
  setProcessingError: (value: string | null) => void;
  setCurrentStage: (stage: AppStage) => void;
}

export const useAnalysisSubmission = ({
  setIsSubmitting,
  setProcessingError,
  setCurrentStage
}: AnalysisSubmissionProps) => {
  const {
    resumeFile,
    coverLetterFile,
    currentLeadId,
    isCoverLetterIncluded,
    setCoverLetterText,
    saveResume,
    saveJobDescription,
    saveAnalysisResults,
    setProgress,
    jobDescription,
    analyzeResume,
    setAnalysisResults
  } = useAppContext();

  const {
    retryCount,
    setRetryCount,
    reducedMode, 
    setReducedMode
  } = useAnalysisState();

  const { validateExtractedText } = useExtractorErrorHandling({
    setCurrentStage,
    setIsSubmitting
  });

  const { performAnalysis } = useAnalysisOperations({
    setProgress,
    setCurrentStage,
    saveAnalysisResults,
    analyzeResume,
    jobDescription,
    setRetryCount,
    setReducedMode,
    retryCount,
    reducedMode
  });

  const handleSubmission = async () => {
    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }
    
    if (!currentLeadId) {
      toast.error('Session information is missing. Please restart the application.');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingError(null);
    
    try {
      console.log('Starting submission process...');
      // Save the resume
      const resumeId = await saveResume(currentLeadId);
      
      if (resumeId) {
        console.log('Resume saved successfully with ID:', resumeId);
        // Move to analysis stage
        setCurrentStage('analysis');
        setProgress(75);
        
        // Save the job description
        const jobDescId = await saveJobDescription(currentLeadId);
        
        if (jobDescId) {
          console.log('Job description saved successfully with ID:', jobDescId);
          
          // Extract text from resume file using our improved extractor
          let resumeText = await PDFExtractor.extractText(resumeFile);
          
          if (!validateExtractedText(resumeText, 'resume')) {
            return;
          }
          
          console.log('Extracted text from resume. Length:', resumeText.length);

          // Extract cover letter text if included
          if (isCoverLetterIncluded && coverLetterFile) {
            const coverLetterText = await PDFExtractor.extractText(coverLetterFile);

            if (!validateExtractedText(coverLetterText, 'coverLetter')) {
              return;
            }

            console.log('Extracted text from cover letter. Length:', coverLetterText.length);
            setCoverLetterText(coverLetterText);
          }
          
          // Proceed with analysis
          await performAnalysis(resumeText, currentLeadId, resumeId, jobDescId);
        }
      }
    } catch (error: any) {
      console.error('Error during resume upload process:', error);
      setProcessingError(error.message || 'An unknown error occurred');
      toast.error('An error occurred during the analysis. Please try again.');
      setCurrentStage('resumeUpload');
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmission };
};
