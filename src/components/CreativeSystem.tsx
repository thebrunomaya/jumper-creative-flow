
import React, { useState } from 'react';
import Header from './Header';
import Footer from './Footer';
import ProgressBar from './ProgressBar';
import Breadcrumbs from './Breadcrumbs';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import CreativeNavigation from './CreativeNavigation';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperCard, JumperCardContent } from '@/components/ui/jumper-card';
import { useNotionClients } from '@/hooks/useNotionData';
import { useCreativeForm } from '@/hooks/useCreativeForm';
import { useCreativeSubmission } from '@/hooks/useCreativeSubmission';

const STEP_LABELS = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'];

const CreativeSystem: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const { clients } = useNotionClients();
  
  const {
    formData,
    errors,
    updateFormData,
    resetForm,
    validateStep,
    toast
  } = useCreativeForm();

  const {
    isSubmitting,
    isSubmitted,
    creativeIds,
    submitForm,
    resetSubmission
  } = useCreativeSubmission();

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

  const handleSubmit = () => {
    submitForm(formData, validateStep, toast);
  };

  const handleReset = () => {
    resetForm();
    resetSubmission();
    setCurrentStep(1);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
          <Success creativeIds={creativeIds} onNewCreative={handleReset} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="max-w-4xl mx-auto px-4 py-8 flex-1">
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={4} 
          stepLabels={STEP_LABELS} 
        />

        <JumperCard className="shadow-lg mb-8">
          <JumperCardContent className="p-8">
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
          </JumperCardContent>
        </JumperCard>

        <CreativeNavigation
          currentStep={currentStep}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          errors={errors}
        />
      </div>
      <Footer />
    </div>
  );
};

export default CreativeSystem;
