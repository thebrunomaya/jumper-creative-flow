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
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import metaAdsObjectives from '@/config/meta-ads-objectives.json';
import { validateCreativeName } from '@/utils/creativeName';

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
  mainTexts: [''], // Initialize with one empty main text
  titles: [''], // Initialize with one empty title
  description: '',
  destination: '', // New field
  cta: '', // New field
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
  const [creativeIds, setCreativeIds] = useState<string[]>([]);
  const { toast } = useToast();
  const { clients } = useNotionClients();
  const { currentUser } = useAuth();

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

  // Check if all enabled positions have files for all variations
  const hasAllRequiredFiles = () => {
    if (formData.creativeType !== 'single' || !formData.mediaVariations) {
      return true; // For non-single types, use existing validation
    }
    
    return formData.mediaVariations.every(variation => {
      const requiredPositions = [];
      if (variation.squareEnabled !== false) requiredPositions.push('square');
      if (variation.verticalEnabled !== false) requiredPositions.push('vertical');
      if (variation.horizontalEnabled !== false) requiredPositions.push('horizontal');
      
      return requiredPositions.every(position => {
        const file = variation[`${position}File`];
        return file && file.valid;
      });
    });
  };

  // Check if carousel has valid files
  const hasValidCarouselFiles = () => {
    if (!formData.carouselCards || formData.carouselCards.length < 2) {
      return false;
    }
    
    // Check if at least the minimum required cards have valid files
    return formData.carouselCards.every(card => {
      return card.file && card.file.valid;
    });
  };

  // Check if existing post has valid URL
  const hasValidExistingPost = () => {
    return formData.existingPost && formData.existingPost.valid;
  };

  // Get destination field configuration for validation
  const getDestinationFieldConfig = () => {
    if (!formData.destination || formData.platform !== 'meta') {
      return null;
    }
    
    const objectiveConfig = metaAdsObjectives.objectiveMapping[formData.campaignObjective];
    if (!objectiveConfig) return null;
    
    const selectedDestination = objectiveConfig.destinations.find(dest => dest.value === formData.destination);
    if (!selectedDestination || !selectedDestination.fieldType) {
      return null;
    }
    
    return {
      fieldType: selectedDestination.fieldType,
      label: metaAdsObjectives.fieldLabels[selectedDestination.fieldType]
    };
  };

  // Check if field should be validated as URL
  const shouldValidateAsUrl = () => {
    const destinationFieldConfig = getDestinationFieldConfig();
    if (!destinationFieldConfig) {
      return true; // Default validation for non-Meta ads
    }
    return destinationFieldConfig.fieldType === 'url' || destinationFieldConfig.fieldType === 'facebook_url';
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!formData.client) newErrors.client = 'Cliente é obrigatório';
        if (!formData.platform) newErrors.platform = 'Plataforma é obrigatória';
        if (!formData.campaignObjective) newErrors.campaignObjective = 'Objetivo é obrigatório';
        if (formData.platform === 'meta' && !formData.creativeType) {
          newErrors.creativeType = 'Tipo de anúncio é obrigatório';
        }
        
        // Validação do nome do criativo
        const nameValidation = validateCreativeName(formData.creativeName || '');
        if (!nameValidation.valid) {
          newErrors.creativeName = nameValidation.errors[0];
        }
        break;

      case 2:
        if (formData.creativeType === 'carousel') {
          // Specific validation for carousel
          if (!hasValidCarouselFiles()) {
            newErrors.files = 'Envie arquivos válidos para todos os cartões do carrossel';
          }
        } else if (formData.creativeType === 'single') {
          // Validate media variations with new logic
          const mediaVariations = formData.mediaVariations || [];
          if (mediaVariations.length === 0) {
            newErrors.files = 'Adicione pelo menos uma mídia';
          } else if (!hasAllRequiredFiles()) {
            newErrors.files = 'Envie arquivos válidos para todos os posicionamentos ativos ou desative os posicionamentos sem arquivo (máximo 2 desativados por variação)';
          }
        } else if (formData.creativeType === 'existing-post') {
          // Validate existing post URL
          if (!hasValidExistingPost()) {
            newErrors.existingPost = 'Cole uma URL válida da publicação do Instagram';
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
        // For existing-post type, skip text field validation
        if (formData.creativeType === 'existing-post') {
          // Skip title and main text validation for existing posts
          // Only validate description if provided
          if (formData.description && formData.description.length > TEXT_LIMITS.description.maximum) {
            newErrors.description = `Descrição muito longa (${formData.description.length}/${TEXT_LIMITS.description.maximum})`;
          }
        } else {
          // Validate titles for other types
          const titles = formData.titles || [''];
          titles.forEach((title, index) => {
            if (!title.trim()) {
              newErrors[`title-${index}`] = 'Digite o título';
            } else if (title.length > TEXT_LIMITS.title.maximum) {
              newErrors[`title-${index}`] = `Título muito longo (${title.length}/${TEXT_LIMITS.title.maximum})`;
            }
          });

          // Validate main texts for other types
          const mainTexts = formData.mainTexts || [''];
          mainTexts.forEach((mainText, index) => {
            if (!mainText.trim()) {
              newErrors[`mainText-${index}`] = 'Digite o texto principal';
            } else if (mainText.length > TEXT_LIMITS.mainText.maximum) {
              newErrors[`mainText-${index}`] = `Texto muito longo (${mainText.length}/${TEXT_LIMITS.mainText.maximum})`;
            }
          });

          if (formData.description.length > TEXT_LIMITS.description.maximum) {
            newErrors.description = `Descrição muito longa (${formData.description.length}/${TEXT_LIMITS.description.maximum})`;
          }
        }

        // Conditional validation for Meta ads
        if (formData.platform === 'meta' && formData.campaignObjective) {
          if (!formData.destination) {
            newErrors.destination = 'Selecione um destino';
          }
          
          if (formData.destination && !formData.cta) {
            newErrors.cta = 'Selecione um call-to-action';
          }
        } else {
          // Legacy validation for non-Meta ads
          if (!formData.callToAction) {
            newErrors.callToAction = 'Selecione um call-to-action';
          }
        }

        // Validate destination URL based on field type
        if (!formData.destinationUrl.trim()) {
          newErrors.destinationUrl = 'Digite o destino';
        } else if (shouldValidateAsUrl()) {
          // Only validate as URL if it should be a URL field
          try {
            new URL(formData.destinationUrl);
          } catch {
            newErrors.destinationUrl = 'URL inválida';
          }
        }
        // For phone/text fields, no URL validation is performed
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

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        resolve(base64.split(',')[1]);
      };
      reader.onerror = error => reject(error);
    });
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
      // Prepare files info and convert files to base64
      const filesInfo: Array<{
        name: string;
        type: string;
        size: number;
        format?: string;
        variationIndex?: number;
        base64Data?: string;
        instagramUrl?: string; // New field for existing posts
      }> = [];

      if (formData.creativeType === 'existing-post' && formData.existingPost) {
        // For existing post, add URL info instead of file data
        filesInfo.push({
          name: 'Instagram Post',
          type: 'existing-post',
          size: 0,
          instagramUrl: formData.existingPost.instagramUrl,
          variationIndex: 1
        });
      } else if (formData.creativeType === 'carousel' && formData.carouselCards) {
        for (const card of formData.carouselCards) {
          const index = formData.carouselCards.indexOf(card);
          
          if (card.file) {
            const base64Data = await convertFileToBase64(card.file.file);
            filesInfo.push({
              name: card.file.file.name,
              type: card.file.file.type,
              size: card.file.file.size,
              format: `carousel-${formData.carouselAspectRatio}`,
              variationIndex: index + 1,
              base64Data
            });
          }
        }
      } else if (formData.creativeType === 'single' && formData.mediaVariations) {
        for (const variation of formData.mediaVariations) {
          const index = formData.mediaVariations.indexOf(variation);
          
          if (variation.squareFile) {
            const base64Data = await convertFileToBase64(variation.squareFile.file);
            filesInfo.push({
              name: variation.squareFile.file.name,
              type: variation.squareFile.file.type,
              size: variation.squareFile.file.size,
              format: 'square',
              variationIndex: index + 1,
              base64Data
            });
          }
          if (variation.verticalFile) {
            const base64Data = await convertFileToBase64(variation.verticalFile.file);
            filesInfo.push({
              name: variation.verticalFile.file.name,
              type: variation.verticalFile.file.type,
              size: variation.verticalFile.file.size,
              format: 'vertical',
              variationIndex: index + 1,
              base64Data
            });
          }
          if (variation.horizontalFile) {
            const base64Data = await convertFileToBase64(variation.horizontalFile.file);
            filesInfo.push({
              name: variation.horizontalFile.file.name,
              type: variation.horizontalFile.file.type,
              size: variation.horizontalFile.file.size,
              format: 'horizontal',
              variationIndex: index + 1,
              base64Data
            });
          }
        }
      } else {
        // For other creative types, use validatedFiles
        for (const file of formData.validatedFiles) {
          const base64Data = await convertFileToBase64(file.file);
          filesInfo.push({
            name: file.file.name,
            type: file.file.type,
            size: file.file.size,
            variationIndex: 1, // Single variation for non-single creative types
            base64Data
          });
        }
      }

      // Prepare submission data - Send empty arrays for text fields if existing-post
      const submissionData = {
        client: formData.client, // Send the client ID directly
        managerId: currentUser?.id, // Add manager ID
        partner: formData.partner,
        platform: formData.platform,
        campaignObjective: formData.campaignObjective,
        creativeType: formData.creativeType,
        objective: formData.objective,
        // For existing-post, send empty arrays for text fields
        mainTexts: formData.creativeType === 'existing-post' ? [''] : (formData.mainTexts || ['']),
        titles: formData.creativeType === 'existing-post' ? [''] : (formData.titles || ['']),
        description: formData.creativeType === 'existing-post' ? '' : formData.description,
        destination: formData.destination, // New field
        cta: formData.cta, // New field
        destinationUrl: formData.destinationUrl,
        callToAction: formData.callToAction,
        observations: formData.observations,
        existingPost: formData.existingPost, // Add existing post data
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

      // Use the creative IDs returned from Notion
      setCreativeIds(data.creativeIds || []);
      setIsSubmitted(true);

      const creativeCount = data.totalCreatives || 1;
      const creativeIdsList = data.creativeIds?.join(', ') || '';

      toast({
        title: `${creativeCount} Criativo(s) enviado(s)!`,
        description: `IDs: ${creativeIdsList}. Registros criados no Notion com sucesso!`,
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
    setCreativeIds([]);
    setIsSubmitting(false);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-jumper-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Success creativeIds={creativeIds} onNewCreative={resetForm} />
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
