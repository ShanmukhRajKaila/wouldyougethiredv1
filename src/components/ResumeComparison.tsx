
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import PDFExtractor from '@/utils/PDFExtractor';
import { AlertCircle } from 'lucide-react';
import StarAnalysis from '@/components/StarAnalysis';

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
  const { resumeFile, jobDescription } = useAppContext();
  const [resumeText, setResumeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  useEffect(() => {
    if (resumeFile) {
      setIsLoading(true);
      setExtractionError(null);
      
      PDFExtractor.extractText(resumeFile)
        .then(text => {
          if (text) {
            if (text.includes('scanned document') || 
                text.includes('image-based PDF') || 
                text.includes('Error extracting') ||
                text.includes('binary file')) {
              setExtractionError(text);
              setResumeText('');
            } else {
              setResumeText(text);
              setExtractionError(null);
              
              if (jobDescription) {
                identifyMissingSkills(text, jobDescription);
              }
            }
          } else {
            setExtractionError("Could not extract text from the uploaded file.");
          }
        })
        .catch(err => {
          console.error("Error extracting text:", err);
          setExtractionError(`Error extracting text: ${err.message}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [resumeFile, jobDescription]);
  
  const identifyMissingSkills = (resumeText: string, jobDesc: string) => {
    // Common skills for analytics and AI roles that might be missing
    const commonSkills = [
      { term: "data science platform", alias: ["dataiku", "alteryx", "databricks"] },
      { term: "stakeholder management", alias: ["stakeholder", "stakeholders"] },
      { term: "commercial acumen", alias: ["business acumen", "commercial sense"] },
      { term: "ai models", alias: ["artificial intelligence", "machine learning models", "ml models"] },
      { term: "data modeling", alias: ["data modelling", "data model"] },
      { term: "proof of concept", alias: ["POC", "proof-of-concept"] },
      { term: "cross-functional collaboration", alias: ["cross-departmental", "cross functional"] },
      { term: "retail analytics", alias: ["retail data", "retail metrics"] },
      { term: "omni-channel", alias: ["omnichannel", "multi-channel"] },
      { term: "beauty industry", alias: ["beauty sector", "cosmetics"] },
      { term: "luxury retail", alias: ["luxury brand", "luxury market"] }
    ];
    
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDesc.toLowerCase();
    
    // Check if these skills are mentioned in the job description but missing from resume
    const missing = commonSkills.filter(skill => {
      // Check if skill or any alias appears in job description
      const inJobDesc = jobLower.includes(skill.term) || 
                         skill.alias.some(alias => jobLower.includes(alias));
      
      // Check if skill or any alias appears in resume
      const inResume = resumeLower.includes(skill.term) || 
                       skill.alias.some(alias => resumeLower.includes(alias));
      
      // Return true if it's in job description but not in resume
      return inJobDesc && !inResume;
    }).map(skill => skill.term);
    
    setMissingSkills(missing);
  };
  
  const renderImprovedResume = () => {
    if (validStarAnalysis.length === 0) {
      return (
        <div className="p-6">
          <p className="text-consulting-gray">No improvement suggestions available.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {missingSkills.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium mb-2">Skills to highlight or develop for this role:</h3>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-600">
              These skills are mentioned in the job description but not found in your resume. Consider adding relevant experience or future learning plans.
            </p>
          </div>
        )}
        
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Enhanced Experience Bullets
          </h2>
          <div className="space-y-6">
            {validStarAnalysis.map((item, idx) => (
              <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                <div className="text-consulting-charcoal font-medium mb-2">
                  <h3 className="text-sm text-gray-500">Original:</h3>
                  <p className="text-sm italic text-gray-600 mb-3">"{item.original}"</p>
                  
                  <h3 className="text-sm text-consulting-blue">Enhanced:</h3>
                  <p className="font-medium text-consulting-navy">{item.improved}</p>
                  
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500">Why this improves alignment:</h4>
                    <p className="text-xs text-gray-600 mt-1">{item.feedback}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-consulting-navy mb-3">
            Recommended Additions for this Role
          </h2>
          <ul className="list-disc pl-6 space-y-3 text-sm">
            <li className="text-gray-700">
              <span className="font-medium">Certifications:</span> Consider AI/ML certifications from cloud providers (AWS, Azure, GCP) or specialized platforms (Dataiku, Alteryx)
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Projects:</span> Highlight any experience with retail analytics, customer segmentation, or product recommendation systems
            </li>
            <li className="text-gray-700">
              <span className="font-medium">Skills to emphasize:</span> Stakeholder management, data modeling, commercial acumen, and experience with omni-channel retail data
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const renderOriginalResume = () => {
    if (isLoading) {
      return <div className="p-4 text-center">Extracting resume content...</div>;
    }
    
    if (extractionError) {
      return (
        <div className="p-4 text-red-50 bg-red-100 rounded-md">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-2" />
            <div>
              <p className="text-red-800 font-medium">{extractionError}</p>
              <p className="mt-2 text-sm text-gray-700">
                For best results:
                <ul className="list-disc pl-5 mt-1">
                  <li>Use text-based PDFs (not scanned documents)</li>
                  <li>Try Word documents (.docx) for better compatibility</li>
                  <li>Or save your resume as plain text (.txt)</li>
                </ul>
              </p>
            </div>
          </div>
        </div>
      );
    }
    
    if (!resumeText) {
      return (
        <div className="p-4 text-consulting-gray">
          No resume content available. Please upload a resume file (.pdf, .docx, or .txt).
        </div>
      );
    }
    
    return (
      <div className="whitespace-pre-wrap font-mono text-sm">
        {resumeText}
      </div>
    );
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
            {renderOriginalResume()}
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
