
import React from 'react';
import { FormData, TEXT_LIMITS, META_TEXT_VARIATIONS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { VALID_CTAS } from '@/types/creative';
import { Plus, X } from 'lucide-react';
import TextCounterWithRecommendation from '../TextCounterWithRecommendation';

interface Step3Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step3: React.FC<Step3Props> = ({ formData, updateFormData, errors }) => {
  // Initialize arrays if they don't exist
  const titles = formData.titles || [''];
  const mainTexts = formData.mainTexts || [''];

  const addTitle = () => {
    if (titles.length < META_TEXT_VARIATIONS.maxTitles) {
      updateFormData({ titles: [...titles, ''] });
    }
  };

  const removeTitle = (index: number) => {
    if (titles.length > 1) {
      const newTitles = titles.filter((_, i) => i !== index);
      updateFormData({ titles: newTitles });
    }
  };

  const updateTitle = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    updateFormData({ titles: newTitles });
  };

  const addMainText = () => {
    if (mainTexts.length < META_TEXT_VARIATIONS.maxMainTexts) {
      updateFormData({ mainTexts: [...mainTexts, ''] });
    }
  };

  const removeMainText = (index: number) => {
    if (mainTexts.length > 1) {
      const newMainTexts = mainTexts.filter((_, i) => i !== index);
      updateFormData({ mainTexts: newMainTexts });
    }
  };

  const updateMainText = (index: number, value: string) => {
    const newMainTexts = [...mainTexts];
    newMainTexts[index] = value;
    updateFormData({ mainTexts: newMainTexts });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Conteúdo do Anúncio</h2>
        <p className="text-gray-600">Preencha os textos que aparecerão no seu anúncio.</p>
      </div>

      <div className="space-y-8">
        {/* Títulos Section */}
        <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-semibold text-gray-900">📝 Títulos *</Label>
              <p className="text-sm text-gray-500 mt-1">
                Você pode adicionar até {META_TEXT_VARIATIONS.maxTitles} títulos.
              </p>
            </div>
            {titles.length < META_TEXT_VARIATIONS.maxTitles && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTitle}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar título</span>
              </Button>
            )}
          </div>

          {titles.map((title, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-jumper-blue text-white text-xs px-2 py-1 rounded-full font-medium">
                      {index + 1}
                    </span>
                    <Label htmlFor={`title-${index}`} className="text-sm">
                      Título {index + 1}
                    </Label>
                    {titles.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTitle(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Input
                    id={`title-${index}`}
                    value={title}
                    onChange={(e) => updateTitle(index, e.target.value)}
                    placeholder={`Digite o título ${index + 1} do anúncio`}
                    className={errors[`title-${index}`] ? 'border-red-500' : ''}
                  />
                  
                  {errors[`title-${index}`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`title-${index}`]}</p>
                  )}
                </div>
              </div>
              
              <TextCounterWithRecommendation
                text={title}
                recommended={TEXT_LIMITS.title.recommended}
                maximum={TEXT_LIMITS.title.maximum}
              />
            </div>
          ))}
        </div>

        {/* Textos Principais Section */}
        <div className="bg-gray-50 p-6 rounded-lg border space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-lg font-semibold text-gray-900">💬 Textos Principais *</Label>
              <p className="text-sm text-gray-500 mt-1">
                Você pode adicionar até {META_TEXT_VARIATIONS.maxMainTexts} textos principais.
              </p>
            </div>
            {mainTexts.length < META_TEXT_VARIATIONS.maxMainTexts && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMainText}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar texto</span>
              </Button>
            )}
          </div>

          {mainTexts.map((mainText, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center space-x-2">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-jumper-blue text-white text-xs px-2 py-1 rounded-full font-medium">
                      {index + 1}
                    </span>
                    <Label htmlFor={`mainText-${index}`} className="text-sm">
                      Texto Principal {index + 1}
                    </Label>
                    {mainTexts.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeMainText(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  
                  <Textarea
                    id={`mainText-${index}`}
                    value={mainText}
                    onChange={(e) => updateMainText(index, e.target.value)}
                    placeholder={`Digite o texto principal ${index + 1} do anúncio`}
                    className={`min-h-[100px] ${errors[`mainText-${index}`] ? 'border-red-500' : ''}`}
                  />
                  
                  {errors[`mainText-${index}`] && (
                    <p className="text-sm text-red-600 mt-1">{errors[`mainText-${index}`]}</p>
                  )}
                </div>
              </div>
              
              <TextCounterWithRecommendation
                text={mainText}
                recommended={TEXT_LIMITS.mainText.recommended}
                maximum={TEXT_LIMITS.mainText.maximum}
              />
            </div>
          ))}
        </div>

        {/* Separador */}
        <Separator className="my-8" />

        {/* Outros Campos Section */}
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
              placeholder="Adicione observações ou instruções especiais para a equipe da Jumper"
              className="min-h-[80px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step3;
