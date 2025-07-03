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
  }));

  return (
    <div className="bg-black/15 backdrop-blur-sm py-4 px-6 border-b border-white/10">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de progresso elegante */}
          <div className="absolute top-2 left-0 w-full h-px bg-white/20">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500 transition-all duration-700 ease-out"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo proporcional */}
              <div className={`
                w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center
                ${currentStep >= step.number 
                  ? 'bg-gradient-to-br from-orange-400 to-purple-500 shadow-sm' 
                  : currentStep === step.number
                  ? 'bg-orange-400 shadow-sm'
                  : 'bg-white/20'
                }
              `}>
                {currentStep > step.number && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>

              {/* Label discreto */}
              <p className={`mt-2 text-xs font-medium ${
                currentStep >= step.number ? 'text-white' : 'text-white/60'
              }`}>
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};