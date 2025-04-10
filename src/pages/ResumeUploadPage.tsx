
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
import { mockAnalysisResult } from '@/data/mockData';

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
    saveAnalysisResults
  } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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
        
        // Get the job description ID (in real app this would be retrieved from context)
        const jobDescId = await saveJobDescription(currentLeadId);
        
        if (jobDescId) {
          // Simulate analysis delay - in a real app this would be an API call
          setTimeout(async () => {
            // Save the analysis results using mock data for now
            await saveAnalysisResults({
              leadId: currentLeadId,
              resumeId: resumeId,
              jobDescriptionId: jobDescId,
              results: mockAnalysisResult
            });
            
            setCurrentStage('results');
            setProgress(100);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error during resume upload process:', error);
      toast.error('An error occurred. Please try again.');
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
