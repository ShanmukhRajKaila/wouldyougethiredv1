
import { toast } from 'sonner';
import { AppStage, AnalysisResult } from '@/context/types';

interface AnalysisOperationsProps {
  setProgress: (progress: number) => void;
  setCurrentStage: (stage: AppStage) => void;
  saveAnalysisResults: (params: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: AnalysisResult;
  }) => Promise<void>;
  analyzeResume: (
    resumeText: string, 
    jobDescText: string,
    coverLetterText?: string,
    companyName?: string
  ) => Promise<AnalysisResult | null>;
  jobDescription: string;
  setRetryCount: (value: (prev: number) => number) => void;
  setReducedMode: (value: boolean) => void;
  retryCount: number;
  reducedMode: boolean;
}

export const useAnalysisOperations = ({
  setProgress,
  setCurrentStage,
  saveAnalysisResults,
  analyzeResume,
  jobDescription,
  setRetryCount,
  setReducedMode,
  retryCount,
  reducedMode
}: AnalysisOperationsProps) => {

  const performAnalysis = async (
    resumeText: string, 
    currentLeadId: string, 
    resumeId: string, 
    jobDescId: string,
    coverLetterText?: string,
    companyName?: string
  ): Promise<boolean> => {
    try {
      const loadingToast = toast.loading('Analyzing your documents with GPT-4o...');
      
      // Always use the full content initially
      console.log(`Starting analysis with GPT-4o: Resume (${resumeText.length} chars), Job Description (${jobDescription.length} chars)`);
      if (coverLetterText) {
        console.log(`Cover Letter (${coverLetterText.length} chars)`);
      }
      if (companyName) {
        console.log(`Company: ${companyName}`);
      }
      
      let analysisResults = null;
      try {
        analysisResults = await analyzeResume(
          resumeText, 
          jobDescription,
          coverLetterText,
          companyName
        );
      } catch (error: any) {
        console.error('Initial analysis attempt failed:', error);
        
        if (error.message?.includes('token') || error.message?.includes('too large')) {
          console.log('Trying with reduced content due to token limits...');
          setReducedMode(true);
          
          // Try again with reduced content
          const shortenedResume = resumeText.substring(0, 10000);
          const shortenedJobDesc = jobDescription.substring(0, 3000);
          const shortenedCoverLetter = coverLetterText?.substring(0, 3000);
          
          try {
            analysisResults = await analyzeResume(
              shortenedResume, 
              shortenedJobDesc,
              shortenedCoverLetter,
              companyName
            );
          } catch (retryError: any) {
            console.error('Retry with reduced content failed:', retryError);
            throw retryError;
          }
        } else {
          throw error; // re-throw if it's not a token-related error
        }
      }
      
      toast.dismiss(loadingToast);
      
      // Check if we got valid results
      if (!analysisResults) {
        throw new Error('Analysis failed to return results');
      }
      
      // Ensure we have all required fields
      validateAndEnrichAnalysisResults(analysisResults, resumeText, jobDescription);
      
      console.log('Analysis completed successfully with valid results');
      
      // Save the results
      await saveAnalysisResults({
        leadId: currentLeadId,
        resumeId: resumeId,
        jobDescriptionId: jobDescId,
        results: analysisResults
      });
      
      setCurrentStage('results');
      setProgress(100);
      toast.success('Analysis complete!');
      return true;
      
    } catch (error: any) {
      console.error('Resume analysis error:', error);
      
      if (error.fallbackAnalysis) {
        console.log('Using fallback analysis...');
        try {
          await saveAnalysisResults({
            leadId: currentLeadId,
            resumeId: resumeId,
            jobDescriptionId: jobDescId,
            results: error.fallbackAnalysis
          });
          
          setCurrentStage('results');
          setProgress(100);
          toast.success('Basic analysis completed with limited features.');
          return true;
        } catch (saveError) {
          console.error('Error saving fallback analysis:', saveError);
        }
      }
      
      // If we couldn't even save the fallback, tell the user
      setCurrentStage('resumeUpload');
      
      if (error.message?.includes('token') || error.message?.includes('too large')) {
        toast.error('Your documents are too large to analyze. Please try with shorter files.');
      } else {
        toast.error('Analysis failed. Please try again or use shorter documents.');
      }
      return false;
    }
  };
  
  return { performAnalysis };
};

// Helper function to validate and enrich analysis results
function validateAndEnrichAnalysisResults(
  results: AnalysisResult, 
  resumeText: string, 
  jobDescription: string
): void {
  // Ensure alignment score is valid
  if (!results.alignmentScore || typeof results.alignmentScore !== 'number') {
    results.alignmentScore = calculateBasicAlignmentScore(resumeText, jobDescription);
  }
  
  // Ensure verdict exists
  if (results.verdict === undefined) {
    results.verdict = results.alignmentScore >= 65;
  }
  
  // Ensure we have strengths
  if (!results.strengths || !Array.isArray(results.strengths) || results.strengths.length < 3) {
    const defaultStrengths = [
      "Professional experience in the field",
      "Relevant educational background",
      "Technical expertise aligned with role requirements",
      "Clear and organized resume structure",
      "Demonstrated progression in career path"
    ];
    
    results.strengths = [
      ...(Array.isArray(results.strengths) ? results.strengths : []),
      ...defaultStrengths
    ].slice(0, 5);
  }
  
  // Ensure we have weaknesses
  if (!results.weaknesses || !Array.isArray(results.weaknesses) || results.weaknesses.length < 3) {
    const defaultWeaknesses = [
      "Resume could be more tailored to the job description",
      "Missing quantifiable achievements and metrics",
      "Could better highlight relevant skills and experiences",
      "Some key job requirements not addressed",
      "Professional summary could be more impactful"
    ];
    
    results.weaknesses = [
      ...(Array.isArray(results.weaknesses) ? results.weaknesses : []),
      ...defaultWeaknesses
    ].slice(0, 5);
  }
  
  // Ensure we have recommendations
  if (!results.recommendations || !Array.isArray(results.recommendations) || results.recommendations.length < 3) {
    const defaultRecommendations = [
      "Tailor your resume to match key job requirements",
      "Add metrics and quantifiable achievements to your bullet points",
      "Use more industry-specific keywords from the job description",
      "Highlight projects most relevant to this position",
      "Create a stronger professional summary focused on your value proposition"
    ];
    
    results.recommendations = [
      ...(Array.isArray(results.recommendations) ? results.recommendations : []),
      ...defaultRecommendations
    ].slice(0, 5);
  }
  
  // Ensure we have STAR analysis
  if (!results.starAnalysis || !Array.isArray(results.starAnalysis) || results.starAnalysis.length < 3) {
    const bulletPoints = extractBulletPointsFromResume(resumeText);
    const existingAnalysis = Array.isArray(results.starAnalysis) ? results.starAnalysis : [];
    
    // Generate missing STAR analysis items
    while (existingAnalysis.length < 3 && bulletPoints.length > 0) {
      const bullet = bulletPoints.shift();
      if (bullet && bullet.length > 10) {
        existingAnalysis.push({
          original: bullet,
          improved: `${bullet} (with measurable results)`,
          feedback: "Add specific metrics and context to demonstrate impact"
        });
      }
    }
    
    // If we still don't have 3 items, create generic ones
    while (existingAnalysis.length < 3) {
      existingAnalysis.push({
        original: "Generic experience bullet point",
        improved: "Led cross-functional project that improved efficiency by 25% and reduced costs by $50K annually",
        feedback: "Add specific metrics, context, and results to demonstrate impact"
      });
    }
    
    results.starAnalysis = existingAnalysis.slice(0, 3);
  }
}

// Calculate a basic alignment score
function calculateBasicAlignmentScore(resumeText: string, jobDescription: string): number {
  if (!resumeText || !jobDescription) {
    return 50; // Default middle value
  }
  
  const resumeWords = new Set(resumeText.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3));
    
  const jobWords = new Set(jobDescription.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3));
    
  let matches = 0;
  jobWords.forEach(word => {
    if (resumeWords.has(word)) {
      matches++;
    }
  });
  
  // Calculate percentage with some baseline adjustment
  const baseScore = Math.min(Math.round((matches / Math.max(jobWords.size, 1)) * 100) + 10, 95);
  
  // Ensure score is reasonable
  return Math.max(40, Math.min(95, baseScore));
}

// Extract bullet points from resume text
function extractBulletPointsFromResume(text: string): string[] {
  if (!text) return [];
  
  // Find all bullet-like lines in the text
  const lines = text.split(/[\n\r]+/);
  const bulletPoints = lines.filter(line => {
    const trimmed = line.trim();
    return trimmed.startsWith('•') || 
           trimmed.startsWith('-') || 
           trimmed.startsWith('*') || 
           trimmed.match(/^\d+\./) ||
           (trimmed.length > 20 && trimmed.match(/^[A-Z][a-z]+ed/)); // Lines starting with past tense verbs
  });
  
  // Clean up the bullet points and return
  return bulletPoints
    .map(b => b.replace(/^[\s•\-\*\d\.]+/, '').trim())
    .filter(b => b.length > 10)
    .slice(0, 10);
}
