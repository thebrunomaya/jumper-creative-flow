
import React, { useState } from 'react';
import { JumperHeader } from './JumperHeader';
import { JumperStepIndicator } from './JumperStepIndicator';
import Breadcrumbs from './Breadcrumbs';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import CreativeNavigation from './CreativeNavigation';
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
      <div className="min-h-screen bg-background">
        <JumperHeader />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Success creativeIds={creativeIds} onNewCreative={handleReset} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <JumperHeader />
      <JumperStepIndicator 
        currentStep={currentStep} 
        totalSteps={4} 
        stepLabels={STEP_LABELS} 
      />
      
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-card rounded-2xl border border-border p-8 shadow-2xl mb-8">
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

        <CreativeNavigation
          currentStep={currentStep}
          onPrevStep={prevStep}
          onNextStep={nextStep}
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
        />
      </main>
    </div>
  );
};

export default CreativeSystem;
