
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
    analyzeResume,
    setAnalysisResults
  } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [extractionWarning, setExtractionWarning] = useState<string | null>(null);
  
  useEffect(() => {
    // Initialize PDF extractor
    try {
      PDFExtractor.initialize();
      // Reset any previous analysis results when coming to this page
      setAnalysisResults(null);
      setProcessingError(null);
      setExtractionWarning(null);
    } catch (error) {
      console.error('Failed to initialize PDF extractor:', error);
    }
  }, []);
  
  // Preview the file to check if it's valid
  useEffect(() => {
    if (resumeFile) {
      setExtractionWarning(null);
      // Test extract text to verify it can be read properly
      PDFExtractor.extractText(resumeFile)
        .then(text => {
          // Check if we got a valid extraction or an error message
          if (text && (text.includes('Error extracting') || 
                       text.includes('binary file') || 
                       text.includes('scanned document'))) {
            setExtractionWarning(
              "Warning: Your file may not be properly readable. For best results, use a text-based PDF, Word document (.docx), or a .txt file."
            );
          } else if (!text || text.trim().length < 50) {
            setExtractionWarning(
              "Warning: Very little text could be extracted from your file. Use a text-based file for best results."
            );
          }
        })
        .catch(err => {
          setExtractionWarning("Warning: There might be issues reading this file format.");
          console.error("Preview extraction error:", err);
        });
    }
  }, [resumeFile]);
  
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
    setProcessingError(null);
    
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
          
          // Extract text from resume file using our improved extractor
          let resumeText = await PDFExtractor.extractText(resumeFile);
          
          if (!resumeText) {
            console.error('Text extraction failed - resumeText is null or empty');
            toast.error('Could not extract text from your file. Please try a different format.');
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }
          
          console.log('Extracted text from file. Length:', resumeText.length);
          
          // Handle error messages returned from extraction
          if (resumeText.includes('Error extracting') || 
              resumeText.includes('binary file') ||
              resumeText.length < 100) {
            toast.error('Could not properly read your document. Please try uploading a Word document (.docx) or a .txt file instead.');
            setCurrentStage('resumeUpload');
            setIsSubmitting(false);
            return;
          }
          
          // Analyze the resume against the job description
          console.log('Starting resume analysis...');
          try {
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
              setProcessingError('Failed to analyze your resume. The analysis service may be temporarily unavailable.');
              toast.error('Failed to analyze your resume. Please try again later.');
            }
          } catch (error: any) {
            console.error('Resume analysis error:', error);
            setProcessingError(error.message || 'An unknown error occurred during analysis');
            setCurrentStage('resumeUpload');
            if (error.message?.includes('token') || error.message?.includes('too large')) {
              toast.error('Your resume is too large to analyze. Please try with a shorter or simpler resume.');
            } else {
              toast.error('Failed to analyze your resume. Please try again later.');
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error during resume upload process:', error);
      setProcessingError(error.message || 'An unknown error occurred');
      toast.error('An error occurred during the analysis. Please try again.');
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
          We support PDF files, Word documents (.docx), or plain text (.txt) files.
        </p>
        
        {processingError && (
          <div className="mb-8 p-4 border border-red-300 bg-red-50 rounded-md">
            <h3 className="font-medium text-red-700 mb-2">Analysis Error</h3>
            <p className="text-sm text-red-600">{processingError}</p>
            <p className="text-sm text-gray-600 mt-2">
              Try simplifying your resume or using a Word document (.docx) or plain text (.txt) format for better results.
            </p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <FileUpload
            label="Resume"
            accept=".pdf,.txt,.docx"
            onChange={setResumeFile}
            value={resumeFile}
            required
            maxSizeMB={5}
          />
          
          {extractionWarning && (
            <div className="mb-6 p-3 border border-yellow-300 bg-yellow-50 rounded-md">
              <p className="text-sm text-yellow-800">{extractionWarning}</p>
              <p className="text-xs text-gray-600 mt-1">
                If you're having issues with PDF files, try uploading your resume as a Word document (.docx) 
                or plain text (.txt) file for better results.
              </p>
            </div>
          )}
          
          <FileUpload
            label="Cover Letter (Optional)"
            accept=".pdf,.txt,.docx"
            onChange={setCoverLetterFile}
            value={coverLetterFile}
            maxSizeMB={5}
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
