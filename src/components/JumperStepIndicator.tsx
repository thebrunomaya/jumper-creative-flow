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
    <div className="bg-black/40 backdrop-blur-sm py-10 px-8 border-b border-white/10">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de progresso mais visível */}
          <div className="absolute top-4 left-0 w-full h-1 bg-white/20 rounded-full backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-lg"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo maior e mais contrastado */}
              <div className={`
                w-8 h-8 rounded-full border-3 transition-all duration-300 flex items-center justify-center backdrop-blur-md shadow-lg
                ${currentStep >= step.number 
                  ? 'border-white/30 shadow-orange-400/40' 
                  : currentStep === step.number
                  ? 'bg-orange-400 border-white/30 shadow-orange-400/30'
                  : 'bg-white/10 border-white/40'
                }
              `}
              style={currentStep >= step.number ? {
                backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}>
                {currentStep > step.number ? (
                  <span className="text-white text-sm font-bold">✓</span>
                ) : (
                  <span className={`text-sm font-bold ${
                    currentStep >= step.number ? 'text-white' : 'text-white/90'
                  }`}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label mais legível */}
              <p className={`mt-3 text-sm font-semibold drop-shadow-lg ${
                currentStep >= step.number ? 'text-white' : 'text-white/80'
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