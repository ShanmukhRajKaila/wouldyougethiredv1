
import React, { useState, useEffect } from 'react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { useExtractorErrorHandling } from '@/hooks/useExtractorErrorHandling';

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
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('jobDescription');
  const [availableRoles, setAvailableRoles] = useState<{value: string, label: string}[]>([]);
  const [isJobDescriptionValid, setIsJobDescriptionValid] = useState(true);
  
  // Use the enhanced extractor error handling hook
  const { validateExtractedText } = useExtractorErrorHandling({
    setCurrentStage,
    setIsSubmitting
  });
  
  // Define role categories and their specific roles
  const roleCategories = [
    {
      name: "Tech Management",
      value: "tech_management",
      roles: [
        { value: 'product_manager', label: 'Product Manager' },
        { value: 'technical_program_manager', label: 'Technical Program Manager' },
        { value: 'engineering_manager', label: 'Engineering Manager' },
        { value: 'cto', label: 'Chief Technology Officer (CTO)' },
        { value: 'director_of_engineering', label: 'Director of Engineering' },
        { value: 'vp_of_engineering', label: 'VP of Engineering' },
        { value: 'technical_director', label: 'Technical Director' },
        { value: 'it_director', label: 'IT Director' },
        { value: 'chief_product_officer', label: 'Chief Product Officer (CPO)' },
        { value: 'product_director', label: 'Product Director' },
        { value: 'other_tech_management', label: 'Other Tech Management Role' }
      ]
    },
    {
      name: "Finance",
      value: "finance",
      roles: [
        { value: 'investment_banker', label: 'Investment Banker' },
        { value: 'finance_manager', label: 'Finance Manager' },
        { value: 'financial_analyst', label: 'Financial Analyst' },
        { value: 'portfolio_manager', label: 'Portfolio Manager' },
        { value: 'private_equity_associate', label: 'Private Equity Associate' },
        { value: 'hedge_fund_analyst', label: 'Hedge Fund Analyst' },
        { value: 'investment_analyst', label: 'Investment Analyst' },
        { value: 'equity_research_analyst', label: 'Equity Research Analyst' },
        { value: 'cfo', label: 'Chief Financial Officer (CFO)' },
        { value: 'treasury_manager', label: 'Treasury Manager' },
        { value: 'corporate_finance_manager', label: 'Corporate Finance Manager' },
        { value: 'fund_manager', label: 'Fund Manager' },
        { value: 'other_finance', label: 'Other Finance Role' }
      ]
    },
    {
      name: "Consulting",
      value: "consulting",
      roles: [
        { value: 'management_consultant', label: 'Management Consultant' },
        { value: 'strategy_consultant', label: 'Strategy Consultant' },
        { value: 'operations_consultant', label: 'Operations Consultant' },
        { value: 'technology_consultant', label: 'Technology Consultant' },
        { value: 'healthcare_consultant', label: 'Healthcare Consultant' },
        { value: 'financial_consultant', label: 'Financial Consultant' },
        { value: 'human_capital_consultant', label: 'Human Capital Consultant' },
        { value: 'digital_transformation_consultant', label: 'Digital Transformation Consultant' },
        { value: 'sustainability_consultant', label: 'Sustainability Consultant' },
        { value: 'risk_consultant', label: 'Risk Consultant' },
        { value: 'supply_chain_consultant', label: 'Supply Chain Consultant' },
        { value: 'other_consulting', label: 'Other Consulting Role' }
      ]
    },
    {
      name: "Marketing",
      value: "marketing",
      roles: [
        { value: 'marketing_manager', label: 'Marketing Manager' },
        { value: 'brand_manager', label: 'Brand Manager' },
        { value: 'digital_marketing_director', label: 'Digital Marketing Director' },
        { value: 'growth_marketing_manager', label: 'Growth Marketing Manager' },
        { value: 'seo_manager', label: 'SEO Manager' },
        { value: 'content_marketing_manager', label: 'Content Marketing Manager' },
        { value: 'marketing_director', label: 'Marketing Director' },
        { value: 'cmo', label: 'Chief Marketing Officer (CMO)' },
        { value: 'social_media_manager', label: 'Social Media Manager' },
        { value: 'product_marketing_manager', label: 'Product Marketing Manager' },
        { value: 'marketing_analyst', label: 'Marketing Analyst' },
        { value: 'other_marketing', label: 'Other Marketing Role' }
      ]
    },
    {
      name: "Sustainability",
      value: "sustainability",
      roles: [
        { value: 'sustainability_manager', label: 'Sustainability Manager' },
        { value: 'esg_director', label: 'ESG Director' },
        { value: 'environmental_program_manager', label: 'Environmental Program Manager' },
        { value: 'sustainable_business_consultant', label: 'Sustainable Business Consultant' },
        { value: 'corporate_responsibility_manager', label: 'Corporate Responsibility Manager' },
        { value: 'sustainability_director', label: 'Sustainability Director' },
        { value: 'chief_sustainability_officer', label: 'Chief Sustainability Officer' },
        { value: 'climate_change_specialist', label: 'Climate Change Specialist' },
        { value: 'sustainable_finance_manager', label: 'Sustainable Finance Manager' },
        { value: 'circular_economy_specialist', label: 'Circular Economy Specialist' },
        { value: 'other_sustainability', label: 'Other Sustainability Role' }
      ]
    },
    {
      name: "Tech & Engineering",
      value: "tech_engineering",
      roles: [
        { value: 'software_engineer', label: 'Software Engineer' },
        { value: 'data_scientist', label: 'Data Scientist' },
        { value: 'ux_designer', label: 'UX Designer' },
        { value: 'product_designer', label: 'Product Designer' },
        { value: 'devops_engineer', label: 'DevOps Engineer' },
        { value: 'ai_engineer', label: 'AI Engineer' },
        { value: 'full_stack_developer', label: 'Full Stack Developer' },
        { value: 'backend_developer', label: 'Backend Developer' },
        { value: 'frontend_developer', label: 'Frontend Developer' },
        { value: 'mobile_developer', label: 'Mobile Developer' },
        { value: 'data_engineer', label: 'Data Engineer' },
        { value: 'machine_learning_engineer', label: 'Machine Learning Engineer' },
        { value: 'cloud_architect', label: 'Cloud Architect' },
        { value: 'security_engineer', label: 'Security Engineer' },
        { value: 'other_tech', label: 'Other Tech/Engineering Role' }
      ]
    },
    {
      name: "Other",
      value: "other",
      roles: [
        { value: 'other', label: 'Other (Specify)' }
      ]
    }
  ];
  
  // Update available roles when category changes
  useEffect(() => {
    if (selectedCategory) {
      const category = roleCategories.find(cat => cat.value === selectedCategory);
      if (category) {
        setAvailableRoles(category.roles);
        setSelectedRole('');
      }
    } else {
      setAvailableRoles([]);
      setSelectedRole('');
    }
  }, [selectedCategory]);
  
  // Job description validation
  useEffect(() => {
    // Reset validation when job description changes
    if (jobDescription) {
      setIsJobDescriptionValid(true);
    }
  }, [jobDescription]);
  
  // Enhanced job description validation
  const validateJobDescription = (text: string): boolean => {
    if (!text || text.length < 50) return false;
    
    return validateExtractedText(text, 'jobDescription');
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jobDescription.trim()) {
      toast.error('Please enter a job description');
      return;
    }
    
    // Validate job description
    if (!validateJobDescription(jobDescription)) {
      setIsJobDescriptionValid(false);
      toast.warning('The job description appears to be invalid or is too short. Please check and update it.');
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
    
    // Check if we need a custom role name
    const needsCustomRole = selectedRole === 'other' || 
                           selectedRole.includes('other_');
                           
    if (needsCustomRole && !customRole.trim()) {
      toast.error('Please enter a custom role name');
      return;
    }
    
    setIsSearching(true);
    
    try {
      const result = await searchRoleDescriptions(
        selectedRole, 
        needsCustomRole ? customRole : undefined
      );
      
      if (result && result.consolidatedDescription) {
        setJobDescription(result.consolidatedDescription);
        setActiveTab('jobDescription');
        
        // Set the role title based on the selection
        let roleLabel = '';
        if (needsCustomRole) {
          roleLabel = customRole;
        } else {
          const role = availableRoles.find(r => r.value === selectedRole);
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
  
  // Determine if the selected role needs a custom role input
  const showCustomRoleInput = selectedRole === 'other' || selectedRole.includes('other_');
  
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
                  onChange={(e) => {
                    setJobDescription(e.target.value);
                    if (!e.target.value.trim()) {
                      setIsJobDescriptionValid(true); // Reset validation for empty field
                    }
                  }}
                  placeholder="Paste the job description here..."
                  className={`min-h-[200px] ${!isJobDescriptionValid ? "border-red-500 focus-visible:ring-red-300" : ""}`}
                  required
                />
                
                {!isJobDescriptionValid && (
                  <p className="text-red-500 text-sm mt-1">
                    The job description appears to be invalid or contains login/registration text. Please check and update it.
                  </p>
                )}
                
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="categorySelect" className="block text-consulting-charcoal font-medium mb-2">
                  Role Category <span className="text-red-500">*</span>
                </Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-72">
                      {roleCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="roleSelect" className="block text-consulting-charcoal font-medium mb-2">
                  Specific Role <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={selectedRole} 
                  onValueChange={setSelectedRole}
                  disabled={!selectedCategory}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={selectedCategory ? "Select a role" : "Select a category first"} />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-72">
                      {availableRoles.map((role) => (
                        <SelectItem key={role.value} value={role.value}>
                          {role.label}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {showCustomRoleInput && (
              <div className="mt-6">
                <Label htmlFor="customRole" className="block text-consulting-charcoal font-medium mb-2">
                  Custom Role <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="customRole"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="e.g., Data Scientist, UX Designer"
                  className="w-full"
                  required={showCustomRoleInput}
                />
              </div>
            )}
            
            <div className="mt-6">
              <Button 
                type="button"
                onClick={handleSearchRole}
                disabled={
                  !selectedRole || 
                  (showCustomRoleInput && !customRole.trim()) || 
                  isSearching
                }
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

// Need to import cn for classname conditionals
const cn = (...args: any[]) => args.filter(Boolean).join(' ');

export default JobDescriptionPage;
