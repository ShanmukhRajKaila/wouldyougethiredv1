
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import CompanySelector from '@/components/CompanySelector';
import { toast } from 'sonner';
import { Label } from '@/components/ui/label';
import { searchRoleDescriptions, convertJobToRoleDescription } from '@/context/operations';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [roleTitle, setRoleTitle] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('jobDescription');
  
  const roleOptions = [
    { value: 'product_management', label: 'Product Management' },
    { value: 'finance', label: 'Finance' },
    { value: 'consulting', label: 'Consulting' },
    { value: 'marketing', label: 'Marketing' },
    { value: 'sustainability', label: 'Sustainability' },
    { value: 'other', label: 'Other (Custom)' }
  ];
  
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
      // Store role title in local storage for later use
      if (roleTitle.trim()) {
        localStorage.setItem('jobRoleTitle', roleTitle.trim());
      }
      
      const jobDescriptionId = await saveJobDescription(currentLeadId);
      
      if (jobDescriptionId) {
        setCurrentStage('resumeUpload');
        setProgress(50);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleSearchRole = async () => {
    if (!selectedRole) {
      toast.error('Please select a role');
      return;
    }
    
    if (selectedRole === 'other' && !customRole.trim()) {
      toast.error('Please enter a custom role');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const result = await searchRoleDescriptions(
        selectedRole, 
        selectedRole === 'other' ? customRole : undefined
      );
      
      if (result && result.consolidatedDescription) {
        setJobDescription(result.consolidatedDescription);
        setActiveTab('jobDescription');
        
        // Set the role title based on the selection
        let roleLabel = '';
        if (selectedRole === 'other') {
          roleLabel = customRole;
        } else {
          const roleOption = roleOptions.find(option => option.value === selectedRole);
          roleLabel = roleOption ? roleOption.label : '';
        }
        
        setRoleTitle(roleLabel);
        localStorage.setItem('jobRoleTitle', roleLabel);
        
        toast.success('Role description loaded successfully');
      }
    } catch (error) {
      console.error('Error searching for role descriptions:', error);
      toast.error('Failed to search for role descriptions');
    } finally {
      setIsSearching(false);
    }
  };
  
  const handleConvertJobToRole = async () => {
    if (!jobDescription || jobDescription.length < 100) {
      toast.error('Please enter a more detailed job description to extract role information');
      return;
    }
    
    toast.loading('Converting job description to role format...');
    
    try {
      const roleDescription = await convertJobToRoleDescription(jobDescription);
      
      if (roleDescription) {
        setJobDescription(roleDescription);
        toast.success('Job description converted to role format');
      } else {
        toast.error('Could not convert job description to role format');
      }
    } catch (error) {
      console.error('Error converting job description:', error);
      toast.error('Failed to convert job description');
    }
  };
  
  return (
    <PageContainer>
      <div className="step-container animate-slide-in">
        <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
          Job Description
        </h1>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="jobDescription">Enter Job Description</TabsTrigger>
            <TabsTrigger value="roleSearch">Search Role Description</TabsTrigger>
          </TabsList>
          
          <TabsContent value="jobDescription">
            <p className="text-consulting-gray mb-8">
              Paste the job description for the role you're applying to. You can enter company name and role title optionally.
            </p>
            
            <form onSubmit={handleSubmit}>
              <CompanySelector />
              
              <div className="mb-6">
                <Label htmlFor="roleTitle" className="block text-consulting-charcoal font-medium mb-2">
                  Role Title <span className="text-gray-500 text-sm font-normal">(optional)</span>
                </Label>
                <Input
                  id="roleTitle"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g., Data Analyst, Software Engineer"
                  className="w-full"
                />
              </div>
              
              <div className="mb-6">
                <Label htmlFor="jobDescription" className="block text-consulting-charcoal font-medium mb-2">
                  Job Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="jobDescription"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[200px]"
                  required
                />
                
                <div className="flex justify-end mt-2">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleConvertJobToRole}
                    className="text-sm"
                  >
                    Format as Role Description
                  </Button>
                </div>
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
          </TabsContent>
          
          <TabsContent value="roleSearch">
            <p className="text-consulting-gray mb-8">
              Search for descriptions of standard roles. This will help you understand typical requirements and responsibilities.
            </p>
            
            <div className="mb-6">
              <Label htmlFor="roleSelect" className="block text-consulting-charcoal font-medium mb-2">
                Select Role <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a role category" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedRole === 'other' && (
              <div className="mb-6">
                <Label htmlFor="customRole" className="block text-consulting-charcoal font-medium mb-2">
                  Custom Role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customRole"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g., Data Scientist, UX Designer"
                  className="w-full"
                  required={selectedRole === 'other'}
                />
              </div>
            )}
            
            <div className="mb-6">
              <Button 
                type="button"
                onClick={handleSearchRole}
                disabled={!selectedRole || (selectedRole === 'other' && !customRole.trim()) || isSearching}
                className="bg-consulting-navy hover:bg-consulting-blue w-full"
              >
                {isSearching ? 'Searching...' : 'Search Role Descriptions'}
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                This will search for typical descriptions for this role from job postings online.
              </p>
            </div>
            
            {jobDescription && (
              <div className="mt-8">
                <Button 
                  type="button"
                  onClick={() => setActiveTab('jobDescription')}
                  variant="outline"
                  className="w-full"
                >
                  View Found Description
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PageContainer>
  );
};

export default JobDescriptionPage;
