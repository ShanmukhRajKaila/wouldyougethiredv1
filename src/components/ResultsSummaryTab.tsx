
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
  strengths, 
  weaknesses, 
  recommendations, 
  onReset 
}) => {
  const { setCurrentStage, setJobDescription } = useAppContext();
  
  const handleTryAnother = () => {
    // Clear job description
    setJobDescription('');
    // Reset to job description page instead of full reset
    setCurrentStage('jobDescription');
  };
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StrengthsCard strengths={strengths} />
        <WeaknessesCard weaknesses={weaknesses} />
        <RecommendationsCard recommendations={recommendations} />
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
