import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResumeComparison from '@/components/ResumeComparison';
import StarAnalysis from '@/components/StarAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, X, ArrowRight } from "lucide-react";
import Gauge from '@/components/Gauge';

const ResultsPage: React.FC = () => {
  const { resetApplication, jobDescription, analysisResults, selectedCompany } = useAppContext();
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [inputRole, setInputRole] = useState('');
  
  useEffect(() => {
    if (!analysisResults) {
      console.error('No analysis results available');
    }
    
    const savedRole = localStorage.getItem('jobRoleTitle');
    if (savedRole) {
      setSelectedRole(savedRole);
    } else if (jobDescription) {
      const jobTitle = extractJobTitle(jobDescription);
      if (jobTitle) {
        setSelectedRole(jobTitle);
        localStorage.setItem('jobRoleTitle', jobTitle);
      }
    }
  }, [jobDescription, analysisResults]);
  
  const extractJobTitle = (description: string): string => {
    const patterns = [
      /position:\s*([^\.]+)/i,
      /job title:\s*([^\.]+)/i,
      /role:\s*([^\.]+)/i,
      /we are looking for a[n]?\s+([^\.]+)/i,
      /hiring a[n]?\s+([^\.]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    const firstLine = description.split('\n')[0].trim();
    if (firstLine && firstLine.length < 50) {
      return firstLine;
    }
    
    return 'Job Position';
  };
  
  const handleRoleSubmit = () => {
    setSelectedRole(inputRole);
    setShowRoleDialog(false);
    localStorage.setItem('jobRoleTitle', inputRole);
  };
  
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
  
  const {
    verdict = false,
    alignmentScore = 0,
    strengths = [],
    weaknesses = [],
    recommendations = [],
    starAnalysis = []
  } = analysisResults || {};
  
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-2">
              Your Resume Analysis Results
            </h1>
            <p className="text-consulting-gray">
              {selectedCompany?.name ? (
                <><span className="font-medium">Company:</span> {selectedCompany.name} | <span className="font-medium">Role:</span> {selectedRole}</>
              ) : (
                <><span className="font-medium">Role:</span> {selectedRole}</>
              )}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md w-full md:w-auto md:min-w-[250px]">
            <div className="text-center mb-2 w-full">
              <p className="text-sm text-consulting-gray font-medium">Final Verdict</p>
              <h2 className={`text-2xl font-bold ${verdict ? 'text-green-600' : 'text-red-600'}`}>
                {verdict ? 'Would Likely Be Hired' : 'Unlikely to Be Hired'}
              </h2>
              <div className="my-4 px-2 w-full">
                <Gauge value={alignmentScore} size="md" />
              </div>
            </div>
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
                <h2 className="text-xl font-serif font-bold text-green-600 mb-4 flex items-center">
                  <Check className="mr-2 h-5 w-5" /> Key Strengths
                </h2>
                <ul className="space-y-4">
                  {strengths && strengths.length > 0 ? (
                    strengths.map((strength, index) => (
                      <li key={index} className="border rounded-md p-3">
                        <div className="flex items-start">
                          <span className="text-green-600 mr-2 mt-1">✓</span>
                          <span>{strength}</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li>No strengths identified</li>
                  )}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-red-600 mb-4 flex items-center">
                  <X className="mr-2 h-5 w-5" /> Areas for Improvement
                </h2>
                <ul className="space-y-4">
                  {weaknesses && weaknesses.length > 0 ? (
                    weaknesses.map((weakness, index) => (
                      <li key={index} className="border rounded-md p-3">
                        <div className="flex items-start">
                          <span className="text-red-600 mr-2 mt-1">✗</span>
                          <span>{weakness}</span>
                        </div>
                      </li>
                    ))
                  ) : (
                    <li>No areas for improvement identified</li>
                  )}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-consulting-navy mb-4 flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5" /> Recommendations
                </h2>
                <ul className="space-y-4">
                  {recommendations && recommendations.length > 0 ? (
                    recommendations.map((recommendation, index) => (
                      <li key={index} className="border rounded-md p-3">
                        <div className="flex items-start">
                          <span className="text-consulting-accent mr-2 mt-1">→</span>
                          <span>{recommendation}</span>
                        </div>
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
      
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Job Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Please enter the job role title.
            </p>
            <Input 
              placeholder="e.g. Data Analyst, Software Engineer" 
              value={inputRole} 
              onChange={(e) => setInputRole(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleRoleSubmit} disabled={!inputRole.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ResultsPage;
