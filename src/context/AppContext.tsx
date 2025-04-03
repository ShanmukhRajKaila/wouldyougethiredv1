
import React, { createContext, useContext, useState } from 'react';

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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentStage, setCurrentStage] = useState<AppStage>('landing');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [coverLetterFile, setCoverLetterFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<number>(0);

  const resetApplication = () => {
    setCurrentStage('landing');
    setJobDescription('');
    setSelectedCompany(null);
    setResumeFile(null);
    setCoverLetterFile(null);
    setProgress(0);
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
