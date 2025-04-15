
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check, ArrowRight } from 'lucide-react';

interface StarAnalysisItem {
  original: string;
  improved: string;
  feedback: string;
}

interface ImprovedBulletPointProps {
  originalBullet: string;
  improvedBullet: StarAnalysisItem | undefined;
}

const ImprovedBulletPoint: React.FC<ImprovedBulletPointProps> = ({ 
  originalBullet, 
  improvedBullet 
}) => {
  const [showImproved, setShowImproved] = useState(false);
  
  // If no original bullet or it's empty
  if (!originalBullet || originalBullet.trim() === '') {
    return null;
  }
  
  // If no improved version available
  if (!improvedBullet) {
    return (
      <div className="border-l-4 border-consulting-gray pl-4 py-1 mb-4">
        <p className="text-consulting-gray">{originalBullet}</p>
      </div>
    );
  }
  
  return (
    <div className="mb-6">
      <div className={`border-l-4 ${showImproved ? 'border-consulting-gray' : 'border-consulting-navy'} pl-4 py-1 mb-2`}>
        <p className={`${showImproved ? 'text-consulting-gray' : 'font-medium'}`}>
          {originalBullet}
        </p>
      </div>
      
      {showImproved ? (
        <div className="border-l-4 border-green-500 pl-4 py-1 bg-green-50 rounded-r">
          <p className="font-medium text-green-800">{improvedBullet.improved}</p>
          <div className="mt-2 space-y-1">
            <div className="flex items-start">
              <Check className="h-4 w-4 text-green-600 mt-0.5 mr-1.5 flex-shrink-0" />
              <p className="text-sm text-green-700">{improvedBullet.feedback}</p>
            </div>
          </div>
        </div>
      ) : (
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => setShowImproved(true)}
          className="flex items-center text-xs ml-4 text-consulting-navy border-consulting-navy hover:bg-consulting-navy/10"
        >
          <ArrowRight className="mr-1 h-3 w-3" /> 
          View ATS-Optimized Version
        </Button>
      )}
    </div>
  );
};

export default ImprovedBulletPoint;
