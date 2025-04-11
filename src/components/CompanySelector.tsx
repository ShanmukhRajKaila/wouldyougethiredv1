
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
      
      // Show extraction status
      if (extractionResult.error) {
        toast.error(extractionResult.error);
      } else {
        toast.success('Job details extracted successfully');
      }

      // Update company name if available
      if (extractionResult.companyName) {
        setSelectedCompany({
          id: 'extracted',
          name: extractionResult.companyName,
          logo: ''
        });
      }

      // Update job description if available
      if (extractionResult.jobDescription) {
        setJobDescription(extractionResult.jobDescription);
      }
      
      // Show relevant feedback based on what was extracted
      if (extractionResult.companyName && !extractionResult.jobDescription) {
        toast.info('Only company name was extracted. Please review and add job description manually if needed.');
      } else if (!extractionResult.companyName && extractionResult.jobDescription) {
        toast.info('Only job description was extracted. Please enter company name manually.');
      } else if (!extractionResult.companyName && !extractionResult.jobDescription) {
        toast.warning('Could not extract information from the URL. Please enter details manually.');
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
          
          {/* Company name field is still visible in URL tab */}
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CompanySelector;
