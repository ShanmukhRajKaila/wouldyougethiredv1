
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
    const lowerStrength = strength.toLowerCase();
    
    if (lowerStrength.includes("experience") && lowerStrength.includes("year")) {
      return "Years of experience serve as a trust signal to employers that you've seen industry cycles and can navigate complex situations. This longevity demonstrates commitment and adaptability that many candidates lack. Consider preparing stories that highlight how your perspective has evolved over time.";
    }
    
    if (lowerStrength.includes("experience")) {
      return "Domain expertise is especially valuable in this role because it reduces onboarding time and risk. Employers see this as evidence you can hit the ground running and bring valuable context to the team. Be prepared to discuss specific challenges unique to this field that you've already overcome.";
    }
    
    if (lowerStrength.includes("skill") || lowerStrength.includes("proficien")) {
      return "Technical proficiency in this area gives you a competitive edge because it solves a specific pain point for this employer. Many candidates claim similar skills without demonstrable results—be ready to explain how you developed this capability and the specific business outcomes it enabled.";
    }
    
    if (lowerStrength.includes("leader") || lowerStrength.includes("manag")) {
      return "Leadership capabilities address the hidden need for candidates who can both execute individually and scale their impact through others. This signals promotability and longevity with the company. Consider how you might articulate your leadership philosophy in ways that align with this company's culture.";
    }
    
    if (lowerStrength.includes("communicat") || lowerStrength.includes("collaborat")) {
      return "Strong communication skills are increasingly valued as work becomes more cross-functional and remote. This capability signals that you can influence without authority and navigate complex stakeholder landscapes. Consider preparing examples that demonstrate your ability to translate technical concepts to business stakeholders or vice versa.";
    }
    
    if (lowerStrength.includes("analy") || lowerStrength.includes("data")) {
      return "Analytical abilities indicate you can make evidence-based decisions rather than relying solely on intuition. This is particularly valuable in today's data-rich environment where companies need team members who can extract insights from complex information. Consider discussing a time when your analysis led to a non-obvious but successful decision.";
    }
    
    if (lowerStrength.includes("project") || lowerStrength.includes("deliver")) {
      return "Delivery track record is a strong predictor of future performance that addresses the employer's need for reliable execution. Many candidates talk about capabilities without showing results. Your history of successful delivery is a competitive differentiator that deserves emphasis in interviews.";
    }
    
    if (lowerStrength.includes("problem") || lowerStrength.includes("solution")) {
      return "Problem-solving abilities are increasingly valuable in a business environment characterized by complexity and ambiguity. Your demonstrated capacity to tackle undefined challenges makes you adaptable to changing requirements and valuable across multiple contexts within the organization.";
    }
    
    if (lowerStrength.includes("innovat") || lowerStrength.includes("creativ")) {
      return "Innovation capability addresses the company's need for continuous improvement and adaptation. Your ability to think beyond conventional approaches suggests you'll continue adding value as the role and industry evolve. Consider discussing how you balance creative thinking with practical implementation.";
    }
    
    if (lowerStrength.includes("customer") || lowerStrength.includes("client")) {
      return "Customer-centricity differentiates you in a market where many candidates focus solely on technical capabilities or internal processes. Your orientation toward customer needs signals an understanding of the business's ultimate purpose and suggests you'll prioritize work that delivers real value.";
    }
    
    return "This strength directly addresses a core requirement for the position and demonstrates alignment between your background and the role's needs. In interviews, consider exploring how this capability has evolved throughout your career and how you might apply it to the specific challenges mentioned in the job description.";
  };
  
  const generateWeaknessExplanation = (weakness: string): string => {
    const lowerWeakness = weakness.toLowerCase();
    
    if (lowerWeakness.includes("experience") && (lowerWeakness.includes("lack") || lowerWeakness.includes("limited"))) {
      return "Experience gaps are often overemphasized in job requirements. Research shows that performance correlation with experience plateaus after 2-3 years in similar roles. Focus instead on your learning velocity and transferable experiences that demonstrate you can quickly close this gap while bringing fresh perspectives that long-tenured candidates might lack.";
    }
    
    if (lowerWeakness.includes("technical") || lowerWeakness.includes("technolog")) {
      return "Technical knowledge gaps are among the easiest to address because of widely available resources and your demonstrated ability to learn. This is primarily a short-term limitation rather than a fundamental obstacle. Your transferable problem-solving approach is likely more valuable than specific technical knowledge that could become obsolete.";
    }
    
    if (lowerWeakness.includes("certif") || lowerWeakness.includes("qualif")) {
      return "While certifications provide useful signals, they're often poor predictors of on-the-job success compared to demonstrated capabilities. Many employers value candidates who have learned through practical application rather than formal certification paths. Consider how you can reframe your hands-on experience as more valuable than credentials.";
    }
    
    if (lowerWeakness.includes("tool") || lowerWeakness.includes("software")) {
      return "Specific tool knowledge is typically the fastest skill gap to close. Most modern software tools are designed for intuitive adoption and have extensive documentation. Your demonstrated proficiency with related tools suggests you'll have a short learning curve while bringing valuable cross-tool insights that specialists might miss.";
    }
    
    if (lowerWeakness.includes("industr") || lowerWeakness.includes("sector")) {
      return "Industry-specific knowledge can create initial friction but often leads to more innovative approaches. Research shows that industry outsiders often drive transformative change because they're not constrained by 'how things have always been done.' Your fresh perspective could be more valuable than deep industry knowledge if properly contextualized.";
    }
    
    if (lowerWeakness.includes("lead") || lowerWeakness.includes("manage")) {
      return "Leadership experience is contextual and develops non-linearly. Many hiring managers overvalue formal leadership titles while undervaluing informal influence and cross-functional leadership. Consider how you've led initiatives, mentored colleagues, or influenced decisions without formal authority as alternative evidence of leadership capabilities.";
    }
    
    if (lowerWeakness.includes("skill") && (lowerWeakness.includes("soft") || lowerWeakness.includes("interpersonal"))) {
      return "Interpersonal skills are often judged subjectively and context-dependent. What appears as a limitation in one environment may be a strength in another. Consider how your communication and collaboration style might actually align better with this company's culture than with previous environments where different approaches were valued.";
    }
    
    if (lowerWeakness.includes("language") || lowerWeakness.includes("programming")) {
      return "Programming language knowledge is increasingly transferable as patterns standardize across languages. Research indicates that proficient developers can become productive in new languages within weeks rather than months. Your existing technical foundation provides the conceptual understanding needed to quickly adapt to new syntax and frameworks.";
    }
    
    if (lowerWeakness.includes("remote") || lowerWeakness.includes("virtual")) {
      return "Remote work capabilities are rapidly evolving with improving tools and practices. Many skills that seemed specialized to remote environments are becoming standard professional practices. Your adaptability and communication skills likely provide the foundation needed to excel in distributed teams with minimal transition time.";
    }
    
    return "This potential gap represents an opportunity to demonstrate your adaptability and growth mindset. Research shows that candidates who acknowledge areas for development and demonstrate active learning often outperform those with static skill sets. Consider framing this as an area where you've already begun developing capability rather than a fixed limitation.";
  };
  
  const generateRecommendationExplanation = (recommendation: string): string => {
    const lowerRec = recommendation.toLowerCase();
    
    if (lowerRec.includes("highlight") || lowerRec.includes("emphasize")) {
      return "Emphasizing this aspect of your background addresses a key hiring bias: most recruiters spend less than 10 seconds initially scanning resumes. Strategic emphasis ensures your most relevant experiences receive attention during this critical first impression. This isn't about changing your experience, but about ensuring your most relevant capabilities aren't overlooked.";
    }
    
    if (lowerRec.includes("add") || lowerRec.includes("include")) {
      return "Including this information addresses a fundamental information asymmetry in the hiring process. Recruiters have specific unstated requirements that they're screening for—this addition helps bridge the gap between your actual capabilities and what might otherwise remain an invisible requirement. This creates a more complete picture of your fit for the role.";
    }
    
    if (lowerRec.includes("focus") || lowerRec.includes("prioritize")) {
      return "Refocusing your materials in this way aligns with research showing that applicants who tailor their messaging to specific roles receive interview invitations at 3-5x the rate of those using generic materials. This isn't about misrepresenting your background, but about emphasizing the aspects most relevant to this specific opportunity.";
    }
    
    if (lowerRec.includes("training") || lowerRec.includes("course") || lowerRec.includes("learn")) {
      return "Pursuing this learning demonstrates two valuable traits simultaneously: self-awareness about development areas and proactive growth mindset. Research shows that hiring managers value learning agility over existing knowledge in rapidly changing fields. This investment signals your commitment to continued relevance in an evolving landscape.";
    }
    
    if (lowerRec.includes("quantif") || lowerRec.includes("metric")) {
      return "Adding quantification addresses the evidence gap that weakens many resumes. Specific metrics transform abstract claims into credible achievements and provide concrete anchors for interviewers to explore further. This approach also signals business acumen—an understanding that your work ultimately connects to measurable business outcomes.";
    }
    
    if (lowerRec.includes("project") || lowerRec.includes("portfolio")) {
      return "Developing portfolio evidence creates tangible proof of capabilities that would otherwise remain theoretical to employers. This approach bypasses the common experience paradox (needing experience to get experience) by demonstrating practical capability regardless of formal role history. It also signals initiative and genuine interest in the field.";
    }
    
    if (lowerRec.includes("network") || lowerRec.includes("connect")) {
      return "Strategic networking addresses the reality that 50-70% of roles are filled through connections rather than applications. Even beyond direct referrals, insider perspectives provide crucial context about unstated priorities and culture that help you position your background more effectively. This isn't about circumventing processes but gaining the context needed to navigate them successfully.";
    }
    
    if (lowerRec.includes("interview") || lowerRec.includes("prepare")) {
      return "Focused interview preparation addresses the fundamental asymmetry of the hiring process: while you might interview for a handful of roles, interviewers evaluate dozens of candidates. Deliberate preparation helps you communicate your value proposition clearly despite the inherent pressure and time constraints of the interview format.";
    }
    
    if (lowerRec.includes("tailor") || lowerRec.includes("customize")) {
      return "Customizing your application materials acknowledges that hiring is fundamentally about solving specific problems for employers. This approach demonstrates both your understanding of their needs and your ability to communicate relevantly—a skill valuable in almost any professional context. It also signals genuine interest rather than a volume-based application strategy.";
    }
    
    if (lowerRec.includes("skill") || lowerRec.includes("expertise")) {
      return "Developing this capability addresses an evolving requirement in the role that may not yet be widespread among candidates. This creates opportunity to differentiate yourself in an otherwise competitive talent pool. Early investment in emerging skill areas often yields disproportionate returns as demand increases while supply remains limited.";
    }
    
    return "Implementing this recommendation addresses misalignment between how you're currently presenting your background and how hiring decisions are made for this type of role. This adjustment isn't about fundamentally changing your approach, but about ensuring decision-makers recognize the relevant value you already bring to the position.";
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
  } = analysisResults || {};
  
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
                <><span className="font-medium">Company:</span> {selectedCompany.name} | <span className="font-medium">Role:</span> {selectedRole}</>
              ) : (
                <><span className="font-medium">Role:</span> {selectedRole}</>
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
                                <h4 className="font-semibold text-xs text-gray-700">Why this matters:</h4>
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
                                <h4 className="font-semibold text-xs text-gray-700">Why this matters:</h4>
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
                                <h4 className="font-semibold text-xs text-gray-700">Why this matters:</h4>
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
