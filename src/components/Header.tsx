
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';

const Header: React.FC = () => {
  const { resetApplication, setCurrentStage } = useAppContext();
  
  const handleReset = () => {
    // Return to job description page instead of full reset
    setCurrentStage('jobDescription');
  };
  
  return (
    <header className="bg-consulting-navy text-white py-4 px-6 shadow-md">
      <div className="max-w-6xl mx-auto flex justify-between items-center">
        <div 
          className="font-serif text-xl md:text-2xl font-bold cursor-pointer"
          onClick={handleReset}
        >
          WouldYouGetHired.com
        </div>
        <Button 
          variant="outline" 
          onClick={handleReset}
          className="text-white border-white hover:bg-white hover:text-consulting-navy"
        >
          Start Over
        </Button>
      </div>
    </header>
  );
};

export default Header;
