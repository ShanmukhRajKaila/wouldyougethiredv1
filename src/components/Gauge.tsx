
import React from 'react';
import { Progress } from '@/components/ui/progress';

interface GaugeProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showValue?: boolean;
  className?: string;
}

const Gauge: React.FC<GaugeProps> = ({ 
  value, 
  size = 'md',
  showLabel = true,
  showValue = true,
  className = '',
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
    md: 'h-4',
    lg: 'h-6'
  };

  // Benchmark markers
  const benchmarks = [
    { value: 60, label: '60%' },
    { value: 80, label: '80%' }
  ];

  return (
    <div className={`w-full ${className}`}>
      {/* Benchmark markers */}
      <div className="w-full flex justify-between mb-1">
        <span className="text-xs text-red-600">Low</span>
        <span className="text-xs text-yellow-500">Moderate</span>
        <span className="text-xs text-green-600">High</span>
      </div>
      
      <div className="relative">
        <Progress 
          value={normalizedValue} 
          className={`${sizeClasses[size]} rounded-full bg-gray-200`}
          indicatorClassName={`${getColor(normalizedValue)}`}
        />
        
        {/* Benchmark lines */}
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {benchmarks.map((mark) => (
            <div 
              key={mark.value} 
              className="absolute h-full w-0.5 bg-gray-500"
              style={{ left: `${mark.value}%`, height: '150%', top: '-25%' }}
            />
          ))}
        </div>
      </div>
      
      {(showLabel || showValue) && (
        <div className="mt-2 flex justify-between text-xs">
          <div className="flex items-center gap-2">
            {showValue && <span className="font-medium">{normalizedValue}%</span>}
            {showLabel && <span className="text-gray-700">{getLabel(normalizedValue)}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gauge;
