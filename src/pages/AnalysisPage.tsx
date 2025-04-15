
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
    saveAnalysisResults,
    selectedCompany
  } = useAppContext();
  const [loadingMessage, setLoadingMessage] = useState<string>("Extracting text from resume...");
  const [progressValue, setProgressLocal] = useState<number>(0);
  const navigate = useNavigate();
  
  useEffect(() => {
    // If we already have results, navigate to results page
    if (analysisResults) {
      setCurrentStage('results');
      setProgress(100);
      navigate('/');
      return;
    }
    
    // Company-specific loading messages if we have a company
    const companyName = selectedCompany?.name;
    
    const messages = companyName ? [
      "Extracting text from resume...",
      `Researching ${companyName}...`,
      `Analyzing company values and culture...`,
      "Connecting to OpenAI GPT-4o...",
      "Analyzing resume content...",
      `Comparing to ${companyName}'s job description...`,
      "Applying STAR methodology...",
      "Evaluating alignment with position requirements...",
      "Generating tailored recommendations...",
      "Creating customized cover letter suggestions...",
      "Processing results...",
      "This may take a few minutes for longer documents...",
      `Finalizing analysis for ${companyName} application...`
    ] : [
      "Extracting text from resume...",
      "Connecting to OpenAI GPT-4o...",
      "Analyzing resume content...",
      "Comparing to job description...",
      "Applying STAR methodology...",
      "Evaluating alignment...",
      "Generating recommendations...",
      "Processing results...",
      "This may take a few minutes for longer documents...",
      "Still working on your analysis..."
    ];
    
    // Use a slower interval to give the analysis more time to complete
    const messageInterval = 3000; // 3 seconds between messages
    let currentIndex = 0;
    
    const interval = setInterval(() => {
      if (currentIndex < messages.length - 1) {
        currentIndex++;
        setLoadingMessage(messages[currentIndex]);
        
        // Calculate progress but don't go to 100%
        const calculatedProgress = Math.min(
          ((currentIndex / (messages.length - 1)) * 80),
          80
        );
        setProgressLocal(calculatedProgress);
      } else {
        // When we reach the end of the messages, cycle through the last few messages
        const lastMessages = messages.slice(Math.max(messages.length - 3, 0));
        const nextIndex = (currentIndex - (messages.length - lastMessages.length) + 1) % lastMessages.length;
        setLoadingMessage(lastMessages[nextIndex]);
        currentIndex++;
      }
    }, messageInterval);
    
    return () => {
      clearInterval(interval);
    };
  }, [analysisResults, navigate, setCurrentStage, setProgress, selectedCompany]);
  
  return (
    <PageContainer>
      <div className="step-container animate-fade-in text-center py-16">
        <div className="max-w-md mx-auto">
          <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-8">
            {selectedCompany ? `Analyzing Your ${selectedCompany.name} Application` : 'Analyzing Your Application'}
          </h1>
          
          <div className="mb-8">
            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-consulting-accent transition-all duration-300"
                style={{ width: `${progressValue}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-consulting-gray text-lg animate-pulse">
            {loadingMessage}
          </p>
          
          <div className="mt-8">
            <p className="text-sm text-consulting-gray">
              Our AI is analyzing your resume against the job description, 
              {selectedCompany && ` researching ${selectedCompany.name} and its requirements, `}
              applying industry-standard evaluation criteria and the STAR method.
              This may take several minutes for longer documents.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AnalysisPage;
