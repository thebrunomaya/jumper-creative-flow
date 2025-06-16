import React, { useState } from 'react';
import { FormData, TEXT_LIMITS } from '@/types/creative';
import { useToast } from '@/hooks/use-toast';
import Header from './Header';
import ProgressBar from './ProgressBar';
import Breadcrumbs from './Breadcrumbs';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNotionClients } from '@/hooks/useNotionData';
import { supabase } from '@/integrations/supabase/client';

const INITIAL_FORM_DATA: FormData = {
  client: '',
  partner: '', // Mantemos por compatibilidade mas não será usado
  platform: '',
  creativeType: undefined,
  objective: undefined,
  files: [],
  validatedFiles: [],
  mediaVariations: [{ 
    id: 1, 
    squareEnabled: true, 
    verticalEnabled: true, 
    horizontalEnabled: true 
  }], // Initialize with first media variation with all positions enabled
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
  const { clients } = useNotionClients();

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
        if (!formData.client) newErrors.client = 'Selecione uma conta';
        if (!formData.platform) newErrors.platform = 'Selecione uma plataforma';
        
        if (formData.platform === 'meta' || formData.platform === 'google') {
          if (!formData.campaignObjective) newErrors.campaignObjective = 'Selecione o objetivo de campanha';
          
          if (formData.platform === 'meta') {
            if (!formData.creativeType) newErrors.creativeType = 'Selecione o tipo de anúncio';
          }
        }
        break;

      case 2:
        if (formData.creativeType === 'single') {
          // Validate media variations
          const mediaVariations = formData.mediaVariations || [];
          if (mediaVariations.length === 0) {
            newErrors.files = 'Adicione pelo menos uma mídia';
          } else {
            let hasValidFile = false;
            let hasInvalidFile = false;
            
            mediaVariations.forEach(variation => {
              const files = [variation.squareFile, variation.verticalFile, variation.horizontalFile].filter(Boolean);
              if (files.length > 0) {
                hasValidFile = true;
                files.forEach(file => {
                  if (file && !file.valid) {
                    hasInvalidFile = true;
                  }
                });
              }
            });
            
            if (!hasValidFile) {
              newErrors.files = 'Envie pelo menos um arquivo em uma das mídias';
            } else if (hasInvalidFile) {
              newErrors.files = 'Corrija os arquivos com problemas antes de continuar';
            }
          }
        } else {
          // Original validation for other creative types
          if (formData.validatedFiles.length === 0) {
            newErrors.files = 'Envie pelo menos um arquivo';
          } else {
            const invalidFiles = formData.validatedFiles.filter(f => !f.valid);
            if (invalidFiles.length > 0) {
              newErrors.files = `${invalidFiles.length} arquivo(s) com problemas. Corrija antes de continuar.`;
            }
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

  const goToStep = (step: number) => {
    if (step < currentStep) {
      setCurrentStep(step);
    }
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
      
      // Prepare files info for submission
      const filesInfo: Array<{
        name: string;
        type: string;
        size: number;
        format?: string;
        variationIndex?: number;
      }> = [];

      if (formData.creativeType === 'single' && formData.mediaVariations) {
        formData.mediaVariations.forEach((variation, index) => {
          if (variation.squareFile) {
            filesInfo.push({
              name: variation.squareFile.file.name,
              type: variation.squareFile.file.type,
              size: variation.squareFile.file.size,
              format: 'square',
              variationIndex: index + 1
            });
          }
          if (variation.verticalFile) {
            filesInfo.push({
              name: variation.verticalFile.file.name,
              type: variation.verticalFile.file.type,
              size: variation.verticalFile.file.size,
              format: 'vertical',
              variationIndex: index + 1
            });
          }
          if (variation.horizontalFile) {
            filesInfo.push({
              name: variation.horizontalFile.file.name,
              type: variation.horizontalFile.file.type,
              size: variation.horizontalFile.file.size,
              format: 'horizontal',
              variationIndex: index + 1
            });
          }
        });
      } else {
        // For other creative types, use validatedFiles
        formData.validatedFiles.forEach(file => {
          filesInfo.push({
            name: file.file.name,
            type: file.file.type,
            size: file.file.size
          });
        });
      }

      // Prepare submission data - Send the client ID directly, not the name
      const submissionData = {
        id,
        client: formData.client, // Send the ID directly instead of the name
        partner: formData.partner,
        platform: formData.platform,
        campaignObjective: formData.campaignObjective,
        creativeType: formData.creativeType,
        objective: formData.objective,
        mainText: formData.mainText,
        headline: formData.headline,
        description: formData.description,
        destinationUrl: formData.destinationUrl,
        callToAction: formData.callToAction,
        observations: formData.observations,
        filesInfo
      };

      console.log('Submitting creative to Notion:', submissionData);
      
      // Submit to Notion via Edge Function
      const { data, error } = await supabase.functions.invoke('submit-creative', {
        body: submissionData
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error(error.message || 'Erro ao enviar criativo');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro desconhecido ao enviar criativo');
      }

      console.log('✅ Creative successfully submitted:', data);

      setCreativeId(id);
      setIsSubmitted(true);

      toast({
        title: "Criativo enviado!",
        description: `ID: ${id}. Registro criado no Notion com sucesso!`,
      });

    } catch (error) {
      console.error('Error submitting creative:', error);
      toast({
        title: "Erro no envio",
        description: error.message || "Erro ao enviar para o Notion. Tente novamente.",
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
          <Breadcrumbs 
            formData={formData}
            clients={clients}
          />
          
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
              disabled={isSubmitting}
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
