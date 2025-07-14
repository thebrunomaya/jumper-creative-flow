
import React from 'react';
import { validateText } from '@/utils/fileValidation';

interface TextCounterProps {
  text: string;
  maxLength: number;
  className?: string;
}

const TextCounter: React.FC<TextCounterProps> = ({ text, maxLength, className = '' }) => {
  const validation = validateText(text, maxLength);
  
  return (
    <div className={`flex items-center justify-between text-sm ${className}`}>
      <div className="flex items-center space-x-2">
        {validation.valid ? (
          <span className="flex items-center space-x-1 text-green-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            <span>Dentro do limite</span>
          </span>
        ) : (
          <span className="flex items-center space-x-1 text-red-600">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>Excede o limite</span>
          </span>
        )}
      </div>
      
      <div className="flex items-center space-x-1">
        <span className={validation.color}>
          {validation.count}
        </span>
        <span className="text-gray-400">/{validation.maxLength}</span>
        
        {/* Progress bar */}
        <div className="w-12 h-2 bg-gray-200 rounded-full ml-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              validation.percentage > 1 ? 'bg-destructive' :
              validation.percentage > 0.9 ? 'bg-warning' :
              validation.percentage > 0.7 ? 'bg-accent-subtle' : 'bg-success'
            }`}
            style={{ width: `${Math.min(validation.percentage * 100, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default TextCounter;
