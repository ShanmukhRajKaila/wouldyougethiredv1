
import { useState } from 'react';

export interface ImprovedCoverLetterData {
  improvedText: string;
  updatedRelevance: number;
}

export const useCoverLetterState = (initialText: string, initialRelevance: number = 0) => {
  const [improvedData, setImprovedData] = useState<ImprovedCoverLetterData>({
    improvedText: initialText,
    updatedRelevance: initialRelevance
  });
  
  return {
    improvedData,
    setImprovedData
  };
};
