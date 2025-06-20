
import React from 'react';
import { FormData, META_TEXT_VARIATIONS, TEXT_LIMITS } from '@/types/creative';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, X } from 'lucide-react';
import TextCounterWithRecommendation from '../../TextCounterWithRecommendation';

interface MainTextInputSectionProps {
  mainTexts: string[];
  errors: Record<string, string>;
  updateFormData: (data: Partial<FormData>) => void;
}

const MainTextInputSection: React.FC<MainTextInputSectionProps> = ({ mainTexts, errors, updateFormData }) => {
  const addMainText = () => {
    if (mainTexts.length < META_TEXT_VARIATIONS.maxMainTexts) {
      updateFormData({ 
        mainTexts: [...mainTexts, ''] 
      });
    }
  };

  const removeMainText = (index: number) => {
    if (mainTexts.length > 1) {
      const newMainTexts = mainTexts.filter((_, i) => i !== index);
      updateFormData({ 
        mainTexts: newMainTexts 
      });
    }
  };

  const updateMainText = (index: number, value: string) => {
    const newMainTexts = [...mainTexts];
    newMainTexts[index] = value;
    updateFormData({ 
      mainTexts: newMainTexts 
    });
  };

  return (
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
  );
};

export default MainTextInputSection;
