
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import ValidationPanel from './ValidationPanel';

interface CreativeNavigationProps {
  currentStep: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  errors?: Record<string, string>;
}

const CreativeNavigation: React.FC<CreativeNavigationProps> = ({
  currentStep,
  onPrevStep,
  onNextStep,
  onSubmit,
  isSubmitting,
  errors = {}
}) => {
  return (
    <div>
      <ValidationPanel errors={errors} />
      
      <div className="flex justify-between items-center">
      <Button
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 1}
        className="flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </Button>

      <DarkModeToggle />

      {currentStep < 4 ? (
        <Button
          onClick={onNextStep}
          disabled={Object.keys(errors).length > 0}
          className={`bg-gradient-jumper hover:opacity-90 transition-opacity flex items-center space-x-2 ${
            Object.keys(errors).length > 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <span>
            {Object.keys(errors).length > 0 
              ? `Corrija ${Object.keys(errors).length} problema(s) para continuar`
              : 'Continuar'
            }
          </span>
          {Object.keys(errors).length === 0 && <ArrowRight className="w-4 h-4" />}
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-success hover:opacity-90 transition-opacity flex items-center space-x-2 px-8"
        >
          <span>🚀</span>
          <span>{isSubmitting ? 'Enviando...' : 'Enviar Criativo'}</span>
        </Button>
      )}
      </div>
    </div>
  );
};

export default CreativeNavigation;
