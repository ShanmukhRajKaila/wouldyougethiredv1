
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import { mockAnalysisResult } from '@/data/mockData';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResumeComparison from '@/components/ResumeComparison';
import StarAnalysis from '@/components/StarAnalysis';

const ResultsPage: React.FC = () => {
  const { resetApplication } = useAppContext();
  const {
    company,
    role,
    verdict,
    alignmentScore,
    strengths,
    weaknesses,
    recommendations
  } = mockAnalysisResult;
  
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-2">
              Your Application Results
            </h1>
            <p className="text-consulting-gray">
              <span className="font-medium">Company:</span> {company} | <span className="font-medium">Role:</span> {role}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md">
            <div className="text-center mb-2">
              <p className="text-sm text-consulting-gray font-medium">Final Verdict</p>
              <h2 className={`text-2xl font-bold ${verdict ? 'text-green-600' : 'text-red-600'}`}>
                {verdict ? 'Would Likely Be Hired' : 'Unlikely to Be Hired'}
              </h2>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div 
                className={`h-2.5 rounded-full ${
                  alignmentScore >= 80 ? 'bg-green-600' : 
                  alignmentScore >= 60 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${alignmentScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-consulting-gray">STAR Alignment: {alignmentScore}%</p>
          </div>
        </div>
        
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="resume">Resume Comparison</TabsTrigger>
            <TabsTrigger value="star">STAR Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-green-600 mb-4">
                  Key Strengths
                </h2>
                <ul className="space-y-2">
                  {strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-green-600 mr-2">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-red-600 mb-4">
                  Areas for Improvement
                </h2>
                <ul className="space-y-2">
                  {weaknesses.map((weakness, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-red-600 mr-2">✗</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-consulting-navy mb-4">
                  Recommendations
                </h2>
                <ul className="space-y-2">
                  {recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-consulting-accent mr-2">→</span>
                      <span>{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={resetApplication}
                className="bg-consulting-navy hover:bg-consulting-blue"
              >
                Try Another Application
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="resume">
            <ResumeComparison />
          </TabsContent>
          
          <TabsContent value="star">
            <StarAnalysis />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default ResultsPage;
