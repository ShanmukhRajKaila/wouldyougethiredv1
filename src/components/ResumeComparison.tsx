
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import ImprovedResume from '@/components/resume/ImprovedResume';
import { useSkillsAnalysis } from '@/hooks/useSkillsAnalysis';
import { useImprovedResumeAnalysis } from '@/hooks/useImprovedResumeAnalysis';
import ProcessingErrorDisplay from './resume/ProcessingErrorDisplay';
import { useAnalysisSubmission } from '@/hooks/useAnalysisSubmission';
import OriginalResume from '@/components/resume/OriginalResume';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface ResumeComparisonProps {
  starAnalysis: StarAnalysisItem[];
}

const ResumeComparison: React.FC<ResumeComparisonProps> = ({ starAnalysis }) => {
  const { resumeFile, jobDescription, analysisResults } = useAppContext();
  const [resumeText, setResumeText] = useState<string>('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [resumeBullets, setResumeBullets] = useState<string[]>([]);
  const [improvedBullets, setImprovedBullets] = useState<Record<string, StarAnalysisItem>>({});
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  const { missingSkills } = useSkillsAnalysis(resumeText, jobDescription, analysisResults);
  const { improvedText, updatedAlignmentScore } = useImprovedResumeAnalysis(resumeText, validStarAnalysis);
  
  // Initialize analysis submission hooks for retry functionality
  const { handleAnalysisRetry } = useAnalysisSubmission({
    setIsSubmitting,
    setProcessingError,
    setCurrentStage: () => {} // We don't need to change stages on retry
  });
  
  useEffect(() => {
    const improvedMap: Record<string, StarAnalysisItem> = {};
    if (Array.isArray(validStarAnalysis)) {
      validStarAnalysis.forEach(item => {
        if (item && item.original) {
          improvedMap[item.original.trim()] = item;
        }
      });
    }
    setImprovedBullets(improvedMap);
  }, [validStarAnalysis]);

  const handleTextExtracted = (text: string) => {
    setResumeText(text);
  };

  const handleBulletsExtracted = (bullets: string[]) => {
    setResumeBullets(bullets);
  };

  const handleExtractionError = (error: string | null) => {
    setExtractionError(error);
  };
  
  const handleRetryAnalysis = () => {
    handleAnalysisRetry();
  };

  // We need to extract text from original resume but not display it
  return (
    <div className="mt-6">
      {/* Hidden component to extract text from the resume file */}
      <div className="hidden">
        <OriginalResume 
          resumeFile={resumeFile}
          onTextExtracted={handleTextExtracted}
          onBulletsExtracted={handleBulletsExtracted}
          onExtractionError={handleExtractionError}
        />
      </div>
      
      {extractionError && (
        <div className="mb-4">
          <ProcessingErrorDisplay processingError={extractionError} />
        </div>
      )}
      
      {processingError && (
        <div className="mb-4">
          <ProcessingErrorDisplay 
            processingError={processingError} 
            onRetry={handleRetryAnalysis}
          />
        </div>
      )}
      
      {isSubmitting && (
        <div className="mb-4 p-4 text-center bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-blue-800">Reanalyzing your resume... Please wait.</p>
        </div>
      )}
      
      <Card className="p-6">
        <h2 className="text-xl font-serif font-bold mb-4">Enhanced Resume</h2>
        <ImprovedResume 
          resumeBullets={resumeBullets}
          improvedBullets={improvedBullets}
          missingSkills={missingSkills}
          recommendations={analysisResults?.recommendations}
          improvedText={improvedText}
          updatedAlignmentScore={updatedAlignmentScore}
        />
      </Card>
    </div>
  );
};

export default ResumeComparison;
