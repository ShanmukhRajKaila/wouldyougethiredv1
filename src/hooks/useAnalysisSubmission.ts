
import { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '@/context/AppContext';
import PDFExtractor from '@/utils/PDFExtractor';
import { AppStage } from '@/context/types';

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

  const [retryCount, setRetryCount] = useState(0);
  const [reducedMode, setReducedMode] = useState(false);

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
          
          if (!resumeText) {
            console.error('Text extraction failed - resumeText is null or empty');
            toast.error('Could not extract text from your file. Please try a different format.');
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }
          
          console.log('Extracted text from resume. Length:', resumeText.length);
          
          // Handle error messages returned from extraction
          if (resumeText.includes('Error extracting') || 
              resumeText.includes('binary file') ||
              resumeText.length < 100) {
            toast.error('Could not properly read your resume. Please try uploading a Word document (.docx) or a .txt file instead.');
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }

          // Extract cover letter text if included
          if (isCoverLetterIncluded && coverLetterFile) {
            const coverLetterText = await PDFExtractor.extractText(coverLetterFile);

            if (!coverLetterText || 
                coverLetterText.includes('Error extracting') || 
                coverLetterText.length < 50) {
              toast.error('Could not properly read your cover letter. Please try uploading a Word document (.docx) or a .txt file instead.');
              setCurrentStage('resumeUpload');
              setIsSubmitting(false);
              return;
            }

            console.log('Extracted text from cover letter. Length:', coverLetterText.length);
            setCoverLetterText(coverLetterText);
          }
          
          // Analyze the resume against the job description
          console.log('Starting resume analysis...');
          try {
            // Add a loading toast for better UX during potentially slow analysis
            const loadingToast = toast.loading('Analyzing your documents...');
            
            // Try up to 2 times in case of temporary errors
            let analysisResults = null;
            let attemptError = null;
            
            try {
              // If we've already retried before, use reduced mode
              const shouldUseReducedMode = retryCount > 0 || reducedMode;
              
              // In reduced mode, trim the resume text
              if (shouldUseReducedMode) {
                console.log('Using reduced mode for analysis');
                resumeText = resumeText.substring(0, 4000) + "...";
                // Also trim the job description
                const trimmedJobDesc = jobDescription.length > 2000 ? 
                  jobDescription.substring(0, 2000) + "..." : 
                  jobDescription;
                  
                analysisResults = await analyzeResume(resumeText, trimmedJobDesc);
              } else {
                analysisResults = await analyzeResume(resumeText, jobDescription);
              }
            } catch (error: any) {
              console.error('First analysis attempt failed:', error);
              attemptError = error;
              
              // Only retry once if it's not a token limit error
              if (!error.message?.includes('token') && retryCount < 1) {
                setRetryCount(prev => prev + 1);
                
                // Wait a moment before retrying
                await new Promise(resolve => setTimeout(resolve, 1000));
                toast.loading('Retrying analysis with reduced content...');
                
                try {
                  // Try with a shortened resume if the first attempt failed
                  setReducedMode(true);
                  const shortenedResume = resumeText.substring(0, 3000) + "...";
                  const shortenedJobDesc = jobDescription.substring(0, 1500) + "...";
                    
                  analysisResults = await analyzeResume(shortenedResume, shortenedJobDesc);
                } catch (retryError) {
                  console.error('Retry analysis attempt failed:', retryError);
                  // Use the original error
                }
              }
            }
            
            toast.dismiss(loadingToast);
            
            if (analysisResults) {
              console.log('Analysis complete. Results received.');
              // Save the analysis results
              await saveAnalysisResults({
                leadId: currentLeadId,
                resumeId: resumeId,
                jobDescriptionId: jobDescId,
                results: analysisResults
              });
              
              setCurrentStage('results');
              setProgress(100);
              toast.success('Analysis complete!');
            } else {
              setCurrentStage('resumeUpload');
              setProcessingError('Failed to analyze your resume. The analysis service may be temporarily unavailable.');
              toast.error('Failed to analyze your resume. Please try again with a shorter resume.');
              
              if (attemptError) {
                console.error('Resume analysis error details:', attemptError);
              }
            }
          } catch (error: any) {
            console.error('Resume analysis error:', error);
            setProcessingError(error.message || 'An unknown error occurred during analysis');
            setCurrentStage('resumeUpload');
            if (error.message?.includes('token') || error.message?.includes('too large')) {
              toast.error('Your documents are too large to analyze. Please try with shorter or simpler files.');
            } else {
              toast.error('Failed to analyze your documents. Please try again later.');
            }
          }
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
