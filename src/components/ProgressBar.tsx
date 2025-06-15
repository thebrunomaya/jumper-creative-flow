
import React from 'react';

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

const ProgressBar: React.FC<ProgressBarProps> = ({ currentStep, totalSteps, stepLabels }) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full mb-8">
      <div className="flex justify-between items-center mb-4">
        {stepLabels.map((label, index) => (
          <div key={index} className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300 ${
                index + 1 <= currentStep
                  ? 'bg-gradient-jumper text-white shadow-lg'
                  : index + 1 === currentStep + 1
                  ? 'bg-blue-100 text-jumper-blue border-2 border-jumper-blue'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1 <= currentStep ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </div>
            <span className={`mt-2 text-xs font-medium hidden sm:block ${
              index + 1 <= currentStep ? 'text-jumper-blue' : 'text-gray-500'
            }`}>
              {label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Progress line */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full bg-gray-200 h-1 rounded-full">
            <div
              className="bg-gradient-jumper h-1 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressBar;
