
import React from 'react';
import { FormData, ValidatedFile, MediaVariation, CarouselCard, CAROUSEL_LIMITS } from '@/types/creative';
import FileUpload from '@/components/FileUpload';
import SingleFileUploadSection from '@/components/SingleFileUploadSection';
import CarouselAspectRatioToggle from '@/components/CarouselAspectRatioToggle';
import CarouselCardUpload from '@/components/CarouselCardUpload';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface Step2Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step2: React.FC<Step2Props> = ({ formData, updateFormData, errors }) => {
  // Show message if creative type is not selected
  if (!formData.creativeType) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-jumper-text mb-2">📎 Upload de Arquivos</h2>
          <p className="text-gray-600">Selecione um tipo de anúncio na etapa anterior para continuar</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <ArrowLeft className="h-12 w-12 text-amber-600" />
            <div>
              <h3 className="text-lg font-semibold text-amber-800 mb-2">
                Tipo de anúncio não selecionado
              </h3>
              <p className="text-amber-700">
                Volte para a etapa anterior e selecione o tipo de anúncio para poder enviar seus arquivos.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For carousel creative type
  if (formData.creativeType === 'carousel') {
    // Initialize carousel data if not exists
    const carouselAspectRatio = formData.carouselAspectRatio || '1:1';
    const carouselCards = formData.carouselCards || [
      { id: 1 },
      { id: 2 }
    ];

    const updateCarouselAspectRatio = (ratio: '1:1' | '4:5') => {
      updateFormData({ 
        carouselAspectRatio: ratio,
        // Revalidate all existing files when aspect ratio changes
        carouselCards: carouselCards.map(card => ({
          ...card,
          file: undefined // Clear files to force revalidation
        }))
      });
    };

    const updateCarouselCards = (cards: CarouselCard[]) => {
      updateFormData({ carouselCards: cards });
    };

    const addCard = () => {
      if (carouselCards.length < CAROUSEL_LIMITS.maxCards) {
        const newCards = [...carouselCards, { 
          id: Math.max(...carouselCards.map(c => c.id)) + 1
        }];
        updateCarouselCards(newCards);
      }
    };

    const removeCard = (id: number) => {
      if (carouselCards.length > CAROUSEL_LIMITS.minCards) {
        const newCards = carouselCards.filter(c => c.id !== id);
        updateCarouselCards(newCards);
      }
    };

    const updateCardFile = (cardId: number, file?: ValidatedFile) => {
      const newCards = carouselCards.map(card => {
        if (card.id === cardId) {
          return { ...card, file };
        }
        return card;
      });
      updateCarouselCards(newCards);
    };

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-jumper-text mb-2">🎠 Upload do Carrossel</h2>
          <p className="text-gray-600">Configure a proporção e envie as imagens para cada cartão</p>
        </div>

        {/* Aspect Ratio Toggle */}
        <CarouselAspectRatioToggle
          value={carouselAspectRatio}
          onValueChange={updateCarouselAspectRatio}
        />

        {/* Carousel Cards */}
        <div className="space-y-6">
          {carouselCards.map((card, index) => (
            <CarouselCardUpload
              key={card.id}
              card={card}
              aspectRatio={carouselAspectRatio}
              onFileChange={(file) => updateCardFile(card.id, file)}
              onRemove={index >= 2 ? () => removeCard(card.id) : undefined}
              canRemove={index >= 2}
              cardNumber={index + 1}
            />
          ))}
        </div>

        {/* Add Card Button */}
        {carouselCards.length < CAROUSEL_LIMITS.maxCards && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={addCard}
              className="bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-jumper-blue transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Cartão ({carouselCards.length}/{CAROUSEL_LIMITS.maxCards})
            </Button>
          </div>
        )}

        {/* Validation Errors */}
        {errors.files && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{errors.files}</p>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Dica para Carrossel</p>
              <p className="text-sm text-blue-700">
                • Mínimo {CAROUSEL_LIMITS.minCards} cartões, máximo {CAROUSEL_LIMITS.maxCards} cartões<br/>
                • Cada cartão deve ter pelo menos 1 arquivo válido na proporção selecionada<br/>
                • Imagens: máx 30MB | Vídeos: máx 4GB, duração 1s-240min
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For single image/video ads
  if (formData.creativeType === 'single') {
    // Initialize media variations if not exists
    const mediaVariations = formData.mediaVariations || [{ 
      id: 1, 
      squareEnabled: true, 
      verticalEnabled: true, 
      horizontalEnabled: true 
    }];

    const updateMediaVariations = (variations: MediaVariation[]) => {
      updateFormData({ mediaVariations: variations });
    };

    const addVariation = () => {
      if (mediaVariations.length < 10) {
        const newVariations = [...mediaVariations, { 
          id: mediaVariations.length + 1,
          squareEnabled: true,
          verticalEnabled: true,
          horizontalEnabled: true
        }];
        updateMediaVariations(newVariations);
      }
    };

    const removeVariation = (id: number) => {
      if (mediaVariations.length > 1) {
        const newVariations = mediaVariations.filter(v => v.id !== id);
        updateMediaVariations(newVariations);
      }
    };

    const updateVariationFile = (variationId: number, format: 'square' | 'vertical' | 'horizontal', file?: ValidatedFile) => {
      const newVariations = mediaVariations.map(variation => {
        if (variation.id === variationId) {
          return { ...variation, [`${format}File`]: file };
        }
        return variation;
      });
      updateMediaVariations(newVariations);
    };

    const updateVariationEnabled = (variationId: number, format: 'square' | 'vertical' | 'horizontal', enabled: boolean) => {
      const newVariations = mediaVariations.map(variation => {
        if (variation.id === variationId) {
          const updatedVariation = { ...variation, [`${format}Enabled`]: enabled };
          
          // If disabling, also remove the file
          if (!enabled) {
            updatedVariation[`${format}File`] = undefined;
          }
          
          return updatedVariation;
        }
        return variation;
      });
      updateMediaVariations(newVariations);
    };

    const getDisabledCount = (variation: MediaVariation) => {
      let count = 0;
      if (!variation.squareEnabled) count++;
      if (!variation.verticalEnabled) count++;
      if (!variation.horizontalEnabled) count++;
      return count;
    };

    const canDisablePosition = (variation: MediaVariation, format: 'square' | 'vertical' | 'horizontal') => {
      const currentlyEnabled = variation[`${format}Enabled`] !== false;
      const disabledCount = getDisabledCount(variation);
      
      // Can disable if currently enabled and we haven't reached the limit of 2 disabled
      return currentlyEnabled ? disabledCount < 2 : true;
    };

    const hasAnyDisabledPosition = () => {
      return mediaVariations.some(variation => 
        !variation.squareEnabled || !variation.verticalEnabled || !variation.horizontalEnabled
      );
    };

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-jumper-text mb-2">🖼️ Upload de Arquivos</h2>
          <p className="text-gray-600">Envie suas imagens e vídeos nos diferentes formatos</p>
        </div>

        {/* Warning when positions are disabled - apenas informativo */}
        {hasAnyDisabledPosition() && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção:</strong> Para impedir que o Meta faça ajustes automáticos no anúncio, é necessário enviar mídias compatíveis para todos os posicionamentos.
            </AlertDescription>
          </Alert>
        )}

        {mediaVariations.map((variation, index) => (
          <div key={variation.id} className="space-y-6 p-6 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-jumper-text">
                📎 Mídia {variation.id}
              </h3>
              {mediaVariations.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeVariation(variation.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remover
                </Button>
              )}
            </div>

            <div className="grid gap-6">
              <SingleFileUploadSection
                title="📐 Formato Quadrado"
                format="square"
                dimensions="1080x1080px ou múltiplos superiores (1:1)"
                file={variation.squareFile}
                onFileChange={(file) => updateVariationFile(variation.id, 'square', file)}
                enabled={variation.squareEnabled !== false}
                onEnabledChange={(enabled) => updateVariationEnabled(variation.id, 'square', enabled)}
                canDisable={canDisablePosition(variation, 'square')}
              />

              <SingleFileUploadSection
                title="📱 Formato Vertical"
                format="vertical"
                dimensions="1080x1920px ou múltiplos superiores (9:16)"
                file={variation.verticalFile}
                onFileChange={(file) => updateVariationFile(variation.id, 'vertical', file)}
                enabled={variation.verticalEnabled !== false}
                onEnabledChange={(enabled) => updateVariationEnabled(variation.id, 'vertical', enabled)}
                canDisable={canDisablePosition(variation, 'vertical')}
              />

              <SingleFileUploadSection
                title="💻 Formato Horizontal"
                format="horizontal"
                dimensions="1200x628px ou múltiplos superiores (1.91:1)"
                file={variation.horizontalFile}
                onFileChange={(file) => updateVariationFile(variation.id, 'horizontal', file)}
                enabled={variation.horizontalEnabled !== false}
                onEnabledChange={(enabled) => updateVariationEnabled(variation.id, 'horizontal', enabled)}
                canDisable={canDisablePosition(variation, 'horizontal')}
              />
            </div>
          </div>
        ))}

        {/* Add Variation Button */}
        {mediaVariations.length < 10 && (
          <div className="text-center">
            <Button
              variant="outline"
              onClick={addVariation}
              className="bg-white hover:bg-gray-50 border-2 border-dashed border-gray-300 hover:border-jumper-blue transition-colors"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Variação ({mediaVariations.length}/10)
            </Button>
          </div>
        )}

        {/* Apenas mostrar erro quando há erro de validação do formulário */}
        {errors.files && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm text-red-600">{errors.files}</p>
            </div>
          </div>
        )}

        {/* Info box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Dica</p>
              <p className="text-sm text-blue-700">
                Você pode enviar um arquivo por formato em cada mídia. Use os toggles para ativar/desativar posicionamentos (máximo 2 desativados). Adicione variações para criar diferentes versões do seu anúncio.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For other creative types, use the original FileUpload component
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-jumper-text mb-2">📎 Upload de Arquivos</h2>
        <p className="text-gray-600">Envie seus criativos para validação automática</p>
      </div>

      <FileUpload
        files={formData.validatedFiles}
        onFilesChange={(files) => updateFormData({ validatedFiles: files })}
        platform={formData.platform}
      />

      {/* Apenas mostrar erro quando há erro de validação do formulário */}
      {errors.files && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-600">{errors.files}</p>
          </div>
        </div>
      )}

      {formData.validatedFiles.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-blue-800">Dica</p>
              <p className="text-sm text-blue-700">
                Certifique-se de que todos os arquivos estão com validação verde antes de continuar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2;
