
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import OriginalResume from '@/components/resume/OriginalResume';
import ImprovedResume from '@/components/resume/ImprovedResume';
import { useSkillsAnalysis } from '@/hooks/useSkillsAnalysis';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface ResumeComparisonProps {
  starAnalysis: StarAnalysisItem[];
}

const ResumeComparison: React.FC<ResumeComparisonProps> = ({ starAnalysis }) => {
  const [activeTab, setActiveTab] = useState<string>('original');
  const { resumeFile, jobDescription, analysisResults } = useAppContext();
  const [resumeText, setResumeText] = useState<string>('');
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [resumeBullets, setResumeBullets] = useState<string[]>([]);
  const [improvedBullets, setImprovedBullets] = useState<Record<string, StarAnalysisItem>>({});
  
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  const { missingSkills } = useSkillsAnalysis(resumeText, jobDescription, analysisResults);
  
  useEffect(() => {
    const improvedMap: Record<string, StarAnalysisItem> = {};
    validStarAnalysis.forEach(item => {
      improvedMap[item.original.trim()] = item;
    });
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

  return (
    <div className="mt-6">
      <Tabs defaultValue="original" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="original">Original Resume</TabsTrigger>
          <TabsTrigger value="tailored">Enhanced Resume</TabsTrigger>
        </TabsList>
        <TabsContent value="original">
          <Card className="p-6">
            <OriginalResume 
              resumeFile={resumeFile}
              onTextExtracted={handleTextExtracted}
              onBulletsExtracted={handleBulletsExtracted}
            />
          </Card>
        </TabsContent>
        <TabsContent value="tailored">
          <Card className="p-6">
            <ImprovedResume 
              resumeBullets={resumeBullets}
              improvedBullets={improvedBullets}
              missingSkills={missingSkills}
              recommendations={analysisResults?.recommendations}
            />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeComparison;
