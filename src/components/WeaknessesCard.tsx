
import React from 'react';
import { Card } from '@/components/ui/card';
import { X } from 'lucide-react';

interface WeaknessesCardProps {
  weaknesses: string[];
  className?: string;
}

const WeaknessesCard: React.FC<WeaknessesCardProps> = ({ weaknesses, className }) => {
  return (
    <Card className={`p-6 ${className || ''}`}>
      <h2 className="text-xl font-serif font-bold text-red-600 mb-4 flex items-center">
        <X className="mr-2 h-5 w-5" /> Areas for Improvement
      </h2>
      <ul className="space-y-4">
        {weaknesses && weaknesses.length > 0 ? (
          weaknesses.map((weakness, index) => (
            <li key={index} className="border rounded-md p-3">
              <div className="flex items-start">
                <span className="text-red-600 mr-2 mt-1">✗</span>
                <span>{weakness}</span>
              </div>
            </li>
          ))
        ) : (
          <li>No areas for improvement identified</li>
        )}
      </ul>
    </Card>
  );
};

export default WeaknessesCard;
