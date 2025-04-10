
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
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
  const [extractionMethod, setExtractionMethod] = useState<'pdfjs' | 'text'>('text'); // Default to text method
  
  useEffect(() => {
    // Initialize PDF extractor
    try {
      PDFExtractor.initialize();
    } catch (error) {
      console.error('Failed to initialize PDF extractor:', error);
      toast.error('PDF processing initialization failed. Text extraction will be used.');
    }
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
          
          // First try text extraction for all files (more reliable)
          try {
            console.log('Attempting text extraction first');
            resumeText = await PDFExtractor.extractText(resumeFile, 'text');
          } catch (initialError) {
            console.error('Error with text extraction method:', initialError);
            
            // If text extraction fails for PDF, try PDF.js
            if (resumeFile.type === 'application/pdf') {
              try {
                console.log('Falling back to PDF.js for PDF file');
                resumeText = await PDFExtractor.extractText(resumeFile, 'pdfjs');
              } catch (fallbackError) {
                console.error('Error with PDF.js extraction method:', fallbackError);
                resumeText = null;
              }
            } else {
              resumeText = null;
            }
          }
          
          if (!resumeText) {
            console.error('Text extraction failed - resumeText is null or empty');
            
            // Provide specific error based on file type
            if (resumeFile.type === 'application/pdf') {
              toast.error('Could not extract text from your PDF. Please try uploading a text or Word document instead.');
            } else if (resumeFile.type.includes('word') || resumeFile.name.endsWith('.docx') || resumeFile.name.endsWith('.doc')) {
              toast.error('Could not process your Word document. Please try saving it as a plain text (.txt) file.');
            } else {
              toast.error('Could not extract text from your file. Please try a different format.');
            }
            
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }
          
          console.log('Extracted text from file. First 100 chars:', resumeText.substring(0, 100) + '...');
          console.log('Text length:', resumeText.length);
          
          // Check if the extracted text is valid (not binary/corrupted)
          if (resumeText.length > 0 && !/^PK/.test(resumeText) && !/^\uFEFF/.test(resumeText)) {
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
              toast.success('Analysis complete!');
            } else {
              setCurrentStage('resumeUpload');
              toast.error('Failed to analyze your resume. Please try again.');
            }
          } else {
            console.error('Extracted text appears to be binary or corrupted');
            toast.error('Your document appears to be in an unsupported format. Please upload a plain text file.');
            setCurrentStage('resumeUpload');
          }
        }
      }
    } catch (error) {
      console.error('Error during resume upload process:', error);
      toast.error('An error occurred. Please try again with a different file format.');
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
          For best results, upload TXT, DOC, or DOCX files. PDF files may not extract correctly in some cases.
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
