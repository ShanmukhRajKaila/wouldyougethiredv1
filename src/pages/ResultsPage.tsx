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
    
    const savedRole = localStorage.getItem('jobRoleTitle');
    if (savedRole) {
      setSelectedRole(savedRole);
    } else if (jobDescription) {
      const jobTitle = extractJobTitle(jobDescription);
      if (jobTitle) {
        setSelectedRole(jobTitle);
        localStorage.setItem('jobRoleTitle', jobTitle);
      }
    }
  }, [jobDescription, analysisResults]);
  
  const extractJobTitle = (description: string): string => {
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
    
    const firstLine = description.split('\n')[0].trim();
    if (firstLine && firstLine.length < 50) {
      return firstLine;
    }
    
    return 'Job Position';
  };
  
  const handleRoleSubmit = () => {
    setSelectedRole(inputRole);
    setShowRoleDialog(false);
    localStorage.setItem('jobRoleTitle', inputRole);
  };
  
  const handleExpandToggle = () => {
    const newExpandState = !expandAll;
    setExpandAll(newExpandState);
    
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
  
  const generateStrengthExplanation = (strength: string): string => {
    if (strength.toLowerCase().includes("experience")) {
      return "Your demonstrated experience in this area provides concrete proof of your capabilities. Consider quantifying this experience with specific metrics or highlighting a particular project where this strength made a significant impact.";
    } else if (strength.toLowerCase().includes("skill") || strength.toLowerCase().includes("proficiency")) {
      return "This technical proficiency is a key differentiator for you. Try mentioning how you've applied this skill in non-standard ways or to solve complex problems that others couldn't address.";
    } else if (strength.toLowerCase().includes("leader") || strength.toLowerCase().includes("manage")) {
      return "Your leadership abilities suggest you can take on greater responsibilities. In your interviews, prepare stories about how you've developed team members or navigated difficult decisions that showcased this quality.";
    } else if (strength.toLowerCase().includes("communicat") || strength.toLowerCase().includes("collaborat")) {
      return "This soft skill is increasingly valued in cross-functional teams. Consider preparing examples of how you've bridged communication gaps or facilitated collaboration between different departments or stakeholders.";
    } else if (strength.toLowerCase().includes("analy") || strength.toLowerCase().includes("data")) {
      return "Your analytical capabilities set you apart in a data-driven workplace. Prepare to discuss how you translate raw data into actionable insights that drive business outcomes.";
    } else if (strength.toLowerCase().includes("project") || strength.toLowerCase().includes("deliver")) {
      return "Your track record of successful delivery demonstrates reliability. Focus on describing your methodology for ensuring projects stay on track even when facing unexpected obstacles.";
    } else {
      return "This strength directly aligns with core requirements for the role. During interviews, connect this ability to specific business challenges the company faces based on your research about their current market position.";
    }
  };
  
  const generateWeaknessExplanation = (weakness: string): string => {
    if (weakness.toLowerCase().includes("experience") || weakness.toLowerCase().includes("background")) {
      return "Consider taking on freelance projects or volunteer opportunities that will build this experience quickly. Even a small self-directed project can provide talking points to address this gap in interviews.";
    } else if (weakness.toLowerCase().includes("technical") || weakness.toLowerCase().includes("skill")) {
      return "Employers often value learning capacity over existing knowledge. Create a learning plan with specific milestones to develop this skill, and mention in interviews that you're actively upskilling in this area.";
    } else if (weakness.toLowerCase().includes("certif") || weakness.toLowerCase().includes("qualif")) {
      return "Research which certification programs are most respected in this field. Even beginning the certification process before interviews can demonstrate your commitment to professional development.";
    } else if (weakness.toLowerCase().includes("tool") || weakness.toLowerCase().includes("software")) {
      return "Consider reaching out to professionals who use this tool daily for a short informational interview. This will help you understand whether investing time in learning this tool will truly provide value for your career path.";
    } else if (weakness.toLowerCase().includes("industr") || weakness.toLowerCase().includes("sector")) {
      return "Industry knowledge can be gained through targeted networking. Join relevant professional groups and attend webinars to quickly build contextual understanding that can compensate for limited direct experience.";
    } else if (weakness.toLowerCase().includes("lead") || weakness.toLowerCase().includes("manage")) {
      return "Leadership skills can be developed outside traditional management roles. Look for opportunities to lead initiatives or mentor colleagues, then document these experiences for your interviews.";
    } else {
      return "This gap might be addressed through targeted self-development. Research online courses from platforms like Coursera or LinkedIn Learning that specifically address this area, and begin building demonstrable skills you can discuss in interviews.";
    }
  };
  
  const generateRecommendationExplanation = (recommendation: string): string => {
    if (recommendation.toLowerCase().includes("highlight")) {
      return "When implementing this change, focus on using industry-specific terminology that demonstrates insider knowledge. Recruiters often scan for these terms as signals that you understand the field's context and challenges.";
    } else if (recommendation.toLowerCase().includes("add") || recommendation.toLowerCase().includes("include")) {
      return "As you add this information, consider creating a 'success story' format that follows the STAR method (Situation, Task, Action, Result) to make this addition more memorable and impactful to hiring managers.";
    } else if (recommendation.toLowerCase().includes("focus") || recommendation.toLowerCase().includes("emphasize")) {
      return "When emphasizing this area, consider creating a separate skills section that visually prioritizes these capabilities. This formatting change can direct the reader's attention to your most relevant qualifications.";
    } else if (recommendation.toLowerCase().includes("training") || recommendation.toLowerCase().includes("course") || recommendation.toLowerCase().includes("learn")) {
      return "After completing relevant learning, update your LinkedIn profile and resume simultaneously. Many employers cross-check these platforms for consistency and to verify your commitment to professional development.";
    } else if (recommendation.toLowerCase().includes("quantif") || recommendation.toLowerCase().includes("metric")) {
      return "When adding numbers to your resume, ensure they're precisely accurate as they may be verified. Consider creating a separate document with more detailed context around these metrics to reference during interviews.";
    } else if (recommendation.toLowerCase().includes("project") || recommendation.toLowerCase().includes("portfolio")) {
      return "As you develop your portfolio, focus on quality over quantity. A single well-documented project that clearly demonstrates the relevant skills will be more valuable than multiple superficial examples.";
    } else {
      return "Consider how this change might affect your personal brand consistency across all job search platforms. Ensure that your LinkedIn, portfolio website, and GitHub profiles reflect this same strategic emphasis.";
    }
  };
  
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
                      const strengthTitle = strength.split(':')[0] || strength;
                      
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
                                <span className="font-medium">{strengthTitle}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
                              <div className="pt-2">
                                <h4 className="font-semibold text-xs text-gray-700">How to leverage this strength:</h4>
                                <p className="text-xs mt-1">{generateStrengthExplanation(strength)}</p>
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
                      const weaknessTitle = weakness.split(':')[0] || weakness;
                      
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
                                <span className="font-medium">{weaknessTitle}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
                              <div className="pt-2">
                                <h4 className="font-semibold text-xs text-gray-700">How to address this gap:</h4>
                                <p className="text-xs mt-1">{generateWeaknessExplanation(weakness)}</p>
                              </div>
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
                      const recommendationTitle = recommendation.split(':')[0] || recommendation;
                      
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
                                <span className="font-medium">{recommendationTitle}</span>
                              </div>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4 text-gray-500" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-gray-500" />
                              )}
                            </CollapsibleTrigger>
                            <CollapsibleContent className="px-4 py-2 text-sm text-gray-600 bg-gray-50 border-t">
                              <div className="pt-2">
                                <h4 className="font-semibold text-xs text-gray-700">Implementation strategy:</h4>
                                <p className="text-xs mt-1">{generateRecommendationExplanation(recommendation)}</p>
                              </div>
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
      
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Enter Job Role</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-500 mb-4">
              Please enter the job role title.
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
