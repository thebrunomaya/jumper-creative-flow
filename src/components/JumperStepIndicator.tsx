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
          
          {/* Linha de progresso centralizada no círculo */}
          <div 
            className="absolute left-0 w-full"
            style={{ 
              position: 'absolute',
              top: '50%',
              transform: 'translateY(-50%)',
              left: '0',
              width: '100%',
              height: '2px',
              backgroundColor: 'hsl(var(--jumper-gray-medium))'
            }}
          >
            <div 
              className="h-full bg-gradient-jumper-primary transition-all duration-700"
              style={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
            />
          </div>

          {steps.map((step) => (
            <div key={step.number} className="relative z-10 flex flex-col items-center py-2">
              
              {/* Círculo com gradiente orgânico - cada step usa parte diferente */}
              <div className={`
                w-4 h-4 rounded-full transition-all duration-300 flex items-center justify-center
              `}
              style={
                currentStep === step.number ? {
                  backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
                  backgroundSize: '400% 400%',
                  backgroundPosition: step.number === 1 ? '20% 20%' : 
                                    step.number === 2 ? '80% 30%' : 
                                    step.number === 3 ? '60% 80%' : '90% 90%',
                  border: '2px solid rgba(255,255,255,0.3)'
                } : currentStep > step.number ? {
                  backgroundImage: "url('https://jumper.studio/wp-content/uploads/2025/07/Gradiente-1.png')",
                  backgroundSize: '400% 400%',
                  backgroundPosition: step.number === 1 ? '20% 20%' : 
                                    step.number === 2 ? '80% 30%' : 
                                    step.number === 3 ? '60% 80%' : '90% 90%',
                  border: '2px solid rgba(255,255,255,0.3)'
                } : { 
                  backgroundColor: 'hsl(var(--jumper-gray-medium))', 
                  borderColor: 'hsl(var(--jumper-gray-light))',
                  border: '2px solid hsl(var(--jumper-gray-light))'
                }
              }
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