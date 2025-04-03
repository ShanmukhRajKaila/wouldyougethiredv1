
import React from 'react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '@/context/AppContext';

const LandingPage: React.FC = () => {
  const { setCurrentStage, setProgress } = useAppContext();
  
  const handleGetStarted = () => {
    setCurrentStage('jobDescription');
    setProgress(25);
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
          
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-12">
            <Button 
              size="lg" 
              onClick={handleGetStarted}
              className="bg-white text-consulting-navy hover:bg-consulting-lightblue hover:text-consulting-blue transition-colors px-8 py-6 text-lg"
            >
              Start Your Simulation
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto mt-12">
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
