
import React from 'react';
import ProgressBar from './ProgressBar';
import { useAppContext } from '@/context/AppContext';

interface PageContainerProps {
  children: React.ReactNode;
  showProgress?: boolean;
  className?: string;
}

const PageContainer: React.FC<PageContainerProps> = ({ 
  children, 
  showProgress = true,
  className = ''
}) => {
  const { currentStage } = useAppContext();
  
  return (
    <div className={`w-full max-w-6xl mx-auto px-4 py-8 md:px-8 ${className}`}>
      {showProgress && currentStage !== 'landing' && <ProgressBar />}
      {children}
    </div>
  );
};

export default PageContainer;
