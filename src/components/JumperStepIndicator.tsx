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
    <div className="bg-gray-950 py-4 px-6 border-b border-gray-800">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de progresso com gradiente estratégico */}
          <div className="absolute top-2 left-0 w-full h-px bg-gray-700">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500 transition-all duration-700"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo com gradiente apenas no ativo */}
              <div className={`
                w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center
                ${currentStep >= step.number 
                  ? 'bg-gradient-to-br from-orange-400 to-purple-500' 
                  : currentStep === step.number
                  ? 'bg-orange-400'
                  : 'bg-gray-700 border border-gray-600'
                }
              `}>
                {currentStep > step.number && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>

              {/* Label em branco limpo */}
              <p className={`mt-2 text-xs font-medium ${
                currentStep >= step.number ? 'text-white' : 'text-gray-500'
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