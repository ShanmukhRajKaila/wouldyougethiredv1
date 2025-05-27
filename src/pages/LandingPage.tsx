
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Zap, Sparkles, Upload, Search, BarChart3 } from 'lucide-react';

const LandingPage: React.FC = () => {
  const { 
    setCurrentStage, 
    setProgress, 
    userName, 
    setUserName, 
    userEmail, 
    setUserEmail,
    setCurrentLeadId,
    saveLeadInfo
  } = useAppContext();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGetStarted = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!userName.trim() || !userEmail.trim()) {
      toast.error('Please enter your name and email to continue');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const leadId = await saveLeadInfo();
      
      if (leadId) {
        setCurrentLeadId(leadId);
        setCurrentStage('jobDescription');
        setProgress(25);
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <div className="hero-gradient flex-1 flex flex-col justify-center items-center text-white px-4 py-16">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          {/* Enhanced Logo Section */}
          <div className="mb-10 flex justify-center">
            <div className="bg-white/10 backdrop-blur-sm p-5 rounded-full relative transition-all hover:shadow-lg hover:bg-white/15 group">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-consulting-accent to-consulting-blue opacity-25 blur-sm group-hover:opacity-40"></div>
              <div className="relative flex items-center justify-center gap-1 p-4">
                <Zap className="w-6 h-6 text-consulting-accent" />
                <span className="text-3xl font-serif font-bold">CL</span>
                <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            CareerLens
          </h1>
          
          <p className="text-xl mb-12 max-w-2xl mx-auto">
            Get honest, data-driven resume feedback to boost your career. AI-powered analysis tailors your CV to specific roles and job descriptions for maximum impact.
          </p>
          
          <form 
            onSubmit={handleGetStarted}
            className="bg-white/10 backdrop-blur-sm p-6 rounded-lg max-w-md mx-auto mb-4"
          >
            <h2 className="text-2xl font-serif font-bold mb-4">Get Started</h2>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Your Name</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Your Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-consulting-navy hover:bg-consulting-lightblue hover:text-consulting-blue transition-colors py-5"
            >
              {isSubmitting ? 'Loading...' : 'Analyze My Resume'}
            </Button>
          </form>
          
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center mb-16">
            <div className="text-white/80 text-sm">AI Analysis</div>
            <div className="text-white/80 text-sm">Personalized Feedback</div>
            <div className="text-white/80 text-sm">Career Insights</div>
          </div>
        </div>
      </div>
      
      {/* How It Works Section */}
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-consulting-navy mb-4">
              How It Works
            </h2>
            <p className="text-lg text-consulting-gray max-w-2xl mx-auto">
              Transform your resume with AI-powered analysis in three simple steps
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-consulting-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm border h-48 flex flex-col justify-center">
                  <div className="bg-white rounded border-2 border-dashed border-gray-300 p-8 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Drop your resume here</p>
                    <p className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-consulting-navy mb-2">
                1. Upload Your Resume
              </h3>
              <p className="text-consulting-gray">
                Simply upload your current resume and paste the job description you're targeting
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-consulting-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm border h-48 flex flex-col justify-center">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-consulting-accent rounded-full animate-pulse"></div>
                        <span className="text-sm text-gray-700">Analyzing keywords...</span>
                      </div>
                      <span className="text-xs text-gray-500">45%</span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2">
                      <div className="bg-consulting-accent h-2 rounded-full w-[45%]"></div>
                    </div>
                    <div className="text-xs text-gray-500">Matching skills and experience</div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-consulting-navy mb-2">
                2. AI Analysis
              </h3>
              <p className="text-consulting-gray">
                CareerLens leverages AI to analyze your resume against job requirements and industry standards
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="text-center">
              <div className="mb-6">
                <div className="w-16 h-16 bg-consulting-navy rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart3 className="w-8 h-8 text-white" />
                </div>
                <div className="bg-gray-50 rounded-lg p-6 shadow-sm border h-48 flex flex-col justify-center">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-green-100 text-green-700 p-2 rounded">5 Strengths</div>
                      <div className="bg-yellow-100 text-yellow-700 p-2 rounded">3 Areas to improve</div>
                    </div>
                    <div className="bg-blue-100 text-blue-700 p-2 rounded text-xs mt-2">Enhanced resume ready</div>
                    <div className="text-xs text-gray-500 mt-2">Actionable insights included</div>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-serif font-bold text-consulting-navy mb-2">
                3. Get Insights & Enhancements
              </h3>
              <p className="text-consulting-gray">
                Receive detailed feedback, enhanced resume suggestions, and actionable improvements
              </p>
            </div>
          </div>
        </div>
      </section>
      
      <footer className="bg-consulting-charcoal text-white py-3 text-center text-xs">
        © 2025 CareerLens
      </footer>
    </div>
  );
};

export default LandingPage;
