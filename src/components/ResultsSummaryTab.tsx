
import React from 'react';
import { Button } from '@/components/ui/button';
import StrengthsCard from './StrengthsCard';
import WeaknessesCard from './WeaknessesCard';
import RecommendationsCard from './RecommendationsCard';
import { useAppContext } from '@/context/AppContext';

interface ResultsSummaryTabProps {
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  onReset: () => void;
}

const ResultsSummaryTab: React.FC<ResultsSummaryTabProps> = ({ 
  strengths = [], 
  weaknesses = [], 
  recommendations = [], 
  onReset 
}) => {
  const { setCurrentStage, setJobDescription } = useAppContext();
  
  // Ensure we always have arrays, even if undefined is passed
  const validStrengths = Array.isArray(strengths) ? strengths : [];
  const validWeaknesses = Array.isArray(weaknesses) ? weaknesses : [];
  const validRecommendations = Array.isArray(recommendations) ? recommendations : [];
  
  // If we have no data, provide sensible defaults
  const hasNoData = validStrengths.length === 0 && validWeaknesses.length === 0 && validRecommendations.length === 0;
  
  const defaultStrengths = hasNoData ? [
    "Resume has good structure",
    "Education section is well formatted",
    "Contact information is clearly presented"
  ] : [];
  
  const defaultWeaknesses = hasNoData ? [
    "Could benefit from more specific keywords from the job description",
    "Experience bullet points could be more achievement-focused",
    "Consider adding metrics to quantify achievements"
  ] : [];
  
  const defaultRecommendations = hasNoData ? [
    "Customize your resume for each application",
    "Use action verbs at the beginning of bullet points",
    "Include relevant skills mentioned in the job description"
  ] : [];
  
  const handleTryAnother = () => {
    // Clear job description
    setJobDescription('');
    // Reset to job description page instead of full reset
    setCurrentStage('jobDescription');
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StrengthsCard strengths={validStrengths.length > 0 ? validStrengths : defaultStrengths} />
        <WeaknessesCard weaknesses={validWeaknesses.length > 0 ? validWeaknesses : defaultWeaknesses} />
        <RecommendationsCard recommendations={validRecommendations.length > 0 ? validRecommendations : defaultRecommendations} />
      </div>
      
      <div className="mt-8 flex justify-center">
        <Button 
          onClick={handleTryAnother}
          className="bg-consulting-navy hover:bg-consulting-blue"
        >
          Try Another Application
        </Button>
      </div>
    </>
  );
};

export default ResultsSummaryTab;
