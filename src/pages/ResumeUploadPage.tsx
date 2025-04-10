
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import FileUpload from '@/components/FileUpload';
import { toast } from 'sonner';
// import { mockAnalysisResult } from '@/data/mockData';

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
  
  // Function to extract text from PDF
  const extractTextFromPDF = async (file: File): Promise<string | null> => {
    try {
      // For now, we'll just simulate extracting text
      // In a real application, you would use a library like pdf.js or a service to extract text
      
      // Simulated delay to mimic processing time
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Return simulated text from the PDF
      return `Resume for John Doe
      
      Professional Summary
      Experienced software engineer with 5+ years of experience in full-stack development, specializing in React, TypeScript, and Node.js.
      
      Work Experience
      Senior Software Engineer, Tech Company Inc.
      January 2020 - Present
      - Led development of a customer-facing web application that increased user engagement by 45%
      - Implemented CI/CD pipeline that reduced deployment time by 60%
      - Mentored junior developers and conducted code reviews
      
      Software Engineer, Startup Solutions
      March 2017 - December 2019
      - Developed RESTful APIs for mobile applications
      - Optimized database queries resulting in 30% performance improvement
      - Collaborated with design team to implement responsive UI
      
      Education
      Bachelor of Science in Computer Science
      University of Technology, 2017
      
      Skills
      JavaScript, TypeScript, React, Node.js, Express, MongoDB, PostgreSQL, Git, Docker, AWS`;
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
