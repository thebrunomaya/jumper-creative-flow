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
      <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-full px-6 py-2 mb-6">
        <span className="text-2xl">{icon}</span>
        <span className="text-primary font-semibold">Etapa {currentStep} de {totalSteps}</span>
      </div>
      
      <h2 className="text-4xl font-bold text-foreground mb-4">
        {stepTitle}{' '}
        <span className="text-gradient-jumper">
          essenciais
        </span>{' '}
        do seu criativo
      </h2>
      
      <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
        {stepDescription}
      </p>
    </div>
  );
};