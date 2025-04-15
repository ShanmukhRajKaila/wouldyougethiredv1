
import React, { useEffect } from 'react';
import PageContainer from '@/components/PageContainer';
import { useAppContext } from '@/context/AppContext';
import ProcessingErrorDisplay from '@/components/resume/ProcessingErrorDisplay';
import ResumeUploadForm from '@/components/resume/ResumeUploadForm';
import { useResumeAnalysis } from '@/hooks/useResumeAnalysis';
import PDFExtractor from '@/utils/PDFExtractor';

const ResumeUploadPage: React.FC = () => {
  const { 
    resumeFile, 
    setResumeFile, 
    coverLetterFile, 
    setCoverLetterFile,
    setCurrentStage,
    setProgress,
    setAnalysisResults
  } = useAppContext();
  
  const { 
    isSubmitting,
    processingError,
    extractionWarning,
    setExtractionWarning,
    checkFileExtraction,
    handleSubmit
  } = useResumeAnalysis();
  
  useEffect(() => {
    // Initialize PDF extractor
    try {
      PDFExtractor.initialize();
      // Reset any previous analysis results when coming to this page
      setAnalysisResults(null);
    } catch (error) {
      console.error('Failed to initialize PDF extractor:', error);
    }
  }, [setAnalysisResults]);
  
  // Check file extraction when resumeFile changes
  useEffect(() => {
    checkFileExtraction();
  }, [resumeFile]);
  
  const handleBack = () => {
    setCurrentStage('jobDescription');
    setProgress(25);
  };
  
  return (
    <PageContainer>
      <div className="step-container animate-slide-in">
        <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
          Upload Your Documents
        </h1>
        <p className="text-consulting-gray mb-8">
          Upload your resume and, optionally, your cover letter for analysis. 
          We support PDF files, Word documents (.docx), or plain text (.txt) files.
        </p>
        
        <ProcessingErrorDisplay processingError={processingError} />
        
        <ResumeUploadForm
          resumeFile={resumeFile}
          setResumeFile={setResumeFile}
          coverLetterFile={coverLetterFile}
          setCoverLetterFile={setCoverLetterFile}
          extractionWarning={extractionWarning}
          isSubmitting={isSubmitting}
          onBack={handleBack}
          onSubmit={handleSubmit}
        />
      </div>
    </PageContainer>
  );
};

export default ResumeUploadPage;
