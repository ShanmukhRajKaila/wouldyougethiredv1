
import { toast } from 'sonner';
import { AppStage, AnalysisResult } from '@/context/types';

interface AnalysisOperationsProps {
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: AppStage) => void;
  saveAnalysisResults: (params: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: AnalysisResult;
  }) => Promise<void>;
  analyzeResume: (resumeText: string, jobDescText: string) => Promise<AnalysisResult | null>;
  jobDescription: string;
  setRetryCount: (value: (prev: number) => number) => void;
  setReducedMode: (value: boolean) => void;
  retryCount: number;
  reducedMode: boolean;
}

export const useAnalysisOperations = ({
  setProgress,
  setCurrentStage,
  saveAnalysisResults,
  analyzeResume,
  jobDescription,
  setRetryCount,
  setReducedMode,
  retryCount,
  reducedMode
}: AnalysisOperationsProps) => {

  const performAnalysis = async (
    resumeText: string, 
    currentLeadId: string, 
    resumeId: string, 
    jobDescId: string
  ): Promise<boolean> => {
    try {
      const loadingToast = toast.loading('Analyzing your documents...');
      
      let analysisResults = null;
      let attemptError = null;
      
      try {
        // If we've already retried before, use reduced mode
        const shouldUseReducedMode = retryCount > 0 || reducedMode;
        
        // In reduced mode, trim the resume text
        if (shouldUseReducedMode) {
          console.log('Using reduced mode for analysis');
          const trimmedResume = resumeText.substring(0, 4000) + "...";
          // Also trim the job description
          const trimmedJobDesc = jobDescription.length > 2000 ? 
            jobDescription.substring(0, 2000) + "..." : 
            jobDescription;
            
          analysisResults = await analyzeResume(trimmedResume, trimmedJobDesc);
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
        return true;
      } else {
        setCurrentStage('resumeUpload');
        toast.error('Failed to analyze your resume. Please try again with a shorter resume.');
        
        if (attemptError) {
          console.error('Resume analysis error details:', attemptError);
        }
        return false;
      }
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      setCurrentStage('resumeUpload');
      
      if (error.message?.includes('token') || error.message?.includes('too large')) {
        toast.error('Your documents are too large to analyze. Please try with shorter or simpler files.');
      } else {
        toast.error('Failed to analyze your documents. Please try again later.');
      }
      return false;
    }
  };
  
  return { performAnalysis };
};
