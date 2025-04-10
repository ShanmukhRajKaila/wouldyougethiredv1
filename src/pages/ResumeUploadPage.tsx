
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
import * as PDFJS from 'pdfjs-dist';
import PDFExtractor from '@/utils/PDFExtractor';

const ResumeUploadPage: React.FC = () => {
  const { 
    resumeFile, 
    setResumeFile, 
    coverLetterFile, 
    setCoverLetterFile,
    setCurrentStage,
    setProgress,
    currentLeadId,
    saveResume,
    saveJobDescription,
    saveAnalysisResults,
    jobDescription,
    analyzeResume
  } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [extractionMethod, setExtractionMethod] = useState<'pdfjs' | 'text'>('pdfjs');
  
  useEffect(() => {
    // Initialize PDF extractor
    PDFExtractor.initialize();
  }, []);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resumeFile) {
      toast.error('Please upload your resume');
      return;
    }
    
    if (!currentLeadId) {
      toast.error('Session information is missing. Please restart the application.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      console.log('Starting submission process...');
      // Save the resume
      const resumeId = await saveResume(currentLeadId);
      
      if (resumeId) {
        console.log('Resume saved successfully with ID:', resumeId);
        // Move to analysis stage
        setCurrentStage('analysis');
        setProgress(75);
        
        // Save the job description
        const jobDescId = await saveJobDescription(currentLeadId);
        
        if (jobDescId) {
          console.log('Job description saved successfully with ID:', jobDescId);
          
          // Extract text from resume file
          console.log(`Starting text extraction from file: ${resumeFile.name} using ${extractionMethod} method`);
          
          let resumeText: string | null = null;
          
          // Try the primary extraction method first
          try {
            resumeText = await PDFExtractor.extractText(resumeFile, extractionMethod);
          } catch (error) {
            console.error('Error with primary extraction method:', error);
            
            // If the primary method fails, try the alternative method
            try {
              const altMethod = extractionMethod === 'pdfjs' ? 'text' : 'pdfjs';
              console.log(`Trying alternative extraction method: ${altMethod}`);
              setExtractionMethod(altMethod);
              resumeText = await PDFExtractor.extractText(resumeFile, altMethod);
            } catch (fallbackError) {
              console.error('Error with fallback extraction method:', fallbackError);
              resumeText = null;
            }
          }
          
          if (!resumeText) {
            console.error('Text extraction failed - resumeText is null or empty');
            toast.error('Could not extract text from your resume. Please try uploading a text or Word document instead.');
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }
          
          console.log('Extracted text from file. First 100 chars:', resumeText.substring(0, 100) + '...');
          console.log('Text length:', resumeText.length);
          
          // Analyze the resume against the job description
          console.log('Starting resume analysis...');
          const analysisResults = await analyzeResume(resumeText, jobDescription);
          
          if (analysisResults) {
            console.log('Analysis complete. Results received.');
            // Save the analysis results
            await saveAnalysisResults({
              leadId: currentLeadId,
              resumeId: resumeId,
              jobDescriptionId: jobDescId,
              results: analysisResults
            });
            
            setCurrentStage('results');
            setProgress(100);
          } else {
            setCurrentStage('resumeUpload');
            toast.error('Failed to analyze your resume. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Error during resume upload process:', error);
      toast.error('An error occurred. Please try again.');
      setCurrentStage('resumeUpload');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer>
      <div className="step-container animate-slide-in">
        <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
          Upload Your Documents
        </h1>
        <p className="text-consulting-gray mb-8">
          Upload your resume and, optionally, your cover letter for analysis. 
          For best results, upload PDF, DOC, DOCX, or TXT files.
        </p>
        
        <form onSubmit={handleSubmit}>
          <FileUpload
            label="Resume"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            onChange={setResumeFile}
            value={resumeFile}
            required
          />
          
          <FileUpload
            label="Cover Letter (Optional)"
            accept=".pdf,.doc,.docx,.txt,.rtf"
            onChange={setCoverLetterFile}
            value={coverLetterFile}
          />
          
          <div className="flex justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setCurrentStage('jobDescription');
                setProgress(25);
              }}
              className="mr-4"
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button 
              type="submit"
              disabled={!resumeFile || isSubmitting}
              className="bg-consulting-navy hover:bg-consulting-blue"
            >
              {isSubmitting ? 'Processing...' : 'Run AI Analysis'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default ResumeUploadPage;
