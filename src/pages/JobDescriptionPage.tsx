
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
  
  // Comprehensive list of specific roles organized by industry
  const roleCategories = [
    {
      name: "Tech Management",
      roles: [
        { value: 'product_manager', label: 'Product Manager' },
        { value: 'technical_program_manager', label: 'Technical Program Manager' },
        { value: 'engineering_manager', label: 'Engineering Manager' },
        { value: 'cto', label: 'Chief Technology Officer (CTO)' },
        { value: 'director_of_engineering', label: 'Director of Engineering' }
      ]
    },
    {
      name: "Finance",
      roles: [
        { value: 'investment_banker', label: 'Investment Banker' },
        { value: 'finance_manager', label: 'Finance Manager' },
        { value: 'financial_analyst', label: 'Financial Analyst' },
        { value: 'portfolio_manager', label: 'Portfolio Manager' },
        { value: 'private_equity_associate', label: 'Private Equity Associate' }
      ]
    },
    {
      name: "Consulting",
      roles: [
        { value: 'management_consultant', label: 'Management Consultant' },
        { value: 'strategy_consultant', label: 'Strategy Consultant' },
        { value: 'operations_consultant', label: 'Operations Consultant' },
        { value: 'technology_consultant', label: 'Technology Consultant' },
        { value: 'healthcare_consultant', label: 'Healthcare Consultant' }
      ]
    },
    {
      name: "Marketing",
      roles: [
        { value: 'marketing_manager', label: 'Marketing Manager' },
        { value: 'brand_manager', label: 'Brand Manager' },
        { value: 'digital_marketing_director', label: 'Digital Marketing Director' },
        { value: 'growth_marketing_manager', label: 'Growth Marketing Manager' },
        { value: 'seo_manager', label: 'SEO Manager' }
      ]
    },
    {
      name: "Sustainability",
      roles: [
        { value: 'sustainability_manager', label: 'Sustainability Manager' },
        { value: 'esg_director', label: 'ESG Director' },
        { value: 'environmental_program_manager', label: 'Environmental Program Manager' },
        { value: 'sustainable_business_consultant', label: 'Sustainable Business Consultant' },
        { value: 'corporate_responsibility_manager', label: 'Corporate Responsibility Manager' }
      ]
    },
    {
      name: "Tech & Engineering",
      roles: [
        { value: 'software_engineer', label: 'Software Engineer' },
        { value: 'data_scientist', label: 'Data Scientist' },
        { value: 'ux_designer', label: 'UX Designer' },
        { value: 'product_designer', label: 'Product Designer' },
        { value: 'devops_engineer', label: 'DevOps Engineer' },
        { value: 'ai_engineer', label: 'AI Engineer' }
      ]
    },
    {
      name: "Other",
      roles: [
        { value: 'other', label: 'Other (Specify)' }
      ]
    }
  ];
  
  // Flatten all roles for easier validation
  const allRoles = roleCategories.flatMap(category => category.roles);
  
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
          const role = allRoles.find(r => r.value === selectedRole);
          roleLabel = role ? role.label : '';
        }
        
        setRoleTitle(roleLabel);
        localStorage.setItem('jobRoleTitle', roleLabel);
        
        toast.success('Role description loaded successfully');
      } else {
        toast.warning('Could not find detailed role descriptions. Please try a different role or enter manually.');
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
    
    const loadingToast = toast.loading('Converting job description to role format...');
    
    try {
      const roleDescription = await convertJobToRoleDescription(jobDescription);
      
      toast.dismiss(loadingToast);
      
      if (roleDescription) {
        setJobDescription(roleDescription);
        toast.success('Job description converted to role format');
      } else {
        toast.error('Could not convert job description to role format');
      }
    } catch (error) {
      toast.dismiss(loadingToast);
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
              Search for descriptions of specific roles. This will help you understand typical requirements and responsibilities.
            </p>
            
            <div className="mb-6">
              <Label htmlFor="roleSelect" className="block text-consulting-charcoal font-medium mb-2">
                Role Category <span className="text-red-500">*</span>
              </Label>
              <Select value={selectedRole} onValueChange={setSelectedRole}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a specific role" />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {roleCategories.map((category) => (
                    <React.Fragment key={category.name}>
                      <div className="px-2 py-1.5 text-sm font-medium text-gray-500 bg-gray-50">{category.name}</div>
                      {category.roles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </React.Fragment>
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
                {isSearching ? 'Searching...' : 'Search Role Description'}
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
