
import React from 'react';
import { FormData, VALID_CTAS, TEXT_LIMITS } from '@/types/creative';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import TextCounter from '@/components/TextCounter';

interface Step3Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step3: React.FC<Step3Props> = ({ formData, updateFormData, errors }) => {
  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  // Debug log to see what's in formData
  console.log('Step3 formData.destinationUrl:', formData.destinationUrl);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📝 Conteúdo do Anúncio</h2>
        <p className="text-gray-600">Defina os textos e configurações do seu criativo</p>
      </div>

      <div className="space-y-6">
        {/* Texto Principal */}
        <div className="space-y-2">
          <Label htmlFor="mainText" className="text-sm font-medium text-jumper-text">
            Texto Principal *
          </Label>
          <Textarea
            id="mainText"
            value={formData.mainText}
            onChange={(e) => updateFormData({ mainText: e.target.value })}
            placeholder="Digite o texto principal do seu anúncio..."
            className={`min-h-[100px] ${errors.mainText ? 'border-red-500' : ''}`}
            maxLength={TEXT_LIMITS.mainText + 50} // Allow some overage for warning
          />
          <TextCounter text={formData.mainText} maxLength={TEXT_LIMITS.mainText} />
          {errors.mainText && <p className="text-sm text-red-500">{errors.mainText}</p>}
        </div>

        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="headline" className="text-sm font-medium text-jumper-text">
            Headline *
          </Label>
          <Input
            id="headline"
            value={formData.headline}
            onChange={(e) => updateFormData({ headline: e.target.value })}
            placeholder="Digite o título chamativo..."
            className={errors.headline ? 'border-red-500' : ''}
            maxLength={TEXT_LIMITS.headline + 10}
          />
          <TextCounter text={formData.headline} maxLength={TEXT_LIMITS.headline} />
          {errors.headline && <p className="text-sm text-red-500">{errors.headline}</p>}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description" className="text-sm font-medium text-jumper-text">
            Descrição
          </Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateFormData({ description: e.target.value })}
            placeholder="Digite uma descrição adicional (opcional)..."
            className="min-h-[80px]"
            maxLength={TEXT_LIMITS.description + 20}
          />
          <TextCounter text={formData.description} maxLength={TEXT_LIMITS.description} />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* URL Destino */}
          <div className="space-y-2">
            <Label htmlFor="destinationUrl" className="text-sm font-medium text-jumper-text">
              URL Destino *
            </Label>
            <div className="relative">
              <Input
                id="destinationUrl"
                type="url"
                value={formData.destinationUrl || ''} // Ensure it's never undefined
                onChange={(e) => {
                  console.log('URL input changed to:', e.target.value);
                  updateFormData({ destinationUrl: e.target.value });
                }}
                placeholder="https://exemplo.com"
                className={`${errors.destinationUrl ? 'border-red-500' : ''} ${
                  formData.destinationUrl && isValidUrl(formData.destinationUrl) ? 'border-green-500' : ''
                }`}
              />
              {formData.destinationUrl && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  {isValidUrl(formData.destinationUrl) ? (
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
              )}
            </div>
            {errors.destinationUrl && <p className="text-sm text-red-500">{errors.destinationUrl}</p>}
          </div>

          {/* Call-to-Action */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-jumper-text">
              Call-to-Action *
            </Label>
            <Select value={formData.callToAction} onValueChange={(value) => updateFormData({ callToAction: value })}>
              <SelectTrigger className={`${errors.callToAction ? 'border-red-500' : ''}`}>
                <SelectValue placeholder="Selecione o CTA" />
              </SelectTrigger>
              <SelectContent>
                {VALID_CTAS.map((cta) => (
                  <SelectItem key={cta} value={cta}>
                    {cta}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.callToAction && <p className="text-sm text-red-500">{errors.callToAction}</p>}
          </div>
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observations" className="text-sm font-medium text-jumper-text">
            Observações
          </Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => updateFormData({ observations: e.target.value })}
            placeholder="Adicione observações importantes para a equipe (opcional)..."
            className="min-h-[80px]"
            maxLength={500}
          />
          <div className="text-right text-sm text-gray-500">
            {formData.observations.length}/500
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;
