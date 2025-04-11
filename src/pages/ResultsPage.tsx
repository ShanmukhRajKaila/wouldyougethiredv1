
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResumeComparison from '@/components/ResumeComparison';
import StarAnalysis from '@/components/StarAnalysis';

const ResultsPage: React.FC = () => {
  const { resetApplication, jobDescription, analysisResults } = useAppContext();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  
  useEffect(() => {
    if (!analysisResults) {
      console.error('No analysis results available');
    }
    
    // Extract company and role from job description
    if (jobDescription) {
      // Simple heuristic to extract company/role
      const lines = jobDescription.split('\n');
      if (lines.length >= 2) {
        const possibleCompany = lines[0].trim();
        const possibleRole = lines[1].trim();
        
        if (possibleCompany) setSelectedCompany(possibleCompany);
        if (possibleRole) setSelectedRole(possibleRole);
      }
    }
  }, [jobDescription, analysisResults]);
  
  // If no results are available, show an error message
  if (!analysisResults) {
    return (
      <PageContainer>
        <div className="animate-fade-in text-center py-16">
          <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
            Analysis Results Unavailable
          </h1>
          <p className="text-consulting-gray mb-8">
            We couldn't retrieve your analysis results. Please try uploading your resume again.
          </p>
          <Button 
            onClick={() => {
              resetApplication();
            }}
            className="bg-consulting-navy hover:bg-consulting-blue"
          >
            Start Over
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  // Extract values from the analysisResults
  const {
    verdict = false,
    alignmentScore = 0,
    strengths = [],
    weaknesses = [],
    recommendations = [],
    starAnalysis = []
  } = analysisResults;
  
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-2">
              Your Resume Analysis Results
            </h1>
            <p className="text-consulting-gray">
              <span className="font-medium">Company:</span> {selectedCompany} | <span className="font-medium">Role:</span> {selectedRole}
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
                  {strengths && strengths.length > 0 ? (
                    strengths.map((strength, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-green-600 mr-2">✓</span>
                        <span>{strength}</span>
                      </li>
                    ))
                  ) : (
                    <li>No strengths identified</li>
                  )}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-red-600 mb-4">
                  Areas for Improvement
                </h2>
                <ul className="space-y-2">
                  {weaknesses && weaknesses.length > 0 ? (
                    weaknesses.map((weakness, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-red-600 mr-2">✗</span>
                        <span>{weakness}</span>
                      </li>
                    ))
                  ) : (
                    <li>No areas for improvement identified</li>
                  )}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-consulting-navy mb-4">
                  Recommendations
                </h2>
                <ul className="space-y-2">
                  {recommendations && recommendations.length > 0 ? (
                    recommendations.map((recommendation, index) => (
                      <li key={index} className="flex items-start">
                        <span className="text-consulting-accent mr-2">→</span>
                        <span>{recommendation}</span>
                      </li>
                    ))
                  ) : (
                    <li>No recommendations available</li>
                  )}
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
            <ResumeComparison starAnalysis={starAnalysis} />
          </TabsContent>
          
          <TabsContent value="star">
            <StarAnalysis starAnalysis={starAnalysis} />
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default ResultsPage;
