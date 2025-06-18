
import React, { useState } from 'react';
import Header from './Header';
import Step1 from './steps/Step1';
import Step2 from './steps/Step2';
import Step3 from './steps/Step3';
import Step4 from './steps/Step4';
import Success from './Success';
import ProgressBar from './ProgressBar';
import DevButton from './DevButton';

const CreativeSystem = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creativeIds, setCreativeIds] = useState<string[]>([]);

  const stepLabels = ['Básico', 'Arquivos', 'Conteúdo', 'Revisão'];

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleNewCreative = () => {
    setShowSuccess(false);
    setCurrentStep(1);
    setFormData({});
    setCreativeIds([]);
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
                  onNext={handleNext} 
                  onFormDataChange={setFormData}
                />
              )}
              {currentStep === 2 && (
                <Step2 
                  formData={formData} 
                  onNext={handleNext} 
                  onBack={handleBack}
                  onFormDataChange={setFormData}
                />
              )}
              {currentStep === 3 && (
                <Step3 
                  formData={formData} 
                  onNext={handleNext} 
                  onBack={handleBack}
                  onFormDataChange={setFormData}
                />
              )}
              {currentStep === 4 && (
                <Step4 
                  formData={formData} 
                  onSubmit={handleSubmit}
                  onBack={handleBack}
                  isSubmitting={isSubmitting}
                />
              )}
            </div>
          </div>
        )}
      </main>
      
      <DevButton />
    </div>
  );
};

export default CreativeSystem;
