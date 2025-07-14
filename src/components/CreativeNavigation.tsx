
import React from 'react';
import { JumperButton } from '@/components/ui/jumper-button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
        <JumperButton
          variant="ghost"
          onClick={onPrevStep}
          disabled={currentStep === 1}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar</span>
        </JumperButton>

        <div className="flex-1" />

        {currentStep < 4 ? (
          <JumperButton
            variant="primary"
            onClick={onNextStep}
            disabled={Object.keys(errors).length > 0}
            className={`flex items-center space-x-2 ${
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
          </JumperButton>
        ) : (
          <JumperButton
            variant="critical"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="flex items-center space-x-2 px-8"
          >
            <span>🚀</span>
            <span>{isSubmitting ? 'Enviando...' : 'Enviar Criativo'}</span>
          </JumperButton>
        )}
      </div>
    </div>
  );
};

export default CreativeNavigation;
