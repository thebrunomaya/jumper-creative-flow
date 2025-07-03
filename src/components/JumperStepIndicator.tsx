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
      className="relative py-4 px-8 border-b border-white/10"
      style={{
        backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
        backgroundSize: 'cover',
        backgroundPosition: 'center center'
      }}
    >
      {/* Overlay preto */}
      <div className="absolute inset-0 bg-black backdrop-blur-sm"></div>
      
      <div className="relative z-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between relative">
          
          {/* Linha de progresso glass */}
          <div className="absolute top-3 left-0 w-full h-0.5 bg-white/20 rounded-full backdrop-blur-sm">
            <div 
              className="h-full bg-gradient-to-r from-orange-400 to-purple-500 rounded-full transition-all duration-700 ease-out shadow-lg"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center">
              
              {/* Círculo com glass effect */}
              <div className={`
                w-6 h-6 rounded-full border-2 transition-all duration-300 flex items-center justify-center backdrop-blur-sm shadow-lg
                ${currentStep >= step.number 
                  ? 'bg-gradient-to-br from-orange-400 to-purple-500 border-orange-400 shadow-orange-400/30' 
                  : currentStep === step.number
                  ? 'bg-orange-400 border-orange-400 shadow-orange-400/25'
                  : 'bg-white/10 border-white/30'
                }
              `}>
                {currentStep > step.number ? (
                  <span className="text-white text-xs font-bold">✓</span>
                ) : (
                  <span className={`text-xs font-semibold ${
                    currentStep >= step.number ? 'text-white' : 'text-white/80'
                  }`}>
                    {step.number}
                  </span>
                )}
              </div>

              {/* Label com sombra */}
              <p className={`mt-2 text-xs font-medium drop-shadow-sm ${
                currentStep >= step.number ? 'text-white' : 'text-white/70'
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