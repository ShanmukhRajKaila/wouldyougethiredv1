import { Dispatch, SetStateAction } from 'react';

export type AppStage = 
  'landing' | 
  'jobDescription' | 
  'resumeUpload' | 
  'analysis' | 
  'results';

export interface Company {
  name: string;
  logoUrl: string;
}

export interface CoverLetterAnalysis {
  tone: string;
  relevance: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface AnalysisResult {
  alignmentScore: number;
  verdict: boolean;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  starAnalysis: Array<{
    original: string;
    improved: string;
    feedback: string;
  }>;
  coverLetterAnalysis?: CoverLetterAnalysis;
}

export interface AppContextType {
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
  coverLetterText: string;
  setCoverLetterText: (text: string) => void;
  isCoverLetterIncluded: boolean;
  setIsCoverLetterIncluded: (included: boolean) => void;
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
  analyzeResume: (resumeText: string, jobDescText: string) => Promise<AnalysisResult | null>;
  analysisResults: AnalysisResult | null;
  setAnalysisResults: (results: AnalysisResult | null) => void;
}
