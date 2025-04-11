
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppContext } from '@/context/AppContext';
import PDFExtractor from '@/utils/PDFExtractor';
import { AlertCircle } from 'lucide-react';

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
  const [keywordMatches, setKeywordMatches] = useState<string[]>([]);
  
  // Ensure starAnalysis is properly initialized
  const validStarAnalysis = Array.isArray(starAnalysis) ? starAnalysis : [];
  
  useEffect(() => {
    // Extract text from the resume file regardless of format
    if (resumeFile) {
      setIsLoading(true);
      setExtractionError(null);
      
      // Use our enhanced PDFExtractor for all file types
      PDFExtractor.extractText(resumeFile)
        .then(text => {
          if (text) {
            // Check if the text is an error message from the extractor
            if (text.includes('scanned document') || 
                text.includes('image-based PDF') || 
                text.includes('Error extracting') ||
                text.includes('binary file')) {
              setExtractionError(text);
              setResumeText('');
            } else {
              setResumeText(text);
              setExtractionError(null);
              
              // Analyze key terms from job description
              if (jobDescription) {
                extractKeywords(text, jobDescription);
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
  
  // Simple function to extract potential keywords from job description
  const extractKeywords = (resumeText: string, jobDesc: string) => {
    // Convert both texts to lowercase for case-insensitive comparison
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDesc.toLowerCase();
    
    // Extract potential keywords from job description (words that appear more than once)
    const jobWords = jobLower.match(/\b[a-z]{4,}\b/g) || [];
    const wordCounts: Record<string, number> = {};
    
    jobWords.forEach(word => {
      if (wordCounts[word]) {
        wordCounts[word]++;
      } else {
        wordCounts[word] = 1;
      }
    });
    
    // Get keywords that appear in the job description but not in the resume
    const missingKeywords = Object.keys(wordCounts)
      .filter(word => wordCounts[word] > 1) // Only words that appear multiple times
      .filter(word => !resumeLower.includes(word))
      .filter(word => {
        // Filter out common stopwords
        const stopwords = ['this', 'that', 'then', 'than', 'they', 'them', 'with', 'from'];
        return !stopwords.includes(word);
      })
      .slice(0, 10); // Limit to top 10 keywords
      
    setKeywordMatches(missingKeywords);
  };
  
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
        {keywordMatches.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
            <h3 className="text-amber-800 font-medium mb-2">Consider adding these keywords from the job description:</h3>
            <div className="flex flex-wrap gap-2">
              {keywordMatches.map((keyword, idx) => (
                <span key={idx} className="px-2 py-1 bg-amber-100 text-amber-800 rounded-md text-sm">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
        
        <div>
          <h2 className="text-xl font-bold border-b border-consulting-navy pb-1 mb-3">
            Experience (Enhanced with Relevant Keywords)
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
