
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import CompanySelector from '@/components/CompanySelector';
import { toast } from 'sonner';

const JobDescriptionPage: React.FC = () => {
  const { 
    jobDescription, 
    setJobDescription, 
    setCurrentStage,
    setProgress,
    currentLeadId,
    saveJobDescription,
    selectedCompany
  } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }
    
    if (!currentLeadId) {
      toast.error('Session information is missing. Please restart the application.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const jobDescriptionId = await saveJobDescription(currentLeadId);
      
      if (jobDescriptionId) {
        setCurrentStage('resumeUpload');
        setProgress(50);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <PageContainer>
      <div className="step-container animate-slide-in">
        <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
          Job Description
        </h1>
        <p className="text-consulting-gray mb-8">
          Paste the job description for the role you're applying to. You can enter company name optionally.
        </p>
        
        <form onSubmit={handleSubmit}>
          <CompanySelector />
          
          <div className="mb-6">
            <label htmlFor="jobDescription" className="block text-consulting-charcoal font-medium mb-2">
              Job Description <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="jobDescription"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the job description here..."
              className="min-h-[200px]"
              required
            />
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={jobDescription.trim().length === 0 || isSubmitting}
              className="bg-consulting-navy hover:bg-consulting-blue"
            >
              {isSubmitting ? 'Processing...' : 'Continue to Resume Upload'}
            </Button>
          </div>
        </form>
      </div>
    </PageContainer>
  );
};

export default JobDescriptionPage;
