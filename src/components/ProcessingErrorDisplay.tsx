
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

interface ProcessingErrorDisplayProps {
  processingError: string | null;
  onRetry?: () => void;
}

const ProcessingErrorDisplay: React.FC<ProcessingErrorDisplayProps> = ({ 
  processingError,
  onRetry 
}) => {
  if (!processingError) return null;
  
  const handleRetryClick = () => {
    if (onRetry) {
      toast.info("Retrying analysis...");
      onRetry();
    }
  };
  
  return (
    <div className="mb-8 p-4 border border-amber-300 bg-amber-50 rounded-md">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 mr-2" />
        <div>
          <h3 className="font-medium text-amber-700 mb-2">Analysis Notice</h3>
          <p className="text-sm text-amber-600 mb-2">
            We encountered an issue connecting to our advanced analysis service. Don't worry, we've still analyzed your resume using our built-in system.
          </p>
          <p className="text-sm text-gray-600 mt-2">
            For better results next time:
            <ul className="list-disc pl-5 mt-1">
              <li>Try using a Word document (.docx) or plain text (.txt) format</li>
              <li>Ensure your resume is 2-3 pages maximum</li>
              <li>Remove any images or complex formatting</li>
              <li>Try again later when our service load is lower</li>
            </ul>
          </p>
          
          {onRetry && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRetryClick}
                className="text-amber-700 border-amber-500 hover:bg-amber-100"
              >
                Retry Analysis
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProcessingErrorDisplay;
