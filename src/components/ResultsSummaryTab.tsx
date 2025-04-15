
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import StrengthsCard from '@/components/StrengthsCard';
import WeaknessesCard from '@/components/WeaknessesCard';
import RecommendationsCard from '@/components/RecommendationsCard';
import { AlertTriangle } from 'lucide-react';

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
  const { analysisResults } = useAppContext();
  
  // Check if any key analysis sections are missing
  const hasMissingData = !analysisResults || 
                         !analysisResults.starAnalysis || 
                         analysisResults.starAnalysis.length === 0 ||
                         !recommendations || 
                         recommendations.length === 0;
  
  return (
    <div className="mt-6 space-y-8">
      {hasMissingData && (
        <div className="p-4 rounded-md bg-amber-50 border border-amber-200 mb-6">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-2" />
            <div>
              <p className="font-medium text-amber-800">Limited Analysis Results</p>
              <p className="text-sm text-amber-700 mt-1">
                Some analysis data appears to be missing. This may be due to OpenAI API limits or an issue with the analysis service.
                Try again with shorter documents or wait and try again later.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <StrengthsCard 
          strengths={strengths} 
          className="lg:col-span-1"
        />
        
        <WeaknessesCard 
          weaknesses={weaknesses} 
          className="lg:col-span-1"
        />
      </div>
      
      <div className="mt-8">
        <RecommendationsCard recommendations={recommendations} />
      </div>
      
      <div className="mt-8 text-center">
        <Button
          onClick={onReset}
          className="bg-consulting-navy hover:bg-consulting-blue"
        >
          Start New Analysis
        </Button>
      </div>
    </div>
  );
};

export default ResultsSummaryTab;
