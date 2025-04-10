
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
            Would You Get Hired at McKinsey, BCG, or Google?
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto">
            Find out if your resume makes the cut at top consulting and tech firms with our AI-powered recruiter simulation.
          </p>
          
          <form 
            onSubmit={handleGetStarted}
            className="bg-white/10 backdrop-blur-sm p-6 rounded-lg max-w-md mx-auto mb-12"
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
              className="w-full bg-white text-consulting-navy hover:bg-consulting-lightblue hover:text-consulting-blue transition-colors px-8 py-6 text-lg"
            >
              {isSubmitting ? 'Starting...' : 'Start Your Simulation'}
            </Button>
          </form>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-serif font-bold mb-3">Resume Analysis</h3>
              <p className="text-white/80">
                Get your resume evaluated against real job descriptions using industry-standard criteria.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-serif font-bold mb-3">STAR Optimization</h3>
              <p className="text-white/80">
                See how the STAR method transforms your experience into compelling achievements.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-6 rounded-lg">
              <h3 className="text-xl font-serif font-bold mb-3">Honest Feedback</h3>
              <p className="text-white/80">
                Get the truth about your application's strengths and weaknesses from an AI recruiter.
              </p>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-consulting-charcoal text-white py-4 text-center">
        <p className="text-sm">
          © 2025 WouldYouGetHired.com | AI-Powered Recruiting Simulation
        </p>
      </footer>
    </div>
  );
};

export default LandingPage;
