import React, { createContext, useContext, useState } from 'react';
import { 
  AppContextType, 
  AppStage, 
  Company, 
  AnalysisResult 
} from './types';
import { 
  saveLeadInfo as saveLeadInfoService, 
  saveJobDescription as saveJobDescriptionService,
  saveResume as saveResumeService,
  saveAnalysisResults as saveAnalysisResultsService
} from './operations';
import { analyzeResume as analyzeResumeService } from './resumeAnalysisService';

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
  const [coverLetterText, setCoverLetterText] = useState<string>('');
  const [isCoverLetterIncluded, setIsCoverLetterIncluded] = useState<boolean>(false);

  const resetApplication = () => {
    setCurrentStage('landing');
    setJobDescription('');
    setSelectedCompany(null);
    setResumeFile(null);
    setCoverLetterFile(null);
    setCoverLetterText('');
    setIsCoverLetterIncluded(false);
    setProgress(0);
    setUserName('');
    setUserEmail('');
    setCurrentLeadId(null);
    setAnalysisResults(null);
  };

  const saveLeadInfo = async (): Promise<string | null> => {
    return saveLeadInfoService(userName, userEmail);
  };

  const saveJobDescription = async (leadId: string): Promise<string | null> => {
    return saveJobDescriptionService(leadId, jobDescription, selectedCompany);
  };

  const saveResume = async (leadId: string): Promise<string | null> => {
    return saveResumeService(leadId, resumeFile);
  };

  const analyzeResume = async (resumeText: string, jobDescText: string): Promise<AnalysisResult | null> => {
    const results = await analyzeResumeService(
      resumeText, 
      jobDescText, 
      isCoverLetterIncluded ? coverLetterText : undefined
    );
    if (results) {
      setAnalysisResults(results);
    }
    return results;
  };

  const saveAnalysisResults = async (params: {
    leadId: string;
    resumeId: string;
    jobDescriptionId: string;
    results: AnalysisResult;
  }): Promise<void> => {
    await saveAnalysisResultsService(params);
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
        coverLetterText,
        setCoverLetterText,
        isCoverLetterIncluded,
        setIsCoverLetterIncluded,
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
