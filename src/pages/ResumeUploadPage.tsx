
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
import * as PDFJS from 'pdfjs-dist';

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
  
  // Initialize PDF.js worker properly
  useEffect(() => {
    const initializeWorker = async () => {
      try {
        // Set the worker URL directly to avoid dynamic imports that can fail
        PDFJS.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS.version}/build/pdf.worker.min.js`;
      } catch (error) {
        console.error('Error initializing PDF.js worker:', error);
      }
    };
    
    initializeWorker();
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
      // Save the resume
      const resumeId = await saveResume(currentLeadId);
      
      if (resumeId) {
        // Move to analysis stage
        setCurrentStage('analysis');
        setProgress(75);
        
        // Save the job description
        const jobDescId = await saveJobDescription(currentLeadId);
        
        if (jobDescId) {
          // Extract text from resume PDF
          const resumeText = await extractTextFromPDF(resumeFile);
          
          if (!resumeText) {
            toast.error('Could not extract text from your resume. Please check the file format.');
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }
          
          console.log('Extracted text from PDF:', resumeText.substring(0, 100) + '...');
          
          // Analyze the resume against the job description
          const analysisResults = await analyzeResume(resumeText, jobDescription);
          
          if (analysisResults) {
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
  
  // Function to extract text from PDF using PDF.js
  const extractTextFromPDF = async (file: File): Promise<string | null> => {
    try {
      console.log('Starting PDF extraction for file:', file.name);
      
      const arrayBuffer = await file.arrayBuffer();
      console.log('File loaded as ArrayBuffer, size:', arrayBuffer.byteLength);
      
      // Use a try-catch specifically for the getDocument call which might fail
      try {
        console.log('Creating PDF document with PDF.js version:', PDFJS.version);
        const loadingTask = PDFJS.getDocument({data: arrayBuffer});
        const pdf = await loadingTask.promise;
        
        console.log('PDF loaded successfully with', pdf.numPages, 'pages');
        
        let fullText = '';
        
        // Extract text from each page
        for (let i = 1; i <= pdf.numPages; i++) {
          console.log('Processing page', i, 'of', pdf.numPages);
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          
          fullText += pageText + '\n';
        }
        
        console.log('Text extraction complete, length:', fullText.length);
        return fullText;
      } catch (pdfError) {
        console.error('Error in PDF.js processing:', pdfError);
        throw pdfError;
      }
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      return null;
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
          For best results, upload PDF files.
        </p>
        
        <form onSubmit={handleSubmit}>
          <FileUpload
            label="Resume"
            accept=".pdf"
            onChange={setResumeFile}
            value={resumeFile}
            required
          />
          
          <FileUpload
            label="Cover Letter (Optional)"
            accept=".pdf"
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
