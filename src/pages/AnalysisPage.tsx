
import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/PageContainer';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const AnalysisPage: React.FC = () => {
  const { 
    setCurrentStage, 
    resumeFile, 
    jobDescription, 
    setProgress, 
    analysisResults, 
    analyzeResume,
    currentLeadId,
    saveAnalysisResults 
  } = useAppContext();
  const [loadingMessage, setLoadingMessage] = useState<string>("Extracting text from resume...");
  const [progressValue, setProgressLocal] = useState<number>(0);
  const [analysisTimeout, setAnalysisTimeout] = useState<boolean>(false);
  const [isRetrying, setIsRetrying] = useState<boolean>(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we already have results, navigate to results page
    if (analysisResults) {
      setCurrentStage('results');
      setProgress(100);
      navigate('/');
      return;
    }
    
    const messages = [
      "Extracting text from resume...",
      "Connecting to OpenAI GPT-4o...",
      "Analyzing resume content...",
      "Comparing to job description...",
      "Applying STAR methodology...",
      "Evaluating alignment...",
      "Generating recommendations...",
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length - 1) {
        currentIndex++;
        setLoadingMessage(messages[currentIndex]);
        setProgressLocal((currentIndex / (messages.length - 1)) * 100);
      } else {
        clearInterval(interval);
        // After all messages are shown, check if we have results yet
        if (!analysisResults && !analysisTimeout) {
          setAnalysisTimeout(true);
        }
      }
    }, 2000);
    
    // Set a timeout to show retry option if analysis takes too long
    const timeout = setTimeout(() => {
      if (!analysisResults) {
        setAnalysisTimeout(true);
      }
    }, 60000); // 1 minute timeout
    
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [analysisResults, navigate, setCurrentStage, setProgress]);

  const handleRetry = async () => {
    if (!resumeFile || !jobDescription) {
      toast.error("Missing resume or job description. Please go back and try again.");
      return;
    }

    setIsRetrying(true);
    setAnalysisTimeout(false);
    setProgressLocal(0);
    setLoadingMessage("Retrying analysis...");
    
    // Navigate back to resume upload to try again
    setCurrentStage('resumeUpload');
    setProgress(50);
    navigate('/');
  };

  const handleSkip = () => {
    // Skip to results page with mock data
    setCurrentStage('results');
    setProgress(100);
    navigate('/');
  };
  
  return (
    <PageContainer>
      <div className="step-container animate-fade-in text-center py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-8">
            Analyzing Your Application
          </h1>
          
          <div className="mb-8">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-consulting-accent transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          </div>
          
          {analysisTimeout ? (
            <>
              <p className="text-consulting-gray text-lg mb-4">
                The analysis is taking longer than expected.
              </p>
              <div className="space-y-4 mt-8">
                <Button 
                  onClick={handleRetry} 
                  className="w-full"
                  disabled={isRetrying}
                >
                  {isRetrying ? "Processing..." : "Try Again"}
                </Button>
                <Button 
                  onClick={handleSkip} 
                  variant="outline" 
                  className="w-full"
                >
                  Skip Analysis
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-consulting-gray text-lg animate-pulse">
                {loadingMessage}
              </p>
              
              <div className="mt-8">
                <p className="text-sm text-consulting-gray">
                  Our AI is using GPT-4o to analyze your resume against the job description, 
                  applying industry-standard evaluation criteria and the STAR method.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </PageContainer>
  );
};

export default AnalysisPage;
