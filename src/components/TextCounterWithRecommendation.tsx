
import React from 'react';

interface TextCounterWithRecommendationProps {
  text: string;
  recommended: number;
  maximum: number;
  className?: string;
}

const TextCounterWithRecommendation: React.FC<TextCounterWithRecommendationProps> = ({ 
  text, 
  recommended, 
  maximum, 
  className = '' 
}) => {
  const count = text.length;
  const percentageMaximum = count / maximum;
  
  const getBarColor = () => {
    if (count > 500) {
      return 'bg-red-500';
    } else if (count >= 240 && count <= 500) {
      return 'bg-yellow-500';
    } else if (count >= 80 && count <= 240) {
      return 'bg-green-500';
    } else if (count <= 79) {
      return 'bg-yellow-500';
    } else {
      return 'bg-blue-500';
    }
  };

  const barColor = getBarColor();

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-sm">
          <span className={count > maximum ? 'text-red-600 font-semibold' : 'text-gray-600'}>
            {count}
          </span>
          <span className="text-gray-400">/{maximum}</span>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.min(percentageMaximum * 100, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500">
          <span>Recomendado: {recommended}</span>
          <span>Máximo: {maximum}</span>
        </div>
      </div>
    </div>
  );
};

export default TextCounterWithRecommendation;
