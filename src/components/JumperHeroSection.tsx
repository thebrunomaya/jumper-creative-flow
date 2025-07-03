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
    <div className="text-center mb-12">
      
      {/* Badge com gradiente estratégico */}
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-500/20 to-purple-600/20 border border-orange-400/30 rounded-full px-4 py-2 mb-8">
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
        <span className="text-orange-300 text-sm font-medium">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      {/* Título em fundo preto limpo */}
      <h2 className="text-3xl font-light text-white mb-4 tracking-tight">
        {stepTitle} 
        <span className="font-semibold bg-gradient-to-r from-orange-400 to-purple-500 bg-clip-text text-transparent">
          essenciais
        </span> do criativo
      </h2>
      
      {/* Subtítulo em branco limpo */}
      <p className="text-gray-300 text-lg max-w-2xl mx-auto">
        {stepDescription}
      </p>
    </div>
  );
};