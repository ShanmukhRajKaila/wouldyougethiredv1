
import React, { useEffect, useState } from 'react';
import PageContainer from '@/components/PageContainer';
import { useAppContext } from '@/context/AppContext';

const AnalysisPage: React.FC = () => {
  const [loadingMessage, setLoadingMessage] = useState<string>("Analyzing resume...");
  const [progress, setProgressLocal] = useState<number>(0);
  
  useEffect(() => {
    const messages = [
      "Analyzing resume...",
      "Extracting experience...",
      "Comparing to job description...",
      "Applying STAR methodology...",
      "Evaluating alignment...",
      "Generating tailored resume...",
      "Finalizing assessment..."
    ];
    
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex < messages.length - 1) {
        currentIndex++;
        setLoadingMessage(messages[currentIndex]);
        setProgressLocal((currentIndex / (messages.length - 1)) * 100);
      } else {
        clearInterval(interval);
      }
    }, 400);
    
    return () => clearInterval(interval);
  }, []);
  
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
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
          
          <p className="text-consulting-gray text-lg animate-pulse">
            {loadingMessage}
          </p>
          
          <div className="mt-8">
            <p className="text-sm text-consulting-gray">
              Our AI is analyzing your resume against the job description and applying industry-standard evaluation criteria.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default AnalysisPage;
