
import React from 'react';
import Gauge from '@/components/Gauge';

interface AlignmentScoreCardProps {
  alignmentScore: number;
}

const AlignmentScoreCard: React.FC<AlignmentScoreCardProps> = ({ alignmentScore }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md w-full md:w-auto md:min-w-[300px]">
      <div className="text-center mb-1 w-full">
        <p className="text-sm text-consulting-gray font-medium mb-2">Initial Alignment Score</p>
        <div className="my-2 px-2 w-full">
          <Gauge 
            value={alignmentScore} 
            size="lg" 
            className="mb-1"
          />
        </div>
        <p className="text-xs text-gray-500 italic mt-2">
          View the "Enhanced Resume" tab to see your improved score
        </p>
      </div>
    </div>
  );
};

export default AlignmentScoreCard;
