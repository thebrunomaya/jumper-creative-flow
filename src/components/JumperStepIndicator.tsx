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
    <div 
      className="py-4 px-6"
      style={{ 
        backgroundColor: 'hsl(var(--jumper-gray-dark))', 
        borderBottom: '1px solid hsl(var(--jumper-gray-medium))' 
      }}
    >
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de progresso com gradiente estratégico */}
          <div 
            className="absolute top-2 left-0 w-full h-px"
            style={{ backgroundColor: 'hsl(var(--jumper-gray-medium))' }}
          >
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500 transition-all duration-700"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo com gradiente apenas no ativo */}
              <div className={`
                w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center border
                ${currentStep >= step.number 
                  ? 'bg-gradient-jumper-primary' 
                  : currentStep === step.number
                  ? 'bg-gradient-jumper-primary'
                  : ''
                }
              `}
              style={currentStep < step.number ? { 
                backgroundColor: 'hsl(var(--jumper-gray-medium))', 
                borderColor: 'hsl(var(--jumper-gray-light))' 
              } : {}}
              >
                {currentStep > step.number && (
                  <span className="text-white text-xs">✓</span>
                )}
              </div>

              {/* Label em branco neutro */}
              <p className={`mt-2 text-xs font-medium ${
                currentStep >= step.number ? 'text-white' : ''
              }`}
              style={currentStep < step.number ? { 
                color: 'hsl(var(--jumper-gray-light))' 
              } : {}}
              >
                {step.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};