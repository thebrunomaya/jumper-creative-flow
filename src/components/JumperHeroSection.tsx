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
      <div 
        className="inline-flex items-center space-x-2 rounded-full px-4 py-2 mb-8 border border-white/20"
        style={{
          backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
          backgroundSize: '300% 300%',
          backgroundPosition: '30% 20%'
        }}
      >
        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
        <span className="text-white text-sm font-medium">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      {/* Título em fundo preto limpo */}
      <h2 className="text-3xl font-light text-white mb-4 tracking-tight">
        {stepTitle}{' '}
        <span className="font-bold text-white">essenciais</span>
        {' '}do criativo
      </h2>
      
      {/* Subtítulo em branco limpo */}
      <p className="text-gray-300 text-lg max-w-2xl mx-auto">
        {stepDescription}
      </p>
    </div>
  );
};