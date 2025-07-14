
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
  const percentageRecommended = count / recommended;
  
  const getBarColor = () => {
    if (percentageRecommended > 5) {
      return 'bg-red-500'; // > 500% do recomendado
    } else if (percentageRecommended > 2) {
      return 'bg-yellow-500'; // 200-500% do recomendado
    } else if (percentageRecommended > 1.2) {
      return 'bg-blue-500'; // 120-200% do recomendado
    } else if (percentageRecommended >= 0.51) {
      return 'bg-green-500'; // 51-120% do recomendado (ZONA IDEAL)
    } else if (percentageRecommended >= 0.21) {
      return 'bg-blue-500'; // 21-50% do recomendado
    } else {
      return 'bg-yellow-500'; // < 20% do recomendado
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
            style={{ width: `${Math.min(percentageRecommended * 100, 100)}%` }}
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
