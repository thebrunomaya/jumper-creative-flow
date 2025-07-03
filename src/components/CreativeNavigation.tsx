
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

interface CreativeNavigationProps {
  currentStep: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

const CreativeNavigation: React.FC<CreativeNavigationProps> = ({
  currentStep,
  onPrevStep,
  onNextStep,
  onSubmit,
  isSubmitting
}) => {
  return (
    <div className="flex justify-between items-center py-6">
      <Button
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 1}
        className="btn-jumper-ghost flex items-center space-x-2"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Voltar</span>
      </Button>

      <div className="flex items-center">
        <ThemeToggle className="mx-4" />
      </div>

      {currentStep < 4 ? (
        <Button
          onClick={onNextStep}
          className="btn-jumper-primary flex items-center space-x-2"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="btn-jumper-primary flex items-center space-x-2 px-8"
        >
          <span>🚀</span>
          <span>{isSubmitting ? 'Enviando...' : 'Enviar Criativo'}</span>
        </Button>
      )}
    </div>
  );
};

export default CreativeNavigation;
