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
      {/* Badge glass */}
      <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 mb-8 shadow-lg">
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full shadow-sm"></div>
        <span className="text-white font-medium text-sm">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      {/* Título com sombra */}
      <h2 className="text-4xl font-light text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
        {stepTitle}{' '}
        <span className="font-normal bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
          essenciais
        </span>{' '}
        do criativo
      </h2>
      
      {/* Subtítulo */}
      <p className="text-white/90 text-lg font-normal max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
        {stepDescription}
      </p>
    </div>
  );
};