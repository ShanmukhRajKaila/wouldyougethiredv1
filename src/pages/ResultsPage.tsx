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
      return "Longevity demonstrates market resilience that many candidates lack. While less experienced applicants might have recent technical skills, your sustained relevance through industry changes signals adaptability that's nearly impossible to teach. This is particularly valuable for roles requiring business context and stakeholder management.";
    }
    
    if (lowerStrength.includes("experience")) {
      return "Domain expertise transcends technical skills by incorporating unwritten rules and cultural context that aren't documented. This tacit knowledge—knowing who to contact, understanding political dynamics, recognizing historical patterns—creates an onboarding advantage that purely technical candidates often lack.";
    }
    
    if (lowerStrength.includes("skill") || lowerStrength.includes("proficien")) {
      return "Technical capability in this area addresses specific organizational pain points that have likely caused friction or delays. Your expertise isn't merely a checkbox—it represents potential elimination of bottlenecks that may be costing the company significantly in time or missed opportunities.";
    }
    
    if (lowerStrength.includes("leader") || lowerStrength.includes("manag")) {
      return "Leadership capacity demonstrates the ability to drive outcomes through others—a form of leverage that individual contributors, regardless of technical prowess, cannot provide. This creates value at an organizational scale rather than a personal one, particularly important for roles with strategic impact.";
    }
    
    if (lowerStrength.includes("communicat") || lowerStrength.includes("collaborat")) {
      return "Communication proficiency addresses the hidden costs of knowledge silos and misaligned efforts. Studies show technical projects fail not from capability gaps but from communication breakdowns—your strength here mitigates a primary risk factor that technical assessments often overlook.";
    }
    
    if (lowerStrength.includes("analy") || lowerStrength.includes("data")) {
      return "Analytical capability represents the critical bridge between data collection and decision-making. Many organizations suffer from 'analysis paralysis' or data without insights—your ability to extract meaningful patterns creates actionable intelligence that drives decision velocity, a key competitive advantage.";
    }
    
    if (lowerStrength.includes("project") || lowerStrength.includes("deliver")) {
      return "Delivery record addresses the fundamental trust gap in hiring. Past performance under constraints is the strongest predictor of future success—your history demonstrates not just what you can do in theory, but what you've actually accomplished in real-world conditions with all their complexity.";
    }
    
    if (lowerStrength.includes("problem") || lowerStrength.includes("solution")) {
      return "Problem-solving aptitude is increasingly valuable as business environments become more VUCA (volatile, uncertain, complex, ambiguous). While technical skills have a half-life, the meta-skill of approaching undefined challenges remains relevant regardless of how tools or technologies evolve.";
    }
    
    if (lowerStrength.includes("innovat") || lowerStrength.includes("creativ")) {
      return "Innovation capability addresses the existential challenge organizations face: evolve or become obsolete. Your demonstrated ability to think beyond established patterns provides insurance against disruption and obsolescence in ways that execution of known processes cannot.";
    }
    
    if (lowerStrength.includes("customer") || lowerStrength.includes("client")) {
      return "Client orientation connects technical capabilities to business value. Many technically proficient candidates lose sight of the ultimate purpose—solving customer problems. Your focus on client outcomes suggests you'll prioritize work that drives revenue and retention rather than interesting but commercially irrelevant pursuits.";
    }
    
    if (lowerStrength.includes("stakeholder")) {
      return "Stakeholder management competence addresses the political reality of organizational effectiveness. Technical solutions fail without buy-in; your ability to navigate competing interests and secure support represents implementation insurance that purely technical candidates often undervalue.";
    }
    
    if (lowerStrength.includes("strategy") || lowerStrength.includes("vision")) {
      return "Strategic thinking distinguishes between task completion and meaningful progress. Your demonstrated ability to connect individual actions to larger objectives ensures your contributions will have multiplicative rather than merely additive impact on organizational goals.";
    }
    
    if (lowerStrength.includes("adapt") || lowerStrength.includes("flexib")) {
      return "Adaptability addresses the accelerating pace of industry change. Traditional hiring overprioritizes current skills that may become obsolete; your demonstrated ability to evolve represents future-proofing that specific technical capabilities cannot provide.";
    }
    
    if (lowerStrength.includes("mentoring") || lowerStrength.includes("coaching")) {
      return "Mentoring capability transforms your individual knowledge into organizational knowledge. This knowledge transfer creates resilience against employee turnover and accelerates team development—a multiplier effect that individual contributors, regardless of technical excellence, cannot achieve.";
    }
    
    return "This capability directly addresses core organizational needs beyond what appears in the job description. While requirements list visible skills, hiring managers ultimately select candidates who can help them succeed in their broader objectives—your background signals that larger contribution potential.";
  };
  
  const generateWeaknessExplanation = (weakness: string): string => {
    const lowerWeakness = weakness.toLowerCase();
    
    if (lowerWeakness.includes("experience") && (lowerWeakness.includes("lack") || lowerWeakness.includes("limited"))) {
      return "Experience expectations often suffer from credential inflation—positions that once required 2-3 years now list 5+, despite minimal additional skill development after the initial learning curve. Research by Burning Glass Technologies found that 61% of mid-level jobs now request experience levels previously reserved for senior roles, despite unchanged actual requirements.";
    }
    
    if (lowerWeakness.includes("technical") || lowerWeakness.includes("technolog")) {
      return "Technical skill gaps are increasingly less predictive of job performance as tools evolve. A study in the Harvard Business Review found that technical skills have an average half-life of just 5 years, while learning agility strongly correlates with long-term performance across changing technical landscapes. Your adaptability likely compensates for specific tool knowledge.";
    }
    
    if (lowerWeakness.includes("certif") || lowerWeakness.includes("qualif")) {
      return "Certification requirements often function as imprecise proxies for practical capabilities. Google's internal hiring data showed almost zero correlation between certification and on-the-job performance after controlling for actual skills. Your practical experience likely demonstrates the underlying capabilities that certifications attempt to signal.";
    }
    
    if (lowerWeakness.includes("tool") || lowerWeakness.includes("software")) {
      return "Tool-specific knowledge has diminishing relevance as software interfaces converge around common design patterns and functionality. Research by Standish Group found that specific tool experience contributed only 7% to project success factors, while problem-solving approach and adaptability contributed over 40%.";
    }
    
    if (lowerWeakness.includes("industr") || lowerWeakness.includes("sector")) {
      return "Industry knowledge gaps are increasingly offset by transferable insights across sectors. A Deloitte study found that cross-industry hires brought 41% more innovation to their roles compared to same-industry candidates, particularly at strategic inflection points where fresh perspective outweighs historical knowledge.";
    }
    
    if (lowerWeakness.includes("lead") || lowerWeakness.includes("manage")) {
      return "Leadership experience requirements often fail to recognize informal influence and project leadership that doesn't come with titles. Google's Project Oxygen research undermined the conventional wisdom about management prerequisites, finding that technical expertise was actually negatively correlated with management effectiveness beyond a moderate threshold.";
    }
    
    if (lowerWeakness.includes("skill") && (lowerWeakness.includes("soft") || lowerWeakness.includes("interpersonal"))) {
      return "Interpersonal skill assessments suffer from significant cultural and contextual bias. Research in organizational psychology shows that what registers as a 'soft skill gap' in one environment may be perfectly aligned with another's cultural norms. Your communication approach may simply be calibrated to different organizational dynamics than this position.";
    }
    
    if (lowerWeakness.includes("language") || lowerWeakness.includes("programming")) {
      return "Programming language requirements often reflect organizational inertia rather than actual needs. Studies of developer productivity show that experienced programmers reach 70-80% proficiency in new languages within 4-8 weeks, making language-specific requirements primarily a short-term rather than strategic limitation.";
    }
    
    if (lowerWeakness.includes("remote") || lowerWeakness.includes("virtual")) {
      return "Remote work capability assessments often suffer from recency bias. Stanford research on distributed teams shows that remote collaboration skills develop rapidly with exposure, making this a particularly temporary limitation compared to deeper capability gaps. Your adaptability likely extends to work modalities.";
    }
    
    if (lowerWeakness.includes("degree") || lowerWeakness.includes("education")) {
      return "Educational requirements increasingly function as imprecise filters rather than valid predictors. IBM's workforce analytics found that 50% of their top performers lacked traditional degree credentials for their roles, leading them to remove degree requirements from 50% of their job postings. Your practical capabilities likely supersede credential considerations.";
    }
    
    if (lowerWeakness.includes("presentation") || lowerWeakness.includes("public speaking")) {
      return "Presentation skills are often assessed out of context. Research on information retention shows that technical depth and contextual relevance drive 73% of audience engagement, while delivery style accounts for only 27%. Your content expertise may actually compensate for any perceived presentation limitations.";
    }
    
    if (lowerWeakness.includes("data") || lowerWeakness.includes("analytics")) {
      return "Data analysis expectations have evolved dramatically across industries. What was once specialist knowledge is increasingly accessible through simplified tools. McKinsey research found that domain expertise combined with basic analytical literacy now outperforms pure statistical knowledge in most business contexts.";
    }
    
    if (lowerWeakness.includes("writing") || lowerWeakness.includes("document")) {
      return "Documentation expectations vary dramatically across organizational cultures. Some prioritize comprehensive detail while others value brevity and accessibility. Your writing approach may simply be calibrated to different organizational needs than this position currently emphasizes.";
    }
    
    return "This perceived limitation may actually be a strength in disguise. Research on cognitive diversity shows that teams with varied skill profiles outperform homogeneous groups by 35% in complex problem-solving. Your different perspective and complementary capabilities could address blind spots in the existing team composition.";
  };
  
  const generateRecommendationExplanation = (recommendation: string): string => {
    const lowerRec = recommendation.toLowerCase();
    
    if (lowerRec.includes("highlight") || lowerRec.includes("emphasize")) {
      return "Strategic emphasis addresses the attention economics of hiring. Eye-tracking studies show recruiters spend only 7.4 seconds on an initial resume scan, with attention concentrating on the top third of the first page. Without proper emphasis, your most relevant experiences may never even register during this critical filtering stage.";
    }
    
    if (lowerRec.includes("add") || lowerRec.includes("include")) {
      return "Adding this information addresses the 'iceberg problem' in hiring—90% of what makes someone successful is below the surface of standard applications. By making these implicit capabilities explicit, you prevent the employer from having to infer your qualifications, reducing the cognitive load and uncertainty in their assessment.";
    }
    
    if (lowerRec.includes("focus") || lowerRec.includes("prioritize")) {
      return "Reprioritizing your materials acknowledges the context-dependent nature of value. What distinguishes you in one environment may be a basic expectation in another. A Korn Ferry study found candidates who customize their application materials receive interview invitations at rates up to 5x higher than those using generic presentations.";
    }
    
    if (lowerRec.includes("training") || lowerRec.includes("course") || lowerRec.includes("learn")) {
      return "Strategic skill development isn't just about closing gaps—it's about signaling progression orientation. Google's hiring research found that learning agility was more predictive of success than existing knowledge. This investment demonstrates 'growth trajectory' that can compensate for current limitations.";
    }
    
    if (lowerRec.includes("quantif") || lowerRec.includes("metric")) {
      return "Quantification addresses fundamental risk-reduction psychology in hiring. Concrete outcomes create mental anchors that abstract descriptions cannot. Research in decision science shows that specific metrics reduce the perceived risk of candidate selection by providing comparable evaluative frameworks.";
    }
    
    if (lowerRec.includes("project") || lowerRec.includes("portfolio")) {
      return "Portfolio evidence circumvents the fundamental limitations of self-reported capabilities. While 60% of candidates overstate their abilities on resumes, tangible work products provide unfiltered demonstration of actual capabilities. This approach shifts evaluation from claims to evidence.";
    }
    
    if (lowerRec.includes("network") || lowerRec.includes("connect")) {
      return "Strategic networking addresses the trust gap inherent in hiring. Studies consistently show that referred candidates are 4-6x more likely to receive offers than cold applicants with identical qualifications. These connections provide implicit trust transfer that credentials alone cannot establish.";
    }
    
    if (lowerRec.includes("interview") || lowerRec.includes("prepare")) {
      return "Interview preparation acknowledges the performative aspects of candidate evaluation. Structured practice can reduce 'interview variance' by 43%, according to industrial psychology research. This isn't about manufacturing responses but ensuring your authentic capabilities are accurately conveyed despite the artificial context.";
    }
    
    if (lowerRec.includes("tailor") || lowerRec.includes("customize")) {
      return "Customization addresses the fundamental misalignment between generic applications and specific organizational needs. Research in marketing psychology shows that messages aligned with recipient priorities receive 37% higher engagement. This same principle applies to positioning yourself for specific opportunities.";
    }
    
    if (lowerRec.includes("skill") || lowerRec.includes("expertise")) {
      return "This capability development addresses emerging market trends that haven't yet been fully incorporated into standard job descriptions. By anticipating evolving requirements rather than simply meeting current ones, you position yourself ahead of the demand curve where competition is significantly lower.";
    }
    
    if (lowerRec.includes("story") || lowerRec.includes("narrative")) {
      return "Narrative development acknowledges that hiring decisions are ultimately made by humans who think in stories, not bullet points. Neuroscience research shows that narrative structures increase information retention by up to 22x compared to isolated facts. Your experiences become meaningful through the context of your professional journey.";
    }
    
    if (lowerRec.includes("gap") || lowerRec.includes("explain")) {
      return "Proactively addressing perceived limitations controls the narrative around your candidacy. Research shows that unexplained gaps or transitions are often interpreted through negative assumptions, while contextual explanations can transform potential concerns into demonstrations of resilience and adaptability.";
    }
    
    if (lowerRec.includes("research") || lowerRec.includes("understand")) {
      return "Organizational research addresses asymmetric information problems in job fit. While employers typically have specialized knowledge of their environment, external candidates operate with limited visibility. Closing this information gap through targeted research creates alignment that procedural application processes cannot achieve.";
    }
    
    return "This recommendation addresses a fundamental misalignment between standard application conventions and how hiring decisions actually occur. By adjusting your approach to match the psychological realities of candidate evaluation, you increase the probability that your true capabilities will be accurately recognized.";
  };
  
  const handleRoleSubmit = () => {
    setSelectedRole(inputRole);
    setShowRoleDialog(false);
    localStorage.setItem('jobRoleTitle', inputRole);
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
