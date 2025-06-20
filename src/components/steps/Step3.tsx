
import React from 'react';
import { FormData } from '@/types/creative';
import { Separator } from '@/components/ui/separator';
import TitleInputSection from './sections/TitleInputSection';
import MainTextInputSection from './sections/MainTextInputSection';
import AdditionalInfoSection from './sections/AdditionalInfoSection';

interface Step3Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step3: React.FC<Step3Props> = ({ formData, updateFormData, errors }) => {
  // Initialize arrays if they don't exist
  const titles = formData.titles || [''];
  const mainTexts = formData.mainTexts || [''];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conteúdo do Anúncio</h2>
        <p className="text-gray-600">Preencha os textos que aparecerão no seu anúncio.</p>
      </div>

      <div className="space-y-8">
        {/* Títulos Section */}
        <TitleInputSection 
          titles={titles}
          errors={errors}
          updateFormData={updateFormData}
        />

        {/* Textos Principais Section */}
        <MainTextInputSection 
          mainTexts={mainTexts}
          errors={errors}
          updateFormData={updateFormData}
        />

        {/* Separador */}
        <Separator className="my-8" />

        {/* Additional Info Section */}
        <AdditionalInfoSection 
          formData={formData}
          updateFormData={updateFormData}
          errors={errors}
        />
      </div>
    </div>
  );
};

export default Step3;
