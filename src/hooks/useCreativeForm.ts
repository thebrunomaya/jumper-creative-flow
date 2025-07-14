
import { useState } from 'react';
import { FormData, TEXT_LIMITS } from '@/types/creative';
import { useToast } from '@/hooks/use-toast';
import { validateCreativeName } from '@/utils/creativeName';
import metaAdsObjectives from '@/config/meta-ads-objectives.json';

const INITIAL_FORM_DATA: FormData = {
  client: '',
  partner: '',
  platform: undefined,
  campaignObjective: undefined,
  creativeName: '',
  creativeType: undefined,
  objective: undefined,
  files: [],
  validatedFiles: [],
  mediaVariations: [{ 
    id: 1, 
    squareEnabled: true, 
    verticalEnabled: true, 
    horizontalEnabled: true 
  }],
  mainTexts: [''],
  titles: [''],
  description: '',
  destination: '',
  cta: '',
  destinationUrl: '',
  callToAction: '',
  observations: ''
};

export const useCreativeForm = () => {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  const updateFormData = (newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
    
    // Only clear errors for fields being updated, no immediate validation
    const newErrors = { ...errors };
    
    // Clear errors for directly updated fields
    Object.keys(newData).forEach(key => {
      if (newErrors[key]) {
        delete newErrors[key];
      }
    });
    
    // Clear related array field errors when arrays are updated
    if (newData.titles) {
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('title-')) {
          delete newErrors[key];
        }
      });
    }
    
    if (newData.mainTexts) {
      Object.keys(newErrors).forEach(key => {
        if (key.startsWith('mainText-')) {
          delete newErrors[key];
        }
      });
    }
    
    setErrors(newErrors);
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  };

  const hasAllRequiredFiles = () => {
    if (formData.creativeType !== 'single' || !formData.mediaVariations) {
      return true;
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

  const hasValidCarouselFiles = () => {
    if (!formData.carouselCards || formData.carouselCards.length < 2) {
      return false;
    }
    
    return formData.carouselCards.every(card => {
      return card.file && card.file.valid;
    });
  };

  const hasValidExistingPost = () => {
    return formData.existingPost && formData.existingPost.valid;
  };

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

  const shouldValidateAsUrl = () => {
    const destinationFieldConfig = getDestinationFieldConfig();
    if (!destinationFieldConfig) {
      return true;
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
        
        const nameValidation = validateCreativeName(formData.creativeName || '');
        if (!nameValidation.valid) {
          newErrors.creativeName = nameValidation.errors[0];
        }
        break;

      case 2:
        if (formData.creativeType === 'carousel') {
          if (!hasValidCarouselFiles()) {
            newErrors.files = 'Envie arquivos válidos para todos os cartões do carrossel';
          }
        } else if (formData.creativeType === 'single') {
          const mediaVariations = formData.mediaVariations || [];
          if (mediaVariations.length === 0) {
            newErrors.files = 'Adicione pelo menos uma mídia';
          } else if (!hasAllRequiredFiles()) {
            newErrors.files = 'Envie arquivos válidos para todos os posicionamentos ativos ou desative os posicionamentos sem arquivo (máximo 2 desativados por variação)';
          }
        } else if (formData.creativeType === 'existing-post') {
          if (!hasValidExistingPost()) {
            newErrors.existingPost = 'Cole uma URL válida da publicação do Instagram';
          }
        } else {
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
        if (formData.creativeType === 'existing-post') {
          if (formData.description && formData.description.length > TEXT_LIMITS.description.maximum) {
            newErrors.description = `Descrição muito longa (${formData.description.length}/${TEXT_LIMITS.description.maximum})`;
          }
        } else {
          const titles = formData.titles || [''];
          titles.forEach((title, index) => {
            if (!title.trim()) {
              newErrors[`title-${index}`] = 'Digite o título';
            } else if (title.length > TEXT_LIMITS.title.maximum) {
              newErrors[`title-${index}`] = `Título muito longo (${title.length}/${TEXT_LIMITS.title.maximum})`;
            }
          });

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

        if (formData.platform === 'meta' && formData.campaignObjective) {
          if (!formData.destination) {
            newErrors.destination = 'Selecione um destino';
          }
          
          if (formData.destination && !formData.cta) {
            newErrors.cta = 'Selecione um call-to-action';
          }
        } else {
          if (!formData.callToAction) {
            newErrors.callToAction = 'Selecione um call-to-action';
          }
        }

        if (!formData.destinationUrl.trim()) {
          newErrors.destinationUrl = 'Digite o destino';
        } else if (shouldValidateAsUrl()) {
          try {
            new URL(formData.destinationUrl);
          } catch {
            newErrors.destinationUrl = 'URL inválida';
          }
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    formData,
    errors,
    updateFormData,
    resetForm,
    validateStep,
    toast
  };
};
