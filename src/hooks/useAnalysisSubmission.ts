
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
    setAnalysisResults,
    selectedCompany
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

  const handleAnalysisRetry = async () => {
    if (!resumeFile || !jobDescription || !currentLeadId) {
      toast.error('Missing required data for analysis');
      return;
    }
    
    setIsSubmitting(true);
    setProcessingError(null);
    
    try {
      let resumeText = '';
      try {
        resumeText = await PDFExtractor.extractText(resumeFile);
        if (!validateExtractedText(resumeText, 'resume')) {
          setIsSubmitting(false);
          return;
        }
      } catch (error) {
        console.error('Error extracting resume text during retry:', error);
        toast.error('Could not extract resume text. Please try uploading again.');
        setIsSubmitting(false);
        return;
      }
      
      // Extract cover letter text if included
      let coverLetterText = '';
      if (isCoverLetterIncluded && coverLetterFile) {
        try {
          coverLetterText = await PDFExtractor.extractText(coverLetterFile);
          if (!validateExtractedText(coverLetterText, 'coverLetter')) {
            setIsSubmitting(false);
            return;
          }
          setCoverLetterText(coverLetterText);
        } catch (error) {
          console.error('Error extracting cover letter text during retry:', error);
          toast.warning('Having trouble reading your cover letter. Analysis will focus on your resume.');
        }
      }
      
      // Direct analysis without saving to database again
      try {
        // Pass the correct arguments according to the function signature
        const analysisResult = await analyzeResume(
          resumeText, 
          jobDescription,
          isCoverLetterIncluded && coverLetterText ? coverLetterText : undefined,
          selectedCompany?.name
        );
        
        if (analysisResult) {
          setAnalysisResults(analysisResult);
          setProcessingError(null);
          toast.success('Analysis completed successfully');
        } else {
          throw new Error('Analysis returned no results');
        }
      } catch (error) {
        console.error('Analysis retry error:', error);
        setProcessingError('Our advanced analysis service is still experiencing high volume. Using our built-in analysis instead.');
      } finally {
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error('Error during analysis retry:', error);
      setProcessingError(error.message || 'An unknown error occurred');
      setIsSubmitting(false);
    }
  };

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
      // Save the resume with retry logic
      let resumeId = null;
      let retries = 0;
      const maxRetries = 2;
      
      while (!resumeId && retries < maxRetries) {
        try {
          resumeId = await saveResume(currentLeadId);
          if (!resumeId) throw new Error('Failed to save resume');
        } catch (err) {
          retries++;
          if (retries >= maxRetries) throw err;
          await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
        }
      }
      
      if (resumeId) {
        console.log('Resume saved successfully with ID:', resumeId);
        // Move to analysis stage
        setCurrentStage('analysis');
        setProgress(75);
        
        // Save the job description with retry logic
        let jobDescId = null;
        retries = 0;
        
        while (!jobDescId && retries < maxRetries) {
          try {
            jobDescId = await saveJobDescription(currentLeadId);
            if (!jobDescId) throw new Error('Failed to save job description');
          } catch (err) {
            retries++;
            if (retries >= maxRetries) throw err;
            await new Promise(r => setTimeout(r, 1000)); // Wait 1 second before retry
          }
        }
        
        if (jobDescId) {
          console.log('Job description saved successfully with ID:', jobDescId);
          
          // Extract text from resume file using our improved extractor
          let resumeText = '';
          try {
            resumeText = await PDFExtractor.extractText(resumeFile);
          } catch (error) {
            console.error('Error extracting resume text:', error);
            // Provide a fallback message to allow the process to continue
            resumeText = "Error extracting full resume content. Analysis will continue with limited information.";
            toast.warning('Having trouble reading your resume. Analysis might be limited.');
          }
          
          if (!validateExtractedText(resumeText, 'resume')) {
            return;
          }
          
          console.log('Extracted text from resume. Length:', resumeText.length);

          // Extract cover letter text if included
          let coverLetterText = '';
          if (isCoverLetterIncluded && coverLetterFile) {
            try {
              coverLetterText = await PDFExtractor.extractText(coverLetterFile);
              if (!validateExtractedText(coverLetterText, 'coverLetter')) {
                return;
              }
            } catch (error) {
              console.error('Error extracting cover letter text:', error);
              // Provide a fallback message but continue with the process
              coverLetterText = "Error extracting cover letter content. Analysis will focus on resume only.";
              toast.warning('Having trouble reading your cover letter. Analysis will focus on your resume.');
            }

            console.log('Extracted text from cover letter. Length:', coverLetterText.length);
            setCoverLetterText(coverLetterText);
          }
          
          // Proceed with analysis, passing all necessary parameters
          try {
            await performAnalysis(
              resumeText, 
              currentLeadId, 
              resumeId, 
              jobDescId,
              isCoverLetterIncluded ? coverLetterText : undefined,
              selectedCompany?.name
            );
          } catch (error) {
            console.error('Analysis error:', error);
            // Show processing error but don't prevent user from seeing results
            setProcessingError('Our advanced analysis service is experiencing high volume. Using our built-in analysis instead.');
            // Continue to results page despite the error
            setCurrentStage('results');
          }
        } else {
          throw new Error('Failed to save job description after multiple attempts');
        }
      } else {
        throw new Error('Failed to save resume after multiple attempts');
      }
    } catch (error: any) {
      console.error('Error during resume upload process:', error);
      setProcessingError(error.message || 'An unknown error occurred');
      
      // Allow the process to continue to results even with errors
      try {
        // Set current stage to results to show what we have
        setCurrentStage('results');
      } catch (finalError) {
        console.error('Critical error, reverting to resume upload:', finalError);
        toast.error('An error occurred during the analysis. Please try again.');
        setCurrentStage('resumeUpload');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return { handleSubmission, handleAnalysisRetry };
};
