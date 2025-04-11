
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UrlExtractor } from '@/utils/UrlExtractor';
import { Loader2 } from 'lucide-react';

const CompanySelector = () => {
  const { selectedCompany, setSelectedCompany, setJobDescription } = useAppContext();
  const [jobUrl, setJobUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  
  const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const companyName = e.target.value;
    setSelectedCompany(companyName ? { 
      id: 'custom', 
      name: companyName,
      logo: '' 
    } : null);
  };

  const handleUrlExtraction = async () => {
    if (!jobUrl.trim()) {
      toast.error('Please enter a valid job URL');
      return;
    }

    setIsExtracting(true);
    try {
      const extractionResult = await UrlExtractor.extractFromUrl(jobUrl);
      
      if (extractionResult.error) {
        toast.error(extractionResult.error);
        return;
      }

      if (extractionResult.companyName) {
        setSelectedCompany({
          id: 'extracted',
          name: extractionResult.companyName,
          logo: ''
        });
        toast.success(`Company name extracted: ${extractionResult.companyName}`);
      }

      if (extractionResult.jobDescription) {
        setJobDescription(extractionResult.jobDescription);
        toast.success('Job description extracted successfully');
      } else {
        toast.warning('Could not extract job description');
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      toast.error('Failed to extract content from the URL');
    } finally {
      setIsExtracting(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Label htmlFor="job-url" className="block text-consulting-charcoal font-medium mb-2">
          Job Posting URL (Optional)
        </Label>
        <div className="flex space-x-2">
          <Input
            id="job-url"
            type="url"
            value={jobUrl}
            onChange={(e) => setJobUrl(e.target.value)}
            placeholder="https://example.com/job-posting"
            className="flex-1"
          />
          <Button 
            onClick={handleUrlExtraction} 
            disabled={isExtracting || !jobUrl.trim()}
            variant="outline"
          >
            {isExtracting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Extracting
              </>
            ) : (
              'Extract'
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Enter a job posting URL to automatically extract company name and job description
        </p>
      </div>
      
      <div>
        <Label htmlFor="company" className="block text-consulting-charcoal font-medium mb-2">
          Company Name <span className="text-red-500">*</span>
        </Label>
        <Input
          id="company"
          type="text"
          value={selectedCompany?.name || ''}
          onChange={handleCompanyChange}
          placeholder="Enter the company name"
          className="w-full"
          required
        />
      </div>
    </div>
  );
};

export default CompanySelector;
