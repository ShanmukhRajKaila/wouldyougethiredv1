
import React from 'react';
import { AppProvider } from '@/context/AppContext';
import { useAppContext } from '@/context/AppContext';
import Header from '@/components/Header';
import LandingPage from './LandingPage';
import JobDescriptionPage from './JobDescriptionPage';
import ResumeUploadPage from './ResumeUploadPage';
import AnalysisPage from './AnalysisPage';
import ResultsPage from './ResultsPage';

const AppContent: React.FC = () => {
  const { currentStage } = useAppContext();
  
  const renderStage = () => {
    switch (currentStage) {
      case 'landing':
        return <LandingPage />;
      case 'jobDescription':
        return <JobDescriptionPage />;
      case 'resumeUpload':
        return <ResumeUploadPage />;
      case 'analysis':
        return <AnalysisPage />;
      case 'results':
        return <ResultsPage />;
      default:
        return <LandingPage />;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      {currentStage !== 'landing' && <Header />}
      <main className="flex-1">
        {renderStage()}
      </main>
    </div>
  );
};

const Index: React.FC = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
