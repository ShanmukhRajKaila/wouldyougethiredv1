
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type AppStage = 'landing' | 'jobDescription' | 'resumeUpload' | 'analysis' | 'results';

interface Company {
  id: string;
  name: string;
  logo?: string;
}

interface AnalysisResult {
  alignmentScore: number;
  verdict: boolean;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  starAnalysis: {
    original: string;
    improved: string;
    feedback: string;
  }[];
}

interface AppContextType {
  currentStage: AppStage;
  setCurrentStage: (stage: AppStage) => void;
  jobDescription: string;
  setJobDescription: (description: string) => void;
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => void;
  resumeFile: File | null;
  setResumeFile: (file: File | null) => void;
  coverLetterFile: File | null;
  setCoverLetterFile: (file: File | null) => void;
  progress: number;
  setProgress: (progress: number) => void;
  resetApplication: () => void;
  userName: string;
  setUserName: (name: string) => void;
  userEmail: string;
  setUserEmail: (email: string) => void;
  currentLeadId: string | null;
  setCurrentLeadId: (id: string | null) => void;
  saveLeadInfo: () => Promise<string | null>;
  saveJobDescription: (leadId: string) => Promise<string | null>;
  saveResume: (leadId: string) => Promise<string | null>;
  saveAnalysisResults: (params: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: AnalysisResult;
  }) => Promise<void>;
  analyzeResume: (resumeText: string, jobDescription: string) => Promise<AnalysisResult | null>;
  analysisResults: AnalysisResult | null;
  setAnalysisResults: (results: AnalysisResult | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStage, setCurrentStage] = useState<AppStage>('landing');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');
  const [userEmail, setUserEmail] = useState<string>('');
  const [currentLeadId, setCurrentLeadId] = useState<string | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult | null>(null);

  const resetApplication = () => {
    setCurrentStage('landing');
    setJobDescription('');
    setSelectedCompany(null);
    setResumeFile(null);
    setCoverLetterFile(null);
    setProgress(0);
    setUserName('');
    setUserEmail('');
    setCurrentLeadId(null);
    setAnalysisResults(null);
  };

  const saveLeadInfo = async (): Promise<string | null> => {
    try {
      if (!userName || !userEmail) {
        toast.error('Please provide your name and email');
        return null;
      }

      const { data, error } = await supabase
        .from('leads')
        .insert([{ name: userName, email: userEmail }])
        .select('id')
        .single();

      if (error) {
        console.error('Error saving lead:', error);
        toast.error('Failed to save your information');
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Exception saving lead:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  const saveJobDescription = async (leadId: string): Promise<string | null> => {
    try {
      if (!jobDescription) {
        toast.error('Please provide a job description');
        return null;
      }

      const { data, error } = await supabase
        .from('job_descriptions')
        .insert([{ 
          lead_id: leadId, 
          company: selectedCompany?.name || null, 
          description: jobDescription 
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error saving job description:', error);
        toast.error('Failed to save job description');
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Exception saving job description:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  const saveResume = async (leadId: string): Promise<string | null> => {
    try {
      if (!resumeFile) {
        toast.error('Please upload a resume');
        return null;
      }

      const fileExt = resumeFile.name.split('.').pop();
      const filePath = `${leadId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) {
        console.error('Error uploading resume:', uploadError);
        toast.error('Failed to upload resume');
        return null;
      }

      const { data, error } = await supabase
        .from('resumes')
        .insert([{ 
          lead_id: leadId, 
          file_name: resumeFile.name, 
          file_path: filePath 
        }])
        .select('id')
        .single();

      if (error) {
        console.error('Error saving resume metadata:', error);
        toast.error('Failed to save resume information');
        return null;
      }

      return data?.id || null;
    } catch (error) {
      console.error('Exception saving resume:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  const analyzeResume = async (resumeText: string, jobDescription: string): Promise<AnalysisResult | null> => {
    try {
      console.log('Calling analyze-resume edge function...');
      
      // Trim the inputs if they're too long to avoid timeouts
      const maxResumeLength = 8000;
      const maxJobDescLength = 4000;
      
      const trimmedResume = resumeText.length > maxResumeLength 
        ? resumeText.substring(0, maxResumeLength) + "... [trimmed for processing]" 
        : resumeText;
        
      const trimmedJobDesc = jobDescription.length > maxJobDescLength
        ? jobDescription.substring(0, maxJobDescLength) + "... [trimmed for processing]"
        : jobDescription;
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch('https://mqvstzxrxrmgdseepwzh.supabase.co/functions/v1/analyze-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData?.session?.access_token || ''}`,
        },
        body: JSON.stringify({
          resumeText: trimmedResume,
          jobDescription: trimmedJobDesc,
          options: {
            useFastModel: true, // Hint to use a faster model if possible
            prioritizeSpeed: true // Hint to prioritize speed over detail
          }
        }),
        // Set a longer timeout for the fetch request
        signal: AbortSignal.timeout(50000) // 50 second timeout
      });

      if (!response.ok) {
        console.error('Error response from analyze-resume:', response.status, response.statusText);
        let errorMessage = 'Failed to analyze resume';
        
        try {
          const errorData = await response.json();
          console.error('Error details:', errorData);
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Could not parse error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const analysisResult = await response.json();
      console.log('Analysis result received:', analysisResult);
      setAnalysisResults(analysisResult);
      return analysisResult as AnalysisResult;
    } catch (error) {
      console.error('Error analyzing resume:', error);
      toast.error('Failed to analyze your resume. Please try again.');
      return null;
    }
  };

  const saveAnalysisResults = async ({
    leadId,
    resumeId,
    jobDescriptionId,
    results
  }: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: AnalysisResult;
  }): Promise<void> => {
    try {
      const { error } = await supabase
        .from('analysis_results')
        .insert([{
          lead_id: leadId,
          resume_id: resumeId,
          job_description_id: jobDescriptionId,
          match_score: results.alignmentScore,
          alignment_score: results.alignmentScore,
          verdict: results.verdict,
          strengths: results.strengths,
          weaknesses: results.weaknesses,
          recommendations: results.recommendations
        }]);

      if (error) {
        console.error('Error saving analysis results:', error);
        toast.error('Failed to save analysis results');
      }
    } catch (error) {
      console.error('Exception saving analysis results:', error);
      toast.error('An unexpected error occurred');
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentStage,
        setCurrentStage,
        jobDescription,
        setJobDescription,
        selectedCompany,
        setSelectedCompany,
        resumeFile,
        setResumeFile,
        coverLetterFile,
        setCoverLetterFile,
        progress,
        setProgress,
        resetApplication,
        userName,
        setUserName,
        userEmail,
        setUserEmail,
        currentLeadId,
        setCurrentLeadId,
        saveLeadInfo,
        saveJobDescription,
        saveResume,
        saveAnalysisResults,
        analyzeResume,
        analysisResults,
        setAnalysisResults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
