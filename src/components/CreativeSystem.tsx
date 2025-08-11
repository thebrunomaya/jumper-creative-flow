
import React, { useState, useEffect } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  const { currentUser } = useAuth();

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

  const handleSaveDraft = async () => {
    if (!formData.creativeName || !formData.creativeName.trim()) {
      toast({
        title: 'Informe o nome do criativo',
        description: 'Dê um nome ao criativo para salvar como rascunho.',
        variant: 'destructive',
      });
      return;
    }

    if (!currentUser?.email || !currentUser?.password) {
      toast({
        title: 'Sessão expirada',
        description: 'Faça login novamente para salvar o rascunho.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('manager-actions', {
        body: {
          action: 'saveDraft',
          credentials: { email: currentUser.email, password: currentUser.password },
          draft: {
            client: formData.client,
            partner: formData.partner,
            platform: formData.platform,
            campaignObjective: formData.campaignObjective,
            creativeName: formData.creativeName,
            creativeType: formData.creativeType,
            objective: formData.objective,
            destination: formData.destination,
            cta: formData.cta,
            destinationUrl: formData.destinationUrl,
            callToAction: formData.callToAction,
            observations: formData.observations,
          },
        },
      });

      if (error || !data?.success) {
        throw new Error(error?.message || data?.error || 'Falha ao salvar rascunho');
      }

      toast({
        title: 'Rascunho salvo',
        description: data?.submissionId ? `ID: ${data.submissionId}` : 'Seu rascunho foi salvo com sucesso.',
      });
    } catch (err: any) {
      console.error('Erro ao salvar rascunho:', err);
      toast({
        title: 'Erro ao salvar rascunho',
        description: err?.message || 'Tente novamente.',
        variant: 'destructive',
      });
    }
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
        <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 flex-1">
          <Success creativeIds={creativeIds} onNewCreative={handleReset} />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-6 flex-1">
        <ProgressBar 
          currentStep={currentStep} 
          totalSteps={4} 
          stepLabels={STEP_LABELS} 
        />

        <JumperCard className="shadow-lg border border-border/20 bg-card/80 backdrop-blur-sm mb-6">
          <JumperCardContent className="p-6 md:p-8">
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
          onSaveDraft={handleSaveDraft}
        />
      </div>
      <Footer />
    </div>
  );
};

export default CreativeSystem;
