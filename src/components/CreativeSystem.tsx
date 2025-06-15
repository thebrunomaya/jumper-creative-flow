
import React, { useState } from 'react';
import { FormData, TEXT_LIMITS } from '@/types/creative';
import { useToast } from '@/hooks/use-toast';
import Header from './Header';
import ProgressBar from './ProgressBar';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const INITIAL_FORM_DATA: FormData = {
  client: '',
  partner: '',
  platform: '',
  creativeType: undefined,
  objective: undefined,
  files: [],
  validatedFiles: [],
  mainText: '',
  headline: '',
  description: '',
  destinationUrl: '',
  callToAction: '',
  observations: ''
};

const STEP_LABELS = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'];

const CreativeSystem: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [creativeId, setCreativeId] = useState('');
  const { toast } = useToast();

  const updateFormData = (newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
    // Clear related errors when user updates the field
    const newErrors = { ...errors };
    Object.keys(newData).forEach(key => {
      if (newErrors[key]) {
        delete newErrors[key];
      }
    });
    setErrors(newErrors);
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.client) newErrors.client = 'Selecione um cliente';
        if (!formData.partner) newErrors.partner = 'Selecione um parceiro';
        if (!formData.platform) newErrors.platform = 'Selecione uma plataforma';
        
        if (formData.platform === 'meta') {
          if (!formData.creativeType) newErrors.creativeType = 'Selecione o tipo de criativo';
          if (!formData.objective) newErrors.objective = 'Selecione o objetivo';
        }
        break;

      case 2:
        if (formData.validatedFiles.length === 0) {
          newErrors.files = 'Envie pelo menos um arquivo';
        } else {
          const invalidFiles = formData.validatedFiles.filter(f => !f.valid);
          if (invalidFiles.length > 0) {
            newErrors.files = `${invalidFiles.length} arquivo(s) com problemas. Corrija antes de continuar.`;
          }
        }
        break;

      case 3:
        if (!formData.mainText.trim()) {
          newErrors.mainText = 'Digite o texto principal';
        } else if (formData.mainText.length > TEXT_LIMITS.mainText) {
          newErrors.mainText = `Texto muito longo (${formData.mainText.length}/${TEXT_LIMITS.mainText})`;
        }

        if (!formData.headline.trim()) {
          newErrors.headline = 'Digite o headline';
        } else if (formData.headline.length > TEXT_LIMITS.headline) {
          newErrors.headline = `Headline muito longo (${formData.headline.length}/${TEXT_LIMITS.headline})`;
        }

        if (formData.description.length > TEXT_LIMITS.description) {
          newErrors.description = `Descrição muito longa (${formData.description.length}/${TEXT_LIMITS.description})`;
        }

        if (!formData.destinationUrl.trim()) {
          newErrors.destinationUrl = 'Digite a URL de destino';
        } else {
          try {
            new URL(formData.destinationUrl);
          } catch {
            newErrors.destinationUrl = 'URL inválida';
          }
        }

        if (!formData.callToAction) {
          newErrors.callToAction = 'Selecione um call-to-action';
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios para continuar",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const generateCreativeId = (data: FormData): string => {
    const clientName = data.client.split('-')[0].toUpperCase().replace(/\s+/g, '-');
    const platform = data.platform.toUpperCase();
    const type = data.creativeType ? data.creativeType.toUpperCase().substring(0, 3) : 'GEN';
    const objective = data.objective ? data.objective.toUpperCase().substring(0, 3) : 'OBJ';
    const timestamp = Date.now().toString().slice(-6);
    
    return `${clientName}-${platform}-${type}-${objective}-${timestamp}`;
  };

  const submitForm = async () => {
    if (!validateStep(3)) {
      toast({
        title: "Erro na validação",
        description: "Corrija os erros antes de enviar",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Generate creative ID
      const id = generateCreativeId(formData);
      
      // Simulate API calls
      console.log('Submitting creative:', { id, ...formData });
      
      // Simulate delay for realistic UX
      await new Promise(resolve => setTimeout(resolve, 3000));

      // In a real app, you would:
      // 1. Upload files to Google Drive
      // 2. Create Notion record
      // 3. Send confirmation email
      // 4. Create task in project management

      setCreativeId(id);
      setIsSubmitted(true);

      toast({
        title: "Criativo enviado!",
        description: `ID: ${id}. Confirmação enviada por email.`,
      });

    } catch (error) {
      console.error('Error submitting creative:', error);
      toast({
        title: "Erro no envio",
        description: "Tente novamente ou contate o suporte",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setCurrentStep(1);
    setErrors({});
    setIsSubmitted(false);
    setCreativeId('');
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-jumper-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Success creativeId={creativeId} onNewCreative={resetForm} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-jumper-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8">
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={4} 
          stepLabels={STEP_LABELS} 
        />

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          {currentStep === 1 && (
            <Step1 
              formData={formData} 
              updateFormData={updateFormData} 
              errors={errors} 
            />
          )}
          
          {currentStep === 2 && (
            <Step2 
              formData={formData} 
              updateFormData={updateFormData} 
              errors={errors} 
            />
          )}
          
          {currentStep === 3 && (
            <Step3 
              formData={formData} 
              updateFormData={updateFormData} 
              errors={errors} 
            />
          )}
          
          {currentStep === 4 && (
            <Step4 
              formData={formData} 
              isSubmitting={isSubmitting} 
            />
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={nextStep}
              className="bg-gradient-jumper hover:opacity-90 transition-opacity flex items-center space-x-2"
            >
              <span>Continuar</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={submitForm}
              disabled={isSubmitting || formData.validatedFiles.filter(f => !f.valid).length > 0}
              className="bg-gradient-success hover:opacity-90 transition-opacity flex items-center space-x-2 px-8"
            >
              <span>🚀</span>
              <span>{isSubmitting ? 'Enviando...' : 'Enviar Criativo'}</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeSystem;
