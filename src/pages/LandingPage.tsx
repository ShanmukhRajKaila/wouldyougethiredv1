
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
      <div className="hero-gradient flex-1 flex flex-col justify-center items-center text-white px-4 py-20">
        <div className="max-w-4xl mx-auto text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-6">
            Transform Your Career with AI-Powered Resume Insights
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Unlock your professional potential with our cutting-edge AI resume analysis. 
            Get brutally honest, data-driven feedback to elevate your career opportunities.
          </p>
          
          <form 
            onSubmit={handleGetStarted}
            className="bg-white/10 backdrop-blur-sm p-6 rounded-lg max-w-md mx-auto mb-12"
          >
            <h2 className="text-2xl font-serif font-bold mb-4">Start Your Career Breakthrough</h2>
            <div className="space-y-4 mb-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">Your Name</Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your full name"
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
                  placeholder="Enter your professional email"
                  className="bg-white/20 border-white/30 text-white placeholder:text-white/50"
                  required
                />
              </div>
            </div>
            
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-white text-consulting-navy hover:bg-consulting-lightblue hover:text-consulting-blue transition-colors px-8 py-6 text-lg"
            >
              {isSubmitting ? 'Analyzing...' : 'Unlock My Career Potential'}
            </Button>
          </form>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-serif font-bold mb-3">AI-Driven Analysis</h3>
              <p className="text-white/80">
                Get a comprehensive, unbiased evaluation of your resume using advanced AI technology.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-serif font-bold mb-3">Strategic Optimization</h3>
              <p className="text-white/80">
                Transform your experiences into compelling narratives that capture recruiters' attention.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-serif font-bold mb-3">Career Acceleration</h3>
              <p className="text-white/80">
                Gain actionable insights to elevate your professional profile and stand out in competitive markets.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-consulting-charcoal text-white py-4 text-center">
        <p className="text-sm">
          © 2025 CareerLens AI | Intelligent Resume Optimization
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;

