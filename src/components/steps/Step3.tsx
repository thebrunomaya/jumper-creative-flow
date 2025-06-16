
import React from 'react';
import { FormData, TEXT_LIMITS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VALID_CTAS } from '@/types/creative';
import TextCounter from '../TextCounter';

interface Step3Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step3: React.FC<Step3Props> = ({ formData, updateFormData, errors }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conteúdo do Anúncio</h2>
        <p className="text-gray-600">Preencha os textos que aparecerão no seu anúncio.</p>
      </div>

      <div className="grid gap-6">
        {/* Headline primeiro */}
        <div className="space-y-2">
          <Label htmlFor="headline" className="flex items-center gap-2">
            Headline *
            <TextCounter current={formData.headline.length} max={TEXT_LIMITS.headline} />
          </Label>
          <Input
            id="headline"
            value={formData.headline}
            onChange={(e) => updateFormData({ headline: e.target.value })}
            placeholder="Digite o headline do anúncio"
            className={errors.headline ? 'border-red-500' : ''}
          />
          {errors.headline && (
            <p className="text-sm text-red-600">{errors.headline}</p>
          )}
        </div>

        {/* Texto principal depois */}
        <div className="space-y-2">
          <Label htmlFor="mainText" className="flex items-center gap-2">
            Texto Principal *
            <TextCounter current={formData.mainText.length} max={TEXT_LIMITS.mainText} />
          </Label>
          <Textarea
            id="mainText"
            value={formData.mainText}
            onChange={(e) => updateFormData({ mainText: e.target.value })}
            placeholder="Digite o texto principal do anúncio"
            className={`min-h-[100px] ${errors.mainText ? 'border-red-500' : ''}`}
          />
          {errors.mainText && (
            <p className="text-sm text-red-600">{errors.mainText}</p>
          )}
        </div>

        {/* Descrição */}
        <div className="space-y-2">
          <Label htmlFor="description" className="flex items-center gap-2">
            Descrição
            <TextCounter current={formData.description.length} max={TEXT_LIMITS.description} />
          </Label>
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
        </div>

        {/* URL de Destino */}
        <div className="space-y-2">
          <Label htmlFor="destinationUrl">URL de Destino *</Label>
          <Input
            id="destinationUrl"
            type="url"
            value={formData.destinationUrl}
            onChange={(e) => {
              console.log('🔄 URL field changed:', e.target.value);
              updateFormData({ destinationUrl: e.target.value });
            }}
            placeholder="https://exemplo.com"
            className={errors.destinationUrl ? 'border-red-500' : ''}
          />
          {errors.destinationUrl && (
            <p className="text-sm text-red-600">{errors.destinationUrl}</p>
          )}
        </div>

        {/* Call to Action */}
        <div className="space-y-2">
          <Label htmlFor="callToAction">Call-to-Action *</Label>
          <Select value={formData.callToAction} onValueChange={(value) => updateFormData({ callToAction: value })}>
            <SelectTrigger className={errors.callToAction ? 'border-red-500' : ''}>
              <SelectValue placeholder="Selecione um call-to-action" />
            </SelectTrigger>
            <SelectContent>
              {VALID_CTAS.map((cta) => (
                <SelectItem key={cta} value={cta}>
                  {cta}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.callToAction && (
            <p className="text-sm text-red-600">{errors.callToAction}</p>
          )}
        </div>

        {/* Observações */}
        <div className="space-y-2">
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={formData.observations}
            onChange={(e) => updateFormData({ observations: e.target.value })}
            placeholder="Adicione observações ou instruções especiais para a equipe de criativos"
            className="min-h-[80px]"
          />
        </div>
      </div>
    </div>
  );
};

export default Step3;
