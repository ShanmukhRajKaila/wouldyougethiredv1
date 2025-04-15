
import React from 'react';
import { Card } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

interface RecommendationsCardProps {
  recommendations: string[];
}

const RecommendationsCard: React.FC<RecommendationsCardProps> = ({ recommendations }) => {
  return (
    <Card className="p-6">
      <h2 className="text-xl font-serif font-bold text-consulting-navy mb-4 flex items-center">
        <ArrowRight className="mr-2 h-5 w-5" /> Recommendations
      </h2>
      <ul className="space-y-4">
        {recommendations && recommendations.length > 0 ? (
          recommendations.map((recommendation, index) => (
            <li key={index} className="border rounded-md p-3">
              <div className="flex items-start">
                <span className="text-consulting-accent mr-2 mt-1">→</span>
                <span>{recommendation}</span>
              </div>
            </li>
          ))
        ) : (
          <li>No recommendations available</li>
        )}
      </ul>
    </Card>
  );
};

export default RecommendationsCard;
