
import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResumeComparison from '@/components/ResumeComparison';
import StarAnalysis from '@/components/StarAnalysis';
import AlignmentScoreCard from '@/components/AlignmentScoreCard';
import ResultsSummaryTab from '@/components/ResultsSummaryTab';
import RoleSelectionDialog from '@/components/RoleSelectionDialog';
import ResultsHeader from '@/components/ResultsHeader';
import CoverLetterAnalysisTab from '@/components/CoverLetterAnalysisTab';

const ResultsPage: React.FC = () => {
  const { resetApplication, jobDescription, analysisResults, selectedCompany, coverLetterFile } = useAppContext();
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
            onClick={resetApplication}
            className="bg-consulting-navy hover:bg-consulting-blue"
          >
            Start Over
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  const {
    alignmentScore = 0,
    strengths = [],
    weaknesses = [],
    recommendations = [],
    starAnalysis = [],
    coverLetterAnalysis
  } = analysisResults || {};

  // Always include the cover letter tab, but disable if no analysis
  const hasCoverLetterAnalysis = !!coverLetterAnalysis;
  
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <ResultsHeader 
            selectedCompanyName={selectedCompany?.name}
            selectedRole={selectedRole}
          />
          
          <AlignmentScoreCard alignmentScore={alignmentScore} />
        </div>
        
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="resume">Resume Comparison</TabsTrigger>
            <TabsTrigger value="star">STAR Analysis</TabsTrigger>
            <TabsTrigger value="coverletter" disabled={!hasCoverLetterAnalysis}>Cover Letter</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <ResultsSummaryTab 
              strengths={strengths}
              weaknesses={weaknesses}
              recommendations={recommendations}
              onReset={resetApplication}
            />
          </TabsContent>
          
          <TabsContent value="resume">
            <ResumeComparison starAnalysis={starAnalysis} />
          </TabsContent>
          
          <TabsContent value="star">
            <StarAnalysis starAnalysis={starAnalysis} />
          </TabsContent>

          <TabsContent value="coverletter">
            <CoverLetterAnalysisTab />
          </TabsContent>
        </Tabs>
      </div>
      
      <RoleSelectionDialog 
        open={showRoleDialog}
        onOpenChange={setShowRoleDialog}
        inputRole={inputRole}
        setInputRole={setInputRole}
        onSubmit={handleRoleSubmit}
      />
    </PageContainer>
  );
};

export default ResultsPage;
