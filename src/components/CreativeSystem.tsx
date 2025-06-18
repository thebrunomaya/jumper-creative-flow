import React, { useState } from 'react';
import Header from './Header';
import Step1 from './Step1';
import Step2 from './Step2';
import Step3 from './Step3';
import Step4 from './Step4';
import Success from './Success';
import ProgressBar from './ProgressBar';
import DevButton from './DevButton';

const CreativeSystem = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<any>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNext = () => {
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
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
          <Success />
        ) : (
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Progress Bar */}
            <ProgressBar currentStep={currentStep} totalSteps={4} />
            
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
