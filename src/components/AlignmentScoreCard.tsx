
import React from 'react';
import Gauge from '@/components/Gauge';

interface AlignmentScoreCardProps {
  alignmentScore: number;
}

const AlignmentScoreCard: React.FC<AlignmentScoreCardProps> = ({ alignmentScore }) => {
  return (
    <div className="flex flex-col items-center justify-center bg-white p-4 rounded-lg shadow-md w-full md:w-auto md:min-w-[300px]">
      <div className="text-center mb-1 w-full">
        <p className="text-sm text-consulting-gray font-medium mb-2">Alignment Score</p>
        <div className="my-2 px-2 w-full">
          <Gauge 
            value={alignmentScore} 
            size="lg" 
            className="mb-1"
          />
        </div>
      </div>
    </div>
  );
};

export default AlignmentScoreCard;
