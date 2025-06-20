
import React from 'react';
import { FormData, TEXT_LIMITS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import TextCounterWithRecommendation from '../../TextCounterWithRecommendation';
import DestinationSection from './DestinationSection';

interface AdditionalInfoSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const AdditionalInfoSection: React.FC<AdditionalInfoSectionProps> = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">ℹ️ Informações Adicionais</h3>
      </div>

      {/* Descrição */}
      <div className="space-y-2">
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateFormData({ description: e.target.value })}
          placeholder="Digite uma descrição adicional (opcional)"
          className={`min-h-[80px] ${errors.description ? 'border-red-500' : ''}`}
        />
        {errors.description && (
          <p className="text-sm text-red-600">{errors.description}</p>
        )}
        
        <TextCounterWithRecommendation
          text={formData.description}
          recommended={TEXT_LIMITS.description.recommended}
          maximum={TEXT_LIMITS.description.maximum}
        />
      </div>

      {/* Destination and CTA fields */}
      <DestinationSection 
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />

      {/* Observações */}
      <div className="space-y-2">
        <Label htmlFor="observations">Observações</Label>
        <Textarea
          id="observations"
          value={formData.observations}
          onChange={(e) => updateFormData({ observations: e.target.value })}
          placeholder="Adicione observações ou instruções especiais para a equipe da Jumper"
          className="min-h-[80px]"
        />
      </div>
    </div>
  );
};

export default AdditionalInfoSection;
