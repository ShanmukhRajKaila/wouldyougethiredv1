import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import PDFExtractor from '@/utils/PDFExtractor';
import { AlertCircle } from 'lucide-react';
import StarAnalysis from '@/components/StarAnalysis';
import { extractBulletPoints } from '@/utils/UrlExtractor';

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
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [missingSkills, setMissingSkills] = useState<string[]>([]);
  const [resumeBullets, setResumeBullets] = useState<string[]>([]);
  const [improvedBullets, setImprovedBullets] = useState<Record<string, StarAnalysisItem>>({});
  
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
              
              // Extract bullet points from resume
              const bullets = extractBulletPoints(text);
              setResumeBullets(bullets);
              
              // Create mapping of original bullets to improved versions from starAnalysis
              const improvedMap: Record<string, StarAnalysisItem> = {};
              validStarAnalysis.forEach(item => {
                improvedMap[item.original.trim()] = item;
              });
              setImprovedBullets(improvedMap);
              
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
  }, [resumeFile, jobDescription, starAnalysis]);
  
  const identifyMissingSkills = (resumeText: string, jobDesc: string) => {
    // Get missing skills from analysis results if available
    if (analysisResults?.weaknesses) {
      // Extract skill-related weaknesses
      const skillWeaknesses = analysisResults.weaknesses.filter(weakness => 
        weakness.toLowerCase().includes('skill') || 
        weakness.toLowerCase().includes('experience') ||
        weakness.toLowerCase().includes('knowledge')
      );
      
      if (skillWeaknesses.length > 0) {
        // Extract key terms from weaknesses while cleaning unnecessary phrases
        const extractedSkills = skillWeaknesses.flatMap(weakness => {
          // Clean up the text to extract just the skill names
          const cleaned = weakness
            .replace(/lacks (specific )?(mention of |experience in |knowledge of )?/ig, '')
            .replace(/which (could|would|might|may) be /ig, '')
            .replace(/important for this role\.?/ig, '')
            .replace(/beneficial for this position\.?/ig, '')
            .replace(/according to the job description\.?/ig, '')
            .replace(/as mentioned in the job requirements\.?/ig, '')
            .replace(/is not mentioned in your resume\.?/ig, '')
            .replace(/not highlighted in your experience\.?/ig, '')
            .trim();
          
          // Split by commas or "and" to get individual skills
          return cleaned.split(/(?:,|\sand\s)+/).map(s => s.trim()).filter(s => s.length > 2);
        });
        
        setMissingSkills(extractedSkills);
        return;
      }
    }

    // Fallback to predefined skill detection if analysis results don't have useful weaknesses
    const commonSkills = [
      { term: "stakeholder management", alias: ["stakeholder", "stakeholders", "relationship management"] },
      { term: "data science", alias: ["data scientist", "data analysis", "data analytics"] },
      { term: "commercial acumen", alias: ["business acumen", "commercial sense", "business sense"] },
      { term: "ai models", alias: ["artificial intelligence", "machine learning models", "ml models"] },
      { term: "data modeling", alias: ["data modelling", "data model", "database design"] },
      { term: "communication skills", alias: ["communicator", "verbal communication", "written communication"] },
      { term: "cross-functional collaboration", alias: ["cross-departmental", "cross functional", "team collaboration"] },
      { term: "leadership", alias: ["team leadership", "people management", "managing teams"] },
      { term: "project management", alias: ["project coordination", "project delivery", "program management"] },
      { term: "strategic thinking", alias: ["strategic planning", "strategy development", "strategic vision"] }
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
    if (resumeBullets.length === 0) {
      return (
        <div className="p-6">
          <p className="text-consulting-gray">No bullet points detected in your resume.</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {missingSkills.length > 0 && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h3 className="text-blue-800 font-medium mb-2">Key skills to highlight or develop for this role:</h3>
            <div className="flex flex-wrap gap-2">
              {missingSkills.map((skill, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-md text-sm">
                  {skill}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-600">
              These skills are explicitly mentioned in the job description but not found in your resume. 
              Consider adding relevant experiences or demonstrating how your existing experience relates to these areas.
            </p>
          </div>
        )}
        
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Enhanced Experience Bullets
          </h2>
          <div className="space-y-6">
            {resumeBullets.map((bullet, idx) => {
              const cleanBullet = bullet.trim();
              const improved = improvedBullets[cleanBullet];
              
              return (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-consulting-charcoal mb-2">
                    <h3 className="text-sm text-gray-500">Original:</h3>
                    <p className="text-sm italic text-gray-600 mb-3">"{cleanBullet}"</p>
                    
                    <h3 className="text-sm text-consulting-blue">Enhanced:</h3>
                    {improved ? (
                      <>
                        <p className="font-medium text-consulting-navy">{improved.improved}</p>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-500">Why this improves alignment:</h4>
                          <p className="text-xs text-gray-600 mt-1">{improved.feedback}</p>
                        </div>
                      </>
                    ) : (
                      <div className="p-3 bg-gray-100 border border-gray-200 rounded text-gray-600">
                        <p className="font-medium text-gray-700">This bullet point is already well-written for this role.</p>
                        <p className="mt-2 text-sm">
                          <span className="font-semibold">Justification:</span> This experience demonstrates relevant skills and 
                          uses appropriate terminology for the position. It effectively highlights your capabilities in a 
                          way that aligns with the job requirements. For maximum impact, consider adding specific metrics 
                          or quantifiable results if available.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="bg-white p-5 rounded-lg border border-gray-200">
          <h2 className="text-lg font-semibold text-consulting-navy mb-3">
            Recommended Additions for this Role
          </h2>
          {analysisResults?.recommendations && analysisResults.recommendations.length > 0 ? (
            <ul className="list-disc pl-6 space-y-3 text-sm">
              {analysisResults.recommendations.map((recommendation, idx) => (
                <li key={idx} className="text-gray-700">{recommendation}</li>
              ))}
            </ul>
          ) : (
            <ul className="list-disc pl-6 space-y-3 text-sm">
              <li className="text-gray-700">
                <span className="font-medium">Skills emphasis:</span> Highlight any experience with stakeholder management, communication, and project delivery
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Quantify results:</span> Add metrics and specific outcomes to strengthen your bullet points
              </li>
              <li className="text-gray-700">
                <span className="font-medium">Keywords:</span> Incorporate terminology from the job description into your resume
              </li>
            </ul>
          )}
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
