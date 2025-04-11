
import React, { useState } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { UrlExtractor } from '@/utils/UrlExtractor';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const CompanySelector = () => {
  const { selectedCompany, setSelectedCompany, setJobDescription, jobDescription } = useAppContext();
  const [jobUrl, setJobUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('url');
  const [jobTitle, setJobTitle] = useState('');
  const [needsJobTitle, setNeedsJobTitle] = useState(false);
  
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
    setNeedsJobTitle(false);
    
    try {
      const extractionResult = await UrlExtractor.extractFromUrl(jobUrl);
      
      // Show detailed extraction status for debugging purposes
      console.log('Extraction completed:', {
        companyName: extractionResult.companyName || 'Not found',
        jobDescriptionLength: extractionResult.jobDescription?.length || 0,
        jobUrl: jobUrl
      });
      
      // Show extraction status
      if (extractionResult.error) {
        toast.error(extractionResult.error);
      } else if (extractionResult.companyName || extractionResult.jobDescription) {
        toast.success('Job details extracted successfully');
      } else {
        toast.warning('Could not extract information from the URL');
      }

      // Update company name if available
      if (extractionResult.companyName) {
        setSelectedCompany({
          id: 'extracted',
          name: extractionResult.companyName,
          logo: ''
        });
        console.log('Company name extracted:', extractionResult.companyName);
      } else {
        // Try to extract company from URL domain if we couldn't get it from the page
        const urlObj = new URL(jobUrl);
        const domain = urlObj.hostname.replace('www.', '').split('.')[0];
        const companyGuess = domain.charAt(0).toUpperCase() + domain.slice(1);
        
        if (companyGuess && !['job', 'jobs', 'career', 'careers', 'apply', 'application'].includes(companyGuess.toLowerCase())) {
          console.log('Using domain as company name fallback:', companyGuess);
          setSelectedCompany({
            id: 'extracted',
            name: companyGuess,
            logo: ''
          });
          toast.info(`Could not extract company name from page. Using "${companyGuess}" from URL domain.`);
        } else {
          toast.info('Could not extract company name. Please enter it manually.');
        }
      }

      // Update job description if available
      if (extractionResult.jobDescription) {
        setJobDescription(extractionResult.jobDescription);
        console.log('Job description extracted successfully, length:', extractionResult.jobDescription.length);
        
        // Check if we can extract job title from job description
        const jobTitleExtracted = extractJobTitleFromDescription(extractionResult.jobDescription);
        if (jobTitleExtracted) {
          setJobTitle(jobTitleExtracted);
          console.log('Job title extracted from description:', jobTitleExtracted);
        } else {
          setNeedsJobTitle(true);
          console.log('Could not extract job title, prompting user');
          toast.info('Please enter the job title manually for better resume analysis');
        }
      }
      
      // Show relevant feedback based on what was extracted
      if (extractionResult.companyName && !extractionResult.jobDescription) {
        toast.info('Only company name was extracted. Please review and add job description manually if needed.');
      } else if (!extractionResult.companyName && extractionResult.jobDescription) {
        toast.info('Only job description was extracted. Please enter company name manually.');
        // Switch to manual tab if only job description was extracted
        setActiveTab('manual');
      } else if (!extractionResult.companyName && !extractionResult.jobDescription) {
        toast.warning('Could not extract information from the URL. Please enter details manually.');
        setActiveTab('manual');
      }
    } catch (error) {
      console.error('Error extracting content:', error);
      toast.error('Failed to extract content from the URL');
    } finally {
      setIsExtracting(false);
    }
  };
  
  // Helper function to try to extract job title from job description
  const extractJobTitleFromDescription = (description: string): string | null => {
    if (!description) return null;
    
    // Common patterns for job titles in descriptions
    const patterns = [
      /position:\s*([^\.]+)/i,
      /job title:\s*([^\.]+)/i,
      /role:\s*([^\.]+)/i,
      /we are looking for a[n]?\s+([^\.]+)/i,
      /hiring a[n]?\s+([^\.]+)/i,
      /\s+a[n]?\s+([A-Z][a-z]+ [A-Z][a-z]+(?: [A-Z][a-z]+)?(?:\s+\([^)]+\))?)\s+to\s+/i,
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        // Clean up the extracted title
        const title = match[1].trim()
          .replace(/^[^\w]+|[^\w]+$/g, '') // Remove leading/trailing non-word chars
          .replace(/\s{2,}/g, ' '); // Normalize spaces
        
        // Only return if it looks like a proper title (not too long, not too short)
        if (title.length > 3 && title.length < 50 && /[A-Z]/.test(title)) {
          return title;
        }
      }
    }
    
    // If no pattern matched, try to use the first line from job description if it's capitalized
    const firstLine = description.split('\n')[0].trim();
    if (firstLine && firstLine.length < 50 && /^[A-Z]/.test(firstLine)) {
      return firstLine;
    }
    
    return null;
  };
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="url">
            <LinkIcon className="mr-2 h-4 w-4" />
            URL Import
          </TabsTrigger>
          <TabsTrigger value="manual">Manual Entry</TabsTrigger>
        </TabsList>
        
        <TabsContent value="url" className="space-y-4 pt-4">
          <div>
            <Label htmlFor="job-url" className="block text-gray-700 font-medium mb-2">
              Job Posting URL
            </Label>
            <div className="flex space-x-2">
              <Input
                id="job-url"
                type="url"
                value={jobUrl}
                onChange={(e) => setJobUrl(e.target.value)}
                placeholder="https://www.linkedin.com/jobs/view/..."
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
              Paste a job posting URL to automatically extract company name and job description
            </p>
          </div>
          
          {/* Company name field */}
          <div>
            <Label htmlFor="company-url" className="block text-gray-700 font-medium mb-2">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company-url"
              type="text"
              value={selectedCompany?.name || ''}
              onChange={handleCompanyChange}
              placeholder="Company name will appear here after extraction"
              className="w-full"
              required
            />
          </div>
          
          {/* Job title field - shown when needed */}
          {(needsJobTitle || jobTitle) && (
            <div>
              <Label htmlFor="job-title" className="block text-gray-700 font-medium mb-2">
                Job Title {needsJobTitle && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="job-title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Enter the job title"
                className={`w-full ${needsJobTitle ? 'border-amber-300' : ''}`}
                required={needsJobTitle}
              />
              {needsJobTitle && (
                <p className="text-xs text-amber-600 mt-1">
                  We couldn't detect the job title. Please enter it manually for better analysis.
                </p>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="manual" className="space-y-4 pt-4">
          <div>
            <Label htmlFor="company-manual" className="block text-gray-700 font-medium mb-2">
              Company Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="company-manual"
              type="text"
              value={selectedCompany?.name || ''}
              onChange={handleCompanyChange}
              placeholder="Enter the company name"
              className="w-full"
              required
            />
          </div>
          
          {/* Job title field in manual tab */}
          <div>
            <Label htmlFor="job-title-manual" className="block text-gray-700 font-medium mb-2">
              Job Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="job-title-manual"
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Enter the job title"
              className="w-full"
              required
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySelector;
