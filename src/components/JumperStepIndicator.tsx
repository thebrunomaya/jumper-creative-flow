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
    <div className="bg-gray-900/50 backdrop-blur-sm py-8 px-8 border-b border-gray-800/30">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de progresso mais visível */}
          <div className="absolute top-3 left-0 w-full h-0.5 bg-gray-700/60 rounded-full">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo com melhor contraste */}
              <div className={`
                w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center shadow-sm
                ${currentStep >= step.number 
                  ? 'bg-gradient-to-br from-orange-400 to-purple-500 border-orange-400 shadow-lg shadow-orange-400/25' 
                  : currentStep === step.number
                  ? 'bg-orange-400 border-orange-400 shadow-md shadow-orange-400/20'
                  : 'bg-gray-800 border-gray-600'
                }
              `}>
                {currentStep > step.number ? (
                  <span className="text-white text-xs font-bold">✓</span>
                ) : (
                  <span className={`text-xs font-semibold ${
                    currentStep >= step.number ? 'text-white' : 'text-gray-400'
                  }`}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label mais legível */}
              <p className={`mt-2 text-xs font-medium ${
                currentStep >= step.number ? 'text-gray-200' : 'text-gray-500'
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