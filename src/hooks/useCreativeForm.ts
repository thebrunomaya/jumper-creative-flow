
import { useState, useCallback } from 'react';
import { FormData, TEXT_LIMITS } from '@/types/creative';
import { useToast } from '@/hooks/use-toast';
import { validateCreativeName } from '@/utils/creativeName';
import metaAdsObjectives from '@/config/meta-ads-objectives.json';
import { normalizeObjective } from '@/utils/objectives';
import { ValidationResult, DEFAULT_VALIDATION_CONFIG } from '@/types/validation';

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

  const updateFormData = useCallback((newData: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...newData }));
    
    // Only clear errors for fields being updated, no immediate validation
    setErrors(prev => {
      const newErrors = { ...prev };
      
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
      
      return newErrors;
    });
  }, []);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
  }, []);

  const hasAllRequiredFiles = () => {
    if (formData.creativeType !== 'single' || !formData.mediaVariations) {
      return true;
    }
    
    return formData.mediaVariations.every(variation => {
      const requiredPositions = [];
      if (variation.squareEnabled === true) requiredPositions.push('square');
      if (variation.verticalEnabled === true) requiredPositions.push('vertical');
      if (variation.horizontalEnabled === true) requiredPositions.push('horizontal');
      
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
    if (!formData.destination || formData.platform !== 'meta' || !formData.campaignObjective) {
      return null;
    }
    
    // Try direct mapping first, then normalized mapping
    let objectiveConfig = metaAdsObjectives.objectiveMapping[formData.campaignObjective];
    if (!objectiveConfig) {
      const normalizedObjective = normalizeObjective(formData.campaignObjective);
      objectiveConfig = metaAdsObjectives.objectiveMapping[normalizedObjective];
    }
    
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

  const validateStep = (step: number): ValidationResult => {
    const newErrors: Record<string, string> = {};
    const criticalErrors: string[] = [];
    const warnings: string[] = [];

    switch (step) {
      case 1:
        // CRÍTICOS - impedem funcionamento
        if (!formData.client) {
          newErrors.client = 'Cliente é obrigatório';
          criticalErrors.push('Cliente não selecionado');
        }
        if (!formData.platform) {
          newErrors.platform = 'Plataforma é obrigatória';
          criticalErrors.push('Plataforma não selecionada');
        }
        
        // WARNINGS - permitem continuar
        if (!formData.campaignObjective) {
          newErrors.campaignObjective = 'Objetivo é obrigatório';
          warnings.push('Objetivo da campanha não definido');
        }
        if (formData.platform === 'meta' && !formData.creativeType) {
          newErrors.creativeType = 'Tipo de anúncio é obrigatório';
          warnings.push('Tipo de anúncio não selecionado');
        }
        
        const nameValidation = validateCreativeName(formData.creativeName || '');
        if (!nameValidation.valid) {
          newErrors.creativeName = nameValidation.errors[0];
          warnings.push(`Nome do criativo: ${nameValidation.errors[0]}`);
        }
        break;

      case 2:
        if (formData.creativeType === 'carousel') {
          if (!hasValidCarouselFiles()) {
            newErrors.files = 'Envie arquivos válidos para todos os cartões do carrossel';
            criticalErrors.push('Nenhum arquivo válido no carrossel');
          }
        } else if (formData.creativeType === 'single') {
          const mediaVariations = formData.mediaVariations || [];
          if (mediaVariations.length === 0) {
            newErrors.files = 'Adicione pelo menos uma mídia';
            criticalErrors.push('Nenhuma mídia adicionada');
          } else if (!hasAllRequiredFiles()) {
            newErrors.files = 'Envie arquivos válidos para todos os posicionamentos ativos ou desative os posicionamentos sem arquivo (máximo 2 desativados por variação)';
            warnings.push('Alguns posicionamentos estão incompletos');
          }
        } else if (formData.creativeType === 'existing-post') {
          if (!hasValidExistingPost()) {
            newErrors.existingPost = 'Cole uma URL válida da publicação do Instagram';
            criticalErrors.push('URL do Instagram inválida');
          }
        } else {
          if (formData.validatedFiles.length === 0) {
            newErrors.files = 'Envie pelo menos um arquivo';
            criticalErrors.push('Nenhum arquivo enviado');
          } else {
            const invalidFiles = formData.validatedFiles.filter(f => !f.valid);
            if (invalidFiles.length > 0) {
              newErrors.files = `${invalidFiles.length} arquivo(s) com problemas. Corrija antes de continuar.`;
              warnings.push(`${invalidFiles.length} arquivo(s) com problemas de formato/dimensão`);
            }
          }
        }
        break;

      case 3:
        if (formData.creativeType === 'existing-post') {
          if (formData.description && formData.description.length > TEXT_LIMITS.description.maximum) {
            newErrors.description = `Descrição muito longa (${formData.description.length}/${TEXT_LIMITS.description.maximum})`;
            warnings.push('Descrição excede o limite recomendado');
          }
        } else {
          const titles = formData.titles || [''];
          titles.forEach((title, index) => {
            if (!title.trim()) {
              newErrors[`title-${index}`] = 'Digite o título';
              warnings.push(`Título ${index + 1} vazio`);
            } else if (title.length > TEXT_LIMITS.title.maximum) {
              newErrors[`title-${index}`] = `Título muito longo (${title.length}/${TEXT_LIMITS.title.maximum})`;
              warnings.push(`Título ${index + 1} muito longo`);
            }
          });

          const mainTexts = formData.mainTexts || [''];
          mainTexts.forEach((mainText, index) => {
            if (!mainText.trim()) {
              newErrors[`mainText-${index}`] = 'Digite o texto principal';
              warnings.push(`Texto principal ${index + 1} vazio`);
            } else if (mainText.length > TEXT_LIMITS.mainText.maximum) {
              newErrors[`mainText-${index}`] = `Texto muito longo (${mainText.length}/${TEXT_LIMITS.mainText.maximum})`;
              warnings.push(`Texto principal ${index + 1} muito longo`);
            }
          });

          if (formData.description.length > TEXT_LIMITS.description.maximum) {
            newErrors.description = `Descrição muito longa (${formData.description.length}/${TEXT_LIMITS.description.maximum})`;
            warnings.push('Descrição excede o limite recomendado');
          }
        }

        if (formData.platform === 'meta' && formData.campaignObjective) {
          if (!formData.destination) {
            newErrors.destination = 'Selecione um destino';
          }
          
          if (formData.destination && !formData.cta) {
            newErrors.cta = 'Selecione um call-to-action';
          }
          
          // Only require destinationUrl if the selected destination needs it
          const destinationFieldConfig = getDestinationFieldConfig();
          if (destinationFieldConfig) {
            if (!formData.destinationUrl.trim()) {
              newErrors.destinationUrl = 'Digite o destino';
            } else if (shouldValidateAsUrl()) {
              try {
                new URL(formData.destinationUrl);
              } catch {
                newErrors.destinationUrl = 'URL inválida';
              }
            }
          }
        } else {
          if (!formData.callToAction) {
            newErrors.callToAction = 'Selecione um call-to-action';
          }
          
          // For non-meta platforms, always require destination URL
          if (!formData.destinationUrl.trim()) {
            newErrors.destinationUrl = 'Digite o destino';
          } else if (shouldValidateAsUrl()) {
            try {
              new URL(formData.destinationUrl);
            } catch {
              newErrors.destinationUrl = 'URL inválida';
            }
          }
        }
        break;
    }

    setErrors(newErrors);
    
    const hasIssues = criticalErrors.length > 0 || warnings.length > 0;
    const canProceed = criticalErrors.length === 0; // Só impede se tiver erros críticos
    
    // Debug logging for failed validations
    if (hasIssues) {
      console.log(`Validation for step ${step}:`, {
        criticalErrors,
        warnings,
        canProceed
      });
    }
    
    return {
      canProceed,
      criticalErrors,
      warnings,
      hasIssues,
      step
    };
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
