import React from 'react';

interface JumperStepIndicatorProps {
  currentStep: number;
  totalSteps?: number;
  stepLabels?: string[];
}

export const JumperStepIndicator: React.FC<JumperStepIndicatorProps> = ({ 
  currentStep, 
  totalSteps = 4, 
  stepLabels = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'] 
}) => {
  const steps = Array.from({ length: totalSteps }, (_, i) => ({
    number: i + 1,
    title: stepLabels[i] || `Step ${i + 1}`,
    icon: i + 1 === 1 ? '✓' : i + 1 === 2 ? '📁' : i + 1 === 3 ? '✏️' : '🚀'
  }));

  return (
    <div className="w-full bg-jumper-gray-dark py-8 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de Progresso */}
          <div className="absolute top-6 left-0 w-full h-1 bg-jumper-gray-medium rounded-full">
            <div 
              className="h-full bg-gradient-jumper-primary rounded-full transition-all duration-500"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo do Step */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                ${currentStep >= step.number 
                  ? 'bg-gradient-jumper-primary border-jumper-orange shadow-lg shadow-jumper-orange/25' 
                  : currentStep === step.number
                  ? 'bg-jumper-orange border-jumper-orange shadow-lg shadow-jumper-orange/25'
                  : 'bg-jumper-gray-medium border-border'
                }
              `}>
                {currentStep > step.number ? (
                  <span className="text-white text-lg">✓</span>
                ) : (
                  <span className={`font-bold ${
                    currentStep >= step.number ? 'text-white' : 'text-muted-foreground'
                  }`}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label do Step */}
              <div className="mt-3 text-center">
                <p className={`font-semibold text-sm ${
                  currentStep >= step.number ? 'text-white' : 'text-muted-foreground'
                }`}>
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};