
import React from 'react';
import { Card } from '@/components/ui/card';
import { Check } from 'lucide-react';

interface StrengthsCardProps {
  strengths: string[];
}

const StrengthsCard: React.FC<StrengthsCardProps> = ({ strengths }) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-serif font-bold text-green-600 mb-4 flex items-center">
        <Check className="mr-2 h-5 w-5" /> Key Strengths
      </h2>
      <ul className="space-y-4">
        {strengths && strengths.length > 0 ? (
          strengths.map((strength, index) => (
            <li key={index} className="border rounded-md p-3">
              <div className="flex items-start">
                <span className="text-green-600 mr-2 mt-1">✓</span>
                <span>{strength}</span>
              </div>
            </li>
          ))
        ) : (
          <li>No strengths identified</li>
        )}
      </ul>
    </Card>
  );
};

export default StrengthsCard;
