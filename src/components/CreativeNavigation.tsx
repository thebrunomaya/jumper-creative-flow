
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
        className="text-white hover:text-white transition-all duration-200 flex items-center space-x-2"
        style={{ 
          backgroundColor: 'transparent', 
          borderColor: 'hsl(var(--jumper-gray-medium))'
        }}
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
          className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-400/20 hover:shadow-orange-400/30 transition-all duration-200 flex items-center space-x-2"
        >
          <span>Continuar</span>
          <ArrowRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white shadow-lg shadow-orange-400/20 hover:shadow-orange-400/30 transition-all duration-200 flex items-center space-x-2 px-8"
        >
          <span>🚀</span>
          <span>{isSubmitting ? 'Enviando...' : 'Enviar Criativo'}</span>
        </Button>
      )}
    </div>
  );
};

export default CreativeNavigation;
