
import React from 'react';
import { FormData, META_TEXT_VARIATIONS, TEXT_LIMITS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import TextCounterWithRecommendation from '../../TextCounterWithRecommendation';

interface TitleInputSectionProps {
  titles: string[];
  errors: Record<string, string>;
  updateFormData: (data: Partial<FormData>) => void;
}

const TitleInputSection: React.FC<TitleInputSectionProps> = ({ titles, errors, updateFormData }) => {
  const addTitle = () => {
    if (titles.length < META_TEXT_VARIATIONS.maxTitles) {
      updateFormData({ 
        titles: [...titles, ''] 
      });
    }
  };

  const removeTitle = (index: number) => {
    if (titles.length > 1) {
      const newTitles = titles.filter((_, i) => i !== index);
      updateFormData({ 
        titles: newTitles 
      });
    }
  };

  const updateTitle = (index: number, value: string) => {
    const newTitles = [...titles];
    newTitles[index] = value;
    updateFormData({ 
      titles: newTitles 
    });
  };

  return (
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
  );
};

export default TitleInputSection;
