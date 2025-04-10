
import React, { createContext, useContext, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type AppStage = 'landing' | 'jobDescription' | 'resumeUpload' | 'analysis' | 'results';

interface Company {
  id: string;
  name: string;
  logo: string;
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
    results: any;
  }) => Promise<void>;
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
  };

  // Save user contact information to the leads table
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

      return data.id;
    } catch (error) {
      console.error('Exception saving lead:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  // Save job description to the job_descriptions table
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

      return data.id;
    } catch (error) {
      console.error('Exception saving job description:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  // Save resume to storage and metadata to the resumes table
  const saveResume = async (leadId: string): Promise<string | null> => {
    try {
      if (!resumeFile) {
        toast.error('Please upload a resume');
        return null;
      }

      // Create a unique file path
      const fileExt = resumeFile.name.split('.').pop();
      const filePath = `${leadId}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, resumeFile);

      if (uploadError) {
        console.error('Error uploading resume:', uploadError);
        toast.error('Failed to upload resume');
        return null;
      }

      // Save metadata to database
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

      return data.id;
    } catch (error) {
      console.error('Exception saving resume:', error);
      toast.error('An unexpected error occurred');
      return null;
    }
  };

  // Save analysis results to the analysis_results table
  const saveAnalysisResults = async ({
    leadId,
    resumeId,
    jobDescriptionId,
    results
  }: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: any;
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
