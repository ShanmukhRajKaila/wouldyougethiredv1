
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import CompanySelector from '@/components/CompanySelector';
import { UrlExtractor } from '@/utils/UrlExtractor';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

// Add configuration for Supabase Functions
const JobDescriptionPage: React.FC = () => {
  const { 
    jobDescription, 
    setJobDescription, 
    setProgress, 
    setCurrentStage,
    companyName,
    setCompanyName
  } = useAppContext();
  
  const [jobUrl, setJobUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [showLoginRequiredDialog, setShowLoginRequiredDialog] = useState(false);
  const [urlRequiringLogin, setUrlRequiringLogin] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const extractContentFromUrl = async () => {
    if (!jobUrl) {
      toast.error('Please enter a job posting URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(jobUrl);
    } catch (e) {
      toast.error('Please enter a valid URL');
      return;
    }

    setIsLoading(true);
    setExtractError(null);

    try {
      const result = await UrlExtractor.extractFromUrl(jobUrl);
      
      console.log('Extraction result:', result);
      
      if (result.requiresLogin) {
        console.log('Site requires login credentials');
        setUrlRequiringLogin(jobUrl);
        setShowLoginRequiredDialog(true);
        setIsLoading(false);
        return;
      }
      
      if (result.error) {
        console.error('Extraction error:', result.error);
        setExtractError(result.error);
        toast.error('Failed to extract job description');
        setIsLoading(false);
        return;
      }
      
      if (!result.jobDescription) {
        setExtractError('Could not extract job description from the provided URL. Try pasting the job description manually.');
        toast.error('Failed to extract job description');
        setIsLoading(false);
        return;
      }
      
      // Set the extracted job description
      setJobDescription(result.jobDescription);
      
      // If we got a company name, set it
      if (result.companyName) {
        setCompanyName(result.companyName);
      }
      
      toast.success('Job description extracted successfully');
    } catch (error) {
      console.error('Error extracting content from URL:', error);
      setExtractError('An error occurred while extracting the job description. Please try again or enter the job description manually.');
      toast.error('Failed to extract job description');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinue = () => {
    if (!jobDescription || jobDescription.trim().length < 10) {
      toast.error('Please enter a job description');
      return;
    }
    
    setCurrentStage('resumeUpload');
    setProgress(50);
  };
  
  const handleManualEntry = () => {
    setShowLoginRequiredDialog(false);
    setExtractError('The site requires login credentials. Please enter the job description manually.');
  };

  return (
    <PageContainer>
      <div className="step-container animate-slide-in">
        <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
          Enter Job Description
        </h1>
        <p className="text-consulting-gray mb-8">
          Enter the job description you want to apply for. You can either paste the URL or enter the text directly.
        </p>
        
        <div className="mb-8">
          <label htmlFor="jobUrl" className="block text-consulting-navy font-medium mb-2">
            Job Posting URL
          </label>
          <div className="flex gap-2">
            <Input 
              id="jobUrl"
              type="text"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="Paste job posting URL (LinkedIn, Indeed, etc.)"
              className="flex-1"
            />
            <Button 
              onClick={extractContentFromUrl}
              disabled={isLoading || !jobUrl}
            >
              {isLoading ? 'Extracting...' : 'Extract'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowHelp(true)}
            >
              Help
            </Button>
          </div>
          
          {extractError && (
            <div className="mt-2 text-red-500 text-sm">
              {extractError}
            </div>
          )}
        </div>

        <div className="mb-8">
          <label htmlFor="companyName" className="block text-consulting-navy font-medium mb-2">
            Company Name
          </label>
          <CompanySelector
            value={companyName}
            onChange={setCompanyName}
            placeholder="Enter or select the company name"
          />
        </div>
        
        <div className="mb-8">
          <label htmlFor="jobDescription" className="block text-consulting-navy font-medium mb-2">
            Job Description
          </label>
          <Textarea 
            id="jobDescription"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here"
            className="min-h-[300px]"
            data-gramm="false"
          />
        </div>
        
        <div className="flex justify-end">
          <Button 
            className="bg-consulting-navy hover:bg-consulting-blue"
            onClick={handleContinue}
            disabled={!jobDescription || jobDescription.trim().length < 10}
          >
            Continue
          </Button>
        </div>
      </div>
      
      {/* Login Required Dialog */}
      <Dialog open={showLoginRequiredDialog} onOpenChange={setShowLoginRequiredDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Login Required</DialogTitle>
            <DialogDescription>
              We've detected that this website requires login credentials to access the job description. 
              Unfortunately, we cannot access content behind login walls.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-gray-700">
              You have a few options:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Log in to the website in your browser, copy the job description, and paste it manually</li>
              <li>Try a different URL for the same job posting that doesn't require login</li>
              <li>Enter the job description manually if you already have access to it</li>
            </ul>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setShowLoginRequiredDialog(false)}>
                Try Another URL
              </Button>
              <Button onClick={handleManualEntry}>
                Enter Manually
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Help Sheet */}
      <Sheet open={showHelp} onOpenChange={setShowHelp}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>Extraction Help</SheetTitle>
            <SheetDescription>
              Tips for extracting job descriptions
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <h3 className="font-medium text-lg mb-2">Supported Sites</h3>
            <p className="text-gray-600 mb-4">
              Our extraction works well with many job boards, but some sites may have restrictions:
            </p>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li><strong>Works well:</strong> LinkedIn public job postings, Indeed, many company career pages</li>
              <li><strong>Limited support:</strong> Sites requiring login (LinkedIn private jobs, mbaexchange, sgcareers)</li>
              <li><strong>Won't work:</strong> Sites with heavy JavaScript rendering, strict anti-scraping measures</li>
            </ul>
            
            <h3 className="font-medium text-lg mt-6 mb-2">What to do if extraction fails?</h3>
            <ul className="list-disc pl-5 space-y-2 text-gray-600">
              <li>Try using a public URL that doesn't require login</li>
              <li>Copy the job description manually and paste it into the text area</li>
              <li>Make sure you're using the direct URL to the job posting, not a search results page</li>
              <li>Some company websites use JavaScript to load content - these may not work with extraction</li>
            </ul>
          </div>
        </SheetContent>
      </Sheet>
    </PageContainer>
  );
};

export default JobDescriptionPage;
