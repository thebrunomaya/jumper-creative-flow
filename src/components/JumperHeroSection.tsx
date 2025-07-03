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
    <div className="text-center mb-20">
      {/* Badge mais contrastado */}
      <div className="inline-flex items-center space-x-3 bg-black/40 backdrop-blur-md border-2 border-white/30 rounded-full px-6 py-3 mb-10 shadow-xl">
        <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse shadow-sm"></div>
        <span className="text-white font-bold text-base">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      {/* Título mais impactante */}
      <h2 className="text-5xl font-light text-white mb-8 tracking-tight leading-tight drop-shadow-2xl">
        {stepTitle}{' '}
        <span className="font-semibold bg-gradient-to-r from-orange-400 via-orange-500 to-purple-500 bg-clip-text text-transparent">
          essenciais
        </span>{' '}
        do criativo
      </h2>
      
      {/* Subtítulo mais legível */}
      <p className="text-white text-xl font-medium max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
        {stepDescription}
      </p>
    </div>
  );
};