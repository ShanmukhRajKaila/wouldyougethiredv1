
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useImprovedCoverLetter } from '@/hooks/useImprovedCoverLetter';
import Gauge from './Gauge';

const CoverLetterAnalysisTab: React.FC = () => {
  const { analysisResults, coverLetterText, selectedCompany } = useAppContext();
  const [activeTab, setActiveTab] = useState<string>('original');
  
  const coverLetterAnalysis = analysisResults?.coverLetterAnalysis;
  
  const { improvedText, updatedRelevance } = useImprovedCoverLetter(
    coverLetterText,
    coverLetterAnalysis
  );
  
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
  
  const { 
    tone, 
    relevance, 
    strengths, 
    weaknesses, 
    recommendations,
    companyInsights = [],
    keyRequirements = [],
    suggestedPhrases = []
  } = coverLetterAnalysis;
  
  // Determine relevance score color
  const getRelevanceColorClass = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-amber-500';
    return 'text-red-500';
  };

  // Check if the improved text contains the enhancement section
  const hasEnhancementSection = improvedText?.includes("==== SUGGESTED ENHANCEMENTS ====");
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="original">Original Letter</TabsTrigger>
          <TabsTrigger value="improved">Enhanced Letter</TabsTrigger>
          <TabsTrigger value="company-insights">Company Insights</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
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
            
            <div className="flex flex-col gap-4">
              <Card className="shadow-md flex-1">
                <CardHeader className="bg-consulting-lightblue/10 border-b pb-3">
                  <CardTitle className="text-consulting-navy text-lg">Original Relevance</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className={`text-3xl font-bold ${getRelevanceColorClass(relevance)}`}>
                    {relevance}/100
                  </p>
                </CardContent>
              </Card>
              
              <Card className="shadow-md flex-1">
                <CardHeader className="bg-green-50 border-b pb-3">
                  <CardTitle className="text-green-700 text-lg">Enhanced Relevance</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className={`text-3xl font-bold ${getRelevanceColorClass(updatedRelevance)}`}>
                    {updatedRelevance}/100
                  </p>
                </CardContent>
              </Card>
            </div>
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
        </TabsContent>
        
        <TabsContent value="original">
          <Card className="p-6">
            <h3 className="text-xl font-serif font-medium text-gray-700 mb-4">Original Cover Letter</h3>
            <div className="bg-gray-50 p-4 rounded-md shadow-sm whitespace-pre-wrap text-gray-700">
              {coverLetterText || 'No cover letter text available.'}
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="company-insights">
          <div className="space-y-6">
            {selectedCompany && (
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 flex items-center justify-center bg-white rounded-lg shadow-sm p-2">
                  <img
                    src={selectedCompany.logoUrl}
                    alt={selectedCompany.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-xl font-serif font-medium text-gray-700">
                    {selectedCompany.name}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Company Analysis Results
                  </p>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-md">
                <CardHeader className="bg-purple-50 border-b pb-3">
                  <CardTitle className="text-purple-700 text-lg">Company Insights</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {companyInsights.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-3">
                      {companyInsights.map((insight, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {insight}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No specific company insights available.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader className="bg-blue-50 border-b pb-3">
                  <CardTitle className="text-blue-700 text-lg">Key Requirements</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {keyRequirements.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-3">
                      {keyRequirements.map((requirement, index) => (
                        <li key={index} className="text-sm text-gray-700">
                          {requirement}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No key requirements identified.
                    </p>
                  )}
                </CardContent>
              </Card>
              
              <Card className="shadow-md">
                <CardHeader className="bg-amber-50 border-b pb-3">
                  <CardTitle className="text-amber-700 text-lg">Suggested Phrases</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {suggestedPhrases.length > 0 ? (
                    <ul className="list-disc pl-5 space-y-3">
                      {suggestedPhrases.map((phrase, index) => (
                        <li key={index} className="text-sm text-gray-700 italic">
                          "{phrase}"
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 italic">
                      No suggested phrases available.
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <Card className="shadow-md mt-6">
              <CardHeader className="bg-green-50 border-b pb-3">
                <CardTitle className="text-green-700 text-lg">How to Use These Insights</CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-700">
                  <li>
                    <span className="font-medium">Company Insights:</span> Mention these in your opening paragraph 
                    to show you've researched the company and connect with their mission.
                  </li>
                  <li>
                    <span className="font-medium">Key Requirements:</span> Address each of these directly in your 
                    body paragraphs, providing examples from your experience.
                  </li>
                  <li>
                    <span className="font-medium">Suggested Phrases:</span> Incorporate these phrases throughout 
                    your letter to align your language with the company's values and job description.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="improved">
          <Card className="p-6">
            <h3 className="text-xl font-serif font-medium text-gray-700 mb-4">Enhanced Cover Letter</h3>
            
            <div className="bg-white p-4 rounded-lg border border-green-200 mb-4">
              <div className="flex items-center">
                <div className="w-1/2">
                  <h4 className="text-md font-medium text-consulting-navy mb-2">Enhanced Relevance Score</h4>
                  <Gauge 
                    value={updatedRelevance} 
                    size="md" 
                    showLabel={true}
                    className="mb-1"
                  />
                </div>
                <div className="w-1/2 text-sm text-gray-600 pl-4 border-l border-gray-200">
                  <p className="mb-2">Original score: {relevance}/100</p>
                  <p className="mb-2">Enhanced score: {updatedRelevance}/100</p>
                  <p className="text-green-600 font-medium">
                    +{updatedRelevance - relevance} point improvement
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-md mb-4 text-blue-800 text-sm">
              <p className="font-medium">How to use the enhanced letter:</p>
              <ol className="list-decimal pl-5 mt-2">
                <li>Review the suggestions at the bottom of this section</li>
                <li>Incorporate the suggestions into the appropriate sections of your cover letter</li>
                <li>Do not copy the entire enhanced section with the brackets</li>
              </ol>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-md shadow-sm whitespace-pre-wrap text-gray-700">
              {improvedText || 'Enhanced cover letter could not be generated.'}
            </div>
            
            <div className="mt-6 space-y-4">
              <h4 className="text-lg font-medium text-gray-700">Key Improvements:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="font-medium text-gray-700 mb-2">Cover Letter Recommendations</h5>
                  <ul className="list-disc pl-5 space-y-2">
                    {recommendations.map((recommendation, index) => (
                      <li key={index} className="text-sm text-gray-700">
                        {recommendation}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {suggestedPhrases.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Added Company-Specific Language</h5>
                    <ul className="list-disc pl-5 space-y-2">
                      {suggestedPhrases.map((phrase, index) => (
                        <li key={index} className="text-sm text-gray-700 italic">
                          "{phrase}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CoverLetterAnalysisTab;
