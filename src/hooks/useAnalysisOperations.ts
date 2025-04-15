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
  analyzeResume: (
    resumeText: string, 
    jobDescText: string,
    coverLetterText?: string,
    companyName?: string
  ) => Promise<AnalysisResult | null>;
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
    jobDescId: string,
    coverLetterText?: string,
    companyName?: string
  ): Promise<boolean> => {
    try {
      const loadingToast = toast.loading('Analyzing your documents with GPT-4o...');
      
      // Always use the full content
      console.log(`Starting analysis with full content using GPT-4o: Resume (${resumeText.length} chars), Job Description (${jobDescription.length} chars)`);
      if (coverLetterText) {
        console.log(`Cover Letter (${coverLetterText.length} chars)`);
      }
      if (companyName) {
        console.log(`Company: ${companyName}`);
      }
      
      // Analyze with full content
      try {
        const analysisResults = await analyzeResume(
          resumeText, 
          jobDescription,
          coverLetterText,
          companyName
        );
        
        toast.dismiss(loadingToast);
        
        // Check if we got valid results
        if (!analysisResults) {
          throw new Error('Analysis failed to return results');
        }
        
        console.log('Analysis completed successfully with valid results');
        
        // Save the results
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
      } catch (error: any) {
        console.error('Analysis attempt failed:', error);
        toast.dismiss(loadingToast);
        
        // Show error to user
        toast.error('Analysis failed. Please try again in a few moments.');
        setCurrentStage('resumeUpload');
        return false;
      }
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      setCurrentStage('resumeUpload');
      toast.error('Analysis failed. Please try again.');
      return false;
    }
  };
  
  return { performAnalysis };
};
