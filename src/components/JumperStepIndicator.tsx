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
    <div className="bg-gray-950/50 py-8 px-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de Progresso Sutil */}
          <div className="absolute top-3 left-0 w-full h-px bg-gray-800">
            <div 
              className="h-full bg-gradient-to-r from-orange-400/60 to-purple-500/60 transition-all duration-700 ease-out"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo Minimalista */}
              <div className={`
                w-6 h-6 rounded-full border transition-all duration-300 flex items-center justify-center
                ${currentStep >= step.number 
                  ? 'bg-gradient-to-br from-orange-400 to-purple-500 border-orange-400/50 shadow-lg shadow-orange-400/20' 
                  : currentStep === step.number
                  ? 'bg-orange-400 border-orange-400/50 shadow-md shadow-orange-400/20'
                  : 'bg-gray-900 border-gray-700'
                }
              `}>
                {currentStep > step.number ? (
                  <span className="text-white text-xs">✓</span>
                ) : (
                  <span className={`text-xs font-medium ${
                    currentStep >= step.number ? 'text-white' : 'text-gray-500'
                  }`}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label Discreto */}
              <p className={`mt-2 text-xs font-light ${
                currentStep >= step.number ? 'text-gray-300' : 'text-gray-600'
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