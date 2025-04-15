
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { Button } from './ui/button';

const CoverLetterAnalysisTab: React.FC = () => {
  const { analysisResults } = useAppContext();
  
  const coverLetterAnalysis = analysisResults?.coverLetterAnalysis;
  
  if (!coverLetterAnalysis) {
    return (
      <div className="text-center py-8">
        <h3 className="text-xl font-serif font-medium text-gray-600 mb-4">
          No cover letter analysis available
        </h3>
        <p className="text-gray-500 mb-6">
          You didn't include a cover letter in your analysis or the analysis failed to process it.
        </p>
        <Button 
          onClick={() => window.history.back()}
          variant="outline"
        >
          Go Back
        </Button>
      </div>
    );
  }
  
  const { tone, relevance, strengths, weaknesses, recommendations } = coverLetterAnalysis;
  
  // Determine relevance score color
  const getRelevanceColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-md">
          <CardHeader className="bg-consulting-lightblue/10 border-b pb-3">
            <CardTitle className="text-consulting-navy text-lg">Cover Letter Tone</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className="text-lg font-medium text-consulting-navy mb-2">{tone}</p>
            <p className="text-sm text-gray-600">
              The overall tone and impression your cover letter conveys to a potential employer.
            </p>
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="bg-consulting-lightblue/10 border-b pb-3">
            <CardTitle className="text-consulting-navy text-lg">Relevance Score</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p className={`text-3xl font-bold ${getRelevanceColorClass(relevance)}`}>
              {relevance}/100
            </p>
            <p className="text-sm text-gray-600 mt-2">
              How well your cover letter aligns with the job description.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-md">
          <CardHeader className="bg-green-50 border-b pb-3">
            <CardTitle className="text-green-700 text-lg">Strengths</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {strengths.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {strengths.map((strength, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {strength}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific strengths identified.</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="bg-red-50 border-b pb-3">
            <CardTitle className="text-red-700 text-lg">Areas to Improve</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {weaknesses.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {weaknesses.map((weakness, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {weakness}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific weaknesses identified.</p>
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-md">
          <CardHeader className="bg-blue-50 border-b pb-3">
            <CardTitle className="text-blue-700 text-lg">Recommendations</CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recommendations.length > 0 ? (
              <ul className="list-disc pl-5 space-y-2">
                {recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-gray-700">
                    {recommendation}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 italic">No specific recommendations available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CoverLetterAnalysisTab;
