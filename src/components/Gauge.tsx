
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface GaugeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showPercentage?: boolean;
}

const Gauge: React.FC<GaugeProps> = ({ 
  value, 
  size = 'md',
  showPercentage = true 
}) => {
  // Ensure value is between 0-100
  const normalizedValue = Math.min(100, Math.max(0, value));
  
  // Get color based on score range
  const getColor = (score: number) => {
    if (score >= 80) return 'bg-green-600';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-600';
  };

  const getLabel = (score: number) => {
    if (score >= 80) return 'High Alignment';
    if (score >= 60) return 'Moderate Alignment';
    return 'Low Alignment';
  };
  
  // Size classes
  const sizeClasses = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4'
  };

  return (
    <div className="w-full">
      <Progress 
        value={normalizedValue} 
        className={`${sizeClasses[size]} rounded-full bg-gray-200`}
        indicatorClassName={`${getColor(normalizedValue)}`}
      />
      
      <div className="mt-2 flex justify-between text-xs">
        {showPercentage && (
          <div className="flex items-center gap-2">
            <span className="font-medium">{normalizedValue}%</span>
            <span className="text-gray-500">{getLabel(normalizedValue)}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Gauge;
