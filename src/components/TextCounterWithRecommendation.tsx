
import React from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

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
  const percentageMaximum = count / maximum;
  
  const getStatus = () => {
    if (count > maximum) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-100',
        icon: AlertCircle,
        message: 'Excede o limite máximo',
        barColor: 'bg-red-500'
      };
    } else if (count > recommended) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-100',
        icon: AlertTriangle,
        message: 'Acima do recomendado',
        barColor: 'bg-orange-500'
      };
    } else if (count >= recommended * 0.8) {
      return {
        color: 'text-green-600',
        bgColor: 'bg-green-100',
        icon: CheckCircle2,
        message: 'Dentro do recomendado',
        barColor: 'bg-green-500'
      };
    } else {
      return {
        color: 'text-blue-600',
        bgColor: 'bg-blue-100',
        icon: CheckCircle2,
        message: 'Pode adicionar mais texto',
        barColor: 'bg-blue-500'
      };
    }
  };

  const status = getStatus();
  const Icon = status.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className={`flex items-center space-x-1 text-sm px-2 py-1 rounded-full ${status.bgColor}`}>
          <Icon className="w-3 h-3" />
          <span className={status.color}>{status.message}</span>
        </div>
        
        <div className="flex items-center space-x-2 text-sm">
          <span className={count > maximum ? 'text-red-600 font-semibold' : status.color}>
            {count}
          </span>
          <span className="text-gray-400">/{maximum}</span>
        </div>
      </div>
      
      {/* Progress bars */}
      <div className="space-y-1">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${status.barColor}`}
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
