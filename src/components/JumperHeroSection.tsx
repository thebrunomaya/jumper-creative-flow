import React from 'react';

interface JumperHeroSectionProps {
  currentStep: number;
  totalSteps: number;
  stepTitle: string;
  stepDescription: string;
  icon?: string;
}

export const JumperHeroSection: React.FC<JumperHeroSectionProps> = ({
  currentStep,
  totalSteps,
  stepTitle,
  stepDescription,
  icon = '📋'
}) => {
  return (
    <div className="text-center mb-16">
      {/* Badge Sutil */}
      <div className="inline-flex items-center space-x-2 bg-gray-900/40 border border-gray-800/50 rounded-full px-4 py-2 mb-8 backdrop-blur-sm">
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
        <span className="text-gray-400 text-sm font-light">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      {/* Título Elegante */}
      <h2 className="text-4xl font-light text-white mb-6 tracking-tight leading-tight">
        {stepTitle}{' '}
        <span className="font-normal bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
          essenciais
        </span>{' '}
        do criativo
      </h2>
      
      {/* Subtítulo Sutil */}
      <p className="text-gray-500 text-lg font-light max-w-2xl mx-auto leading-relaxed">
        {stepDescription}
      </p>
    </div>
  );
};