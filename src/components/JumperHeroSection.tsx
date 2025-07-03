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
      {/* Badge mais visível */}
      <div className="inline-flex items-center space-x-2 bg-gray-900/80 border border-gray-700/60 rounded-full px-4 py-2 mb-8 backdrop-blur-sm shadow-lg">
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
        <span className="text-gray-300 text-sm font-medium">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      {/* Título com melhor legibilidade */}
      <h2 className="text-4xl font-light text-gray-100 mb-6 tracking-tight leading-tight">
        {stepTitle}{' '}
        <span className="font-normal bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
          essenciais
        </span>{' '}
        do criativo
      </h2>
      
      {/* Subtítulo mais legível */}
      <p className="text-gray-400 text-lg font-normal max-w-2xl mx-auto leading-relaxed">
        {stepDescription}
      </p>
    </div>
  );
};