
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { LightningBolt, Sparkles } from 'lucide-react';

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
                <LightningBolt className="w-6 h-6 text-consulting-accent" />
                <span className="text-3xl font-serif font-bold">CL</span>
                <Sparkles className="w-4 h-4 text-white absolute -top-1 -right-1" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">
            CareerLens AI
          </h1>
          
          <p className="text-xl mb-12 max-w-lg mx-auto">
            Get honest, data-driven resume feedback to boost your career.
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
              className="w-full bg-white text-consulting-navy hover:bg-consulting-lightblue hover:text-consulting-blue transition-colors py-5"
            >
              {isSubmitting ? 'Loading...' : 'Analyze My Resume'}
            </Button>
          </form>
          
          <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto text-center">
            <div className="text-white/80 text-sm">AI Analysis</div>
            <div className="text-white/80 text-sm">Personalized Feedback</div>
            <div className="text-white/80 text-sm">Career Insights</div>
          </div>
        </div>
      </div>
      
      <footer className="bg-consulting-charcoal text-white py-3 text-center text-xs">
        © 2025 CareerLens AI
      </footer>
    </div>
  );
};

export default LandingPage;
