
import React, { useState } from 'react';
import Header from './Header';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import ProgressBar from './ProgressBar';
import DevButton from './DevButton';
import { FormData } from '@/types/creative';
import { Button } from '@/components/ui/button';

const CreativeSystem = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    // Step 1 defaults
    client: '',
    partner: '',
    platform: '',
    campaignObjective: '',
    creativeType: undefined, // Changed to undefined to match type
    objective: undefined, // Changed to undefined to match type
    
    // Step 2 defaults
    files: [],
    validatedFiles: [],
    mediaVariations: [],
    carouselAspectRatio: '1:1',
    carouselCards: [],
    
    // Step 3 defaults
    mainTexts: [''],
    titles: [''],
    description: '',
    destination: '',
    cta: '',
    destinationUrl: '',
    callToAction: '',
    observations: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creativeIds, setCreativeIds] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const stepLabels = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'];

  const handleNext = () => {
    // Basic validation before moving to next step
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.client) newErrors.client = 'Selecione uma conta';
      if (!formData.platform) newErrors.platform = 'Selecione uma plataforma';
      if (formData.platform === 'meta' && !formData.campaignObjective) {
        newErrors.campaignObjective = 'Selecione um objetivo de campanha';
      }
      if (formData.platform === 'meta' && !formData.creativeType) {
        newErrors.creativeType = 'Selecione um tipo de anúncio';
      }
    }
    
    if (currentStep === 2) {
      // File validation logic would go here
      if (formData.creativeType === 'single' && formData.mediaVariations) {
        let hasValidFiles = false;
        formData.mediaVariations.forEach(variation => {
          if (variation.squareFile?.valid || variation.verticalFile?.valid || variation.horizontalFile?.valid) {
            hasValidFiles = true;
          }
        });
        if (!hasValidFiles) {
          newErrors.files = 'Pelo menos um arquivo válido é necessário';
        }
      } else if (formData.creativeType === 'carousel' && formData.carouselCards) {
        let hasValidFiles = false;
        formData.carouselCards.forEach(card => {
          if (card.file?.valid) {
            hasValidFiles = true;
          }
        });
        if (!hasValidFiles) {
          newErrors.files = 'Pelo menos um cartão com arquivo válido é necessário';
        }
      } else if (!formData.validatedFiles || formData.validatedFiles.length === 0) {
        newErrors.files = 'Pelo menos um arquivo é necessário';
      }
    }
    
    if (currentStep === 3) {
      if (!formData.titles || formData.titles.length === 0 || !formData.titles[0]) {
        newErrors['title-0'] = 'Pelo menos um título é obrigatório';
      }
      if (!formData.mainTexts || formData.mainTexts.length === 0 || !formData.mainTexts[0]) {
        newErrors['mainText-0'] = 'Pelo menos um texto principal é obrigatório';
      }
      if (!formData.destinationUrl) {
        newErrors.destinationUrl = 'URL de destino é obrigatória';
      }
      if (formData.platform === 'meta') {
        if (!formData.destination) newErrors.destination = 'Selecione um destino';
        if (!formData.cta) newErrors.cta = 'Selecione um call-to-action';
      } else if (!formData.callToAction) {
        newErrors.callToAction = 'Selecione um call-to-action';
      }
    }

    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleNewCreative = () => {
    setShowSuccess(false);
    setCurrentStep(1);
    setFormData({
      // Reset to default values
      client: '',
      partner: '',
      platform: '',
      campaignObjective: '',
      creativeType: undefined, // Changed to undefined to match type
      objective: undefined, // Changed to undefined to match type
      files: [],
      validatedFiles: [],
      mediaVariations: [],
      carouselAspectRatio: '1:1',
      carouselCards: [],
      mainTexts: [''],
      titles: [''],
      description: '',
      destination: '',
      cta: '',
      destinationUrl: '',
      callToAction: '',
      observations: ''
    });
    setCreativeIds([]);
    setErrors({});
  };

  const updateFormData = (data: Partial<FormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    // Clear related errors when data is updated
    setErrors(prev => {
      const newErrors = { ...prev };
      Object.keys(data).forEach(key => {
        delete newErrors[key];
      });
      return newErrors;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/submit-creative', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const result = await response.json();
        // Assuming the API returns creative IDs
        setCreativeIds(result.creativeIds || ['CREATIVE_001']);
        setShowSuccess(true);
        console.log('Creative submitted successfully!');
      } else {
        console.error('Failed to submit creative');
      }
    } catch (error) {
      console.error('Error submitting creative:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {showSuccess ? (
          <Success 
            creativeIds={creativeIds}
            onNewCreative={handleNewCreative}
          />
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Progress Bar */}
            <ProgressBar 
              currentStep={currentStep} 
              totalSteps={4} 
              stepLabels={stepLabels}
            />
            
            {/* Content */}
            <div className="p-8">
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
            
            {/* Navigation */}
            {currentStep < 4 && (
              <div className="px-8 py-4 bg-gray-50 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={currentStep === 1}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  className="bg-jumper-blue hover:bg-jumper-blue/90"
                >
                  Próximo
                </Button>
              </div>
            )}
            
            {currentStep === 4 && (
              <div className="px-8 py-4 bg-gray-50 border-t flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleBack}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-jumper-blue hover:bg-jumper-blue/90"
                >
                  {isSubmitting ? 'Enviando...' : 'Enviar Criativo'}
                </Button>
              </div>
            )}
          </div>
        )}
      </main>
      
      <DevButton />
    </div>
  );
};

export default CreativeSystem;
