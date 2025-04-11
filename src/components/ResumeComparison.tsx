
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';

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
  const { resumeFile } = useAppContext();
  const [resumeText, setResumeText] = useState<string>('');
  
  // Ensure starAnalysis is properly initialized
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  useEffect(() => {
    // Try to extract text from the resume file to show in the original tab
    if (resumeFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          // For text files, this will work directly
          let content = e.target.result as string;
          setResumeText(content);
        }
      };
      reader.readAsText(resumeFile);
    }
  }, [resumeFile]);
  
  const renderImprovedResume = () => {
    // Use the star analysis to show an improved version of the resume
    if (validStarAnalysis.length === 0) {
      return (
        <div className="p-6">
          <p className="text-consulting-gray">No improvement suggestions available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Experience (Enhanced with STAR Method)
          </h2>
          <ul className="list-disc pl-5 text-sm space-y-4">
            {validStarAnalysis.map((item, idx) => (
              <li key={idx} className="text-consulting-accent font-medium">
                {item.improved}
                <div className="mt-1 text-xs text-consulting-gray">
                  <i>{item.feedback}</i>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-6">
      <Tabs defaultValue="original" onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="original">Original Resume</TabsTrigger>
          <TabsTrigger value="tailored">Improved Resume</TabsTrigger>
        </TabsList>
        <TabsContent value="original">
          <Card className="p-6">
            <div className="whitespace-pre-wrap font-mono text-sm">
              {resumeText || "Original resume text could not be extracted. Please upload a plain text (.txt) file for best results."}
            </div>
          </Card>
        </TabsContent>
        <TabsContent value="tailored">
          <Card className="p-6">
            {renderImprovedResume()}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ResumeComparison;
