
import { useState } from 'react';

export const useAnalysisState = () => {
  const [retryCount, setRetryCount] = useState(0);
  const [reducedMode, setReducedMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  
  return {
    retryCount,
    setRetryCount,
    reducedMode,
    setReducedMode,
    isSubmitting,
    setIsSubmitting,
    processingError,
    setProcessingError,
  };
};
