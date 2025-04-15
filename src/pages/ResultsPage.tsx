import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAppContext } from '@/context/AppContext';
import PageContainer from '@/components/PageContainer';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import ResumeComparison from '@/components/ResumeComparison';
import StarAnalysis from '@/components/StarAnalysis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Check, X, ArrowRight } from "lucide-react";

const ResultsPage: React.FC = () => {
  const { resetApplication, jobDescription, analysisResults, selectedCompany } = useAppContext();
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [inputRole, setInputRole] = useState('');
  const [expandAll, setExpandAll] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  
  useEffect(() => {
    if (!analysisResults) {
      console.error('No analysis results available');
    }
    
    // Try to get role from localStorage first (saved from JobDescriptionPage)
    const savedRole = localStorage.getItem('jobRoleTitle');
    if (savedRole) {
      setSelectedRole(savedRole);
      return;
    }
    
    // Otherwise extract role from job description
    if (jobDescription) {
      const jobTitle = extractJobTitle(jobDescription);
      if (jobTitle) {
        setSelectedRole(jobTitle);
      } else {
        // If no job title detected, prompt user
        setShowRoleDialog(true);
        setInputRole('');
      }
    }
  }, [jobDescription, analysisResults]);
  
  // Function to extract job title from job description
  const extractJobTitle = (description: string): string => {
    // Common patterns for job titles in descriptions
    const patterns = [
      /position:\s*([^\.]+)/i,
      /job title:\s*([^\.]+)/i,
      /role:\s*([^\.]+)/i,
      /we are looking for a[n]?\s+([^\.]+)/i,
      /hiring a[n]?\s+([^\.]+)/i,
    ];
    
    for (const pattern of patterns) {
      const match = description.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    
    // If no pattern matched, try to use the first line if it's not too long
    const firstLine = description.split('\n')[0].trim();
    if (firstLine && firstLine.length < 50) {
      return firstLine;
    }
    
    return '';
  };
  
  const handleRoleSubmit = () => {
    setSelectedRole(inputRole);
    setShowRoleDialog(false);
  };
  
  const handleExpandToggle = () => {
    const newExpandState = !expandAll;
    setExpandAll(newExpandState);
    
    // Update all items based on the new expand state
    let updatedItems: Record<string, boolean> = {};
    if (analysisResults) {
      if (analysisResults.strengths) {
        analysisResults.strengths.forEach((_, idx) => {
          updatedItems[`strength-${idx}`] = newExpandState;
        });
      }
      if (analysisResults.weaknesses) {
        analysisResults.weaknesses.forEach((_, idx) => {
          updatedItems[`weakness-${idx}`] = newExpandState;
        });
      }
      if (analysisResults.recommendations) {
        analysisResults.recommendations.forEach((_, idx) => {
          updatedItems[`recommendation-${idx}`] = newExpandState;
        });
      }
    }
    
    setExpandedItems(updatedItems);
  };
  
  const toggleItemExpand = (key: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // If no results are available, show an error message
  if (!analysisResults) {
    return (
      <PageContainer>
        <div className="animate-fade-in text-center py-16">
          <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-6">
            Analysis Results Unavailable
          </h1>
          <p className="text-consulting-gray mb-8">
            We couldn't retrieve your analysis results. Please try uploading your resume again.
          </p>
          <Button 
            onClick={() => {
              resetApplication();
            }}
            className="bg-consulting-navy hover:bg-consulting-blue"
          >
            Start Over
          </Button>
        </div>
      </PageContainer>
    );
  }
  
  // Extract values from the analysisResults
  const {
    verdict = false,
    alignmentScore = 0,
    strengths = [],
    weaknesses = [],
    recommendations = [],
    starAnalysis = []
  } = analysisResults;
  
  return (
    <PageContainer>
      <div className="animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold text-consulting-navy mb-2">
              Your Resume Analysis Results
            </h1>
            <p className="text-consulting-gray">
              {selectedCompany?.name ? (
                <><span className="font-medium">Company:</span> {selectedCompany.name} | <span className="font-medium">Role:</span> {selectedRole || "Click to add role"}</>
              ) : (
                <><span className="font-medium">Role:</span> <span 
                  onClick={() => setShowRoleDialog(true)} 
                  className={`${!selectedRole ? "text-blue-500 underline cursor-pointer" : ""}`}
                >
                  {selectedRole || "Click to add role"}
                </span></>
              )}
            </p>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md">
            <div className="text-center mb-2">
              <p className="text-sm text-consulting-gray font-medium">Final Verdict</p>
              <h2 className={`text-2xl font-bold ${verdict ? 'text-green-600' : 'text-red-600'}`}>
                {verdict ? 'Would Likely Be Hired' : 'Unlikely to Be Hired'}
              </h2>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
              <div 
                className={`h-2.5 rounded-full ${
                  alignmentScore >= 80 ? 'bg-green-600' : 
                  alignmentScore >= 60 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${alignmentScore}%` }}
              ></div>
            </div>
            <p className="text-xs text-consulting-gray">Alignment Score: {alignmentScore}%</p>
          </div>
        </div>
        
        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="resume">Resume Comparison</TabsTrigger>
            <TabsTrigger value="star">STAR Analysis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="summary">
            <div className="mb-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={handleExpandToggle}
                className="text-sm"
              >
                {expandAll ? (
                  <><ChevronUp className="mr-1 h-4 w-4" /> Collapse All</>
                ) : (
                  <><ChevronDown className="mr-1 h-4 w-4" /> Expand All</>
                )}
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-green-600 mb-4 flex items-center">
                  <Check className="mr-2 h-5 w-5" /> Key Strengths
                </h2>
                <ul className="space-y-4">
                  {strengths && strengths.length > 0 ? (
                    strengths.map((strength, index) => {
                      const itemKey = `strength-${index}`;
                      const isExpanded = expandedItems[itemKey] || expandAll;
                      
                      return (
                        <li key={index}>
                          <Collapsible 
                            open={isExpanded} 
                            onOpenChange={(open) => {
                              toggleItemExpand(itemKey);
                            }}
                            className="border rounded-md"
                          >
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-gray-50">
                              <div className="flex items-start">
                                <span className="text-green-600 mr-2 mt-1">✓</span>
                                <span className="font-medium">{strength.split(':')[0] || strength}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
                              <p className="mb-2">{strength}</p>
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <h4 className="font-semibold text-xs text-gray-700">Why this matters:</h4>
                                <p className="text-xs mt-1">This strength directly aligns with the job requirements. Employers are specifically looking for candidates who demonstrate this capability in the role.</p>
                              </div>
                            </CollapsibleContent>
                          </Collapsible>
                        </li>
                      );
                    })
                  ) : (
                    <li>No strengths identified</li>
                  )}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-red-600 mb-4 flex items-center">
                  <X className="mr-2 h-5 w-5" /> Areas for Improvement
                </h2>
                <ul className="space-y-4">
                  {weaknesses && weaknesses.length > 0 ? (
                    weaknesses.map((weakness, index) => {
                      const itemKey = `weakness-${index}`;
                      const isExpanded = expandedItems[itemKey] || expandAll;
                      
                      return (
                        <li key={index}>
                          <Collapsible 
                            open={isExpanded}
                            onOpenChange={(open) => {
                              toggleItemExpand(itemKey);
                            }}
                            className="border rounded-md"
                          >
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-gray-50">
                              <div className="flex items-start">
                                <span className="text-red-600 mr-2 mt-1">✗</span>
                                <span className="font-medium">{weakness.split(':')[0] || weakness}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
                              <p>{weakness}</p>
                            </CollapsibleContent>
                          </Collapsible>
                        </li>
                      );
                    })
                  ) : (
                    <li>No areas for improvement identified</li>
                  )}
                </ul>
              </Card>
              
              <Card className="p-6">
                <h2 className="text-xl font-serif font-bold text-consulting-navy mb-4 flex items-center">
                  <ArrowRight className="mr-2 h-5 w-5" /> Recommendations
                </h2>
                <ul className="space-y-4">
                  {recommendations && recommendations.length > 0 ? (
                    recommendations.map((recommendation, index) => {
                      const itemKey = `recommendation-${index}`;
                      const isExpanded = expandedItems[itemKey] || expandAll;
                      
                      return (
                        <li key={index}>
                          <Collapsible 
                            open={isExpanded}
                            onOpenChange={(open) => {
                              toggleItemExpand(itemKey);
                            }}
                            className="border rounded-md"
                          >
                            <CollapsibleTrigger className="flex w-full items-center justify-between p-3 hover:bg-gray-50">
                              <div className="flex items-start">
                                <span className="text-consulting-accent mr-2 mt-1">→</span>
                                <span className="font-medium">{recommendation.split(':')[0] || recommendation}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
                              <p>{recommendation}</p>
                            </CollapsibleContent>
                          </Collapsible>
                        </li>
                      );
                    })
                  ) : (
                    <li>No recommendations available</li>
                  )}
                </ul>
              </Card>
            </div>
            
            <div className="mt-8 flex justify-center">
              <Button 
                onClick={resetApplication}
                className="bg-consulting-navy hover:bg-consulting-blue"
              >
                Try Another Application
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="resume">
            <ResumeComparison starAnalysis={starAnalysis} />
          </TabsContent>
          
          <TabsContent value="star">
            <StarAnalysis starAnalysis={starAnalysis} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Job Role Dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Job Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              We couldn't automatically detect the job role from the job description. 
              Please enter it manually to continue.
            </p>
            <Input 
              placeholder="e.g. Data Analyst, Software Engineer" 
              value={inputRole} 
              onChange={(e) => setInputRole(e.target.value)}
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleRoleSubmit} disabled={!inputRole.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
};

export default ResultsPage;
