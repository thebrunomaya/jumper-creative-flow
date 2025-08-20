
import React from 'react';
import { FormData, ValidatedFile, MediaVariation } from '@/types/creative';
import SingleFileUploadSection from '@/components/SingleFileUploadSection';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface SingleMediaSectionProps {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const SingleMediaSection: React.FC<SingleMediaSectionProps> = ({
  formData,
  updateFormData,
  errors
}) => {
  // Initialize media variations if not exists
  const mediaVariations = formData.mediaVariations || [{
    id: 1,
    squareEnabled: true,
    verticalEnabled: true,
    horizontalEnabled: true
  }];

  const updateMediaVariations = (variations: MediaVariation[]) => {
    updateFormData({
      mediaVariations: variations
    });
  };

  const addVariation = () => {
    if (mediaVariations.length < 10) {
      // Generate unique ID by finding the maximum existing ID and adding 1
      const maxId = Math.max(0, ...mediaVariations.map(v => v.id || 0));
      const newVariations = [...mediaVariations, {
        id: maxId + 1,
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
        return {
          ...variation,
          [`${format}File`]: file
        };
      }
      return variation;
    });
    updateMediaVariations(newVariations);
  };

  const updateVariationEnabled = (variationId: number, format: 'square' | 'vertical' | 'horizontal', enabled: boolean) => {
    const newVariations = mediaVariations.map(variation => {
      if (variation.id === variationId) {
        const updatedVariation = {
          ...variation,
          [`${format}Enabled`]: enabled
        };

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
    if (variation.squareEnabled !== true) count++;
    if (variation.verticalEnabled !== true) count++;
    if (variation.horizontalEnabled !== true) count++;
    return count;
  };

  const canDisablePosition = (variation: MediaVariation, format: 'square' | 'vertical' | 'horizontal') => {
    const currentlyEnabled = variation[`${format}Enabled`] === true;
    const disabledCount = getDisabledCount(variation);

    // Can disable if currently enabled and we haven't reached the limit of 2 disabled
    return currentlyEnabled ? disabledCount < 2 : true;
  };

  const hasAnyDisabledPosition = () => {
    return mediaVariations.some(variation => 
      variation.squareEnabled !== true || variation.verticalEnabled !== true || variation.horizontalEnabled !== true
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">🖼️ Upload de Arquivos</h2>
        <p className="text-muted-foreground">Envie suas imagens e vídeos nos diferentes formatos</p>
      </div>

      {/* Warning when positions are disabled - apenas informativo */}
      {hasAnyDisabledPosition() && (
        <Alert className="border-warning bg-warning/20">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-foreground">
            <strong>Atenção:</strong> Para impedir que o Meta faça ajustes automáticos no anúncio, é necessário enviar mídias compatíveis para todos os posicionamentos.
          </AlertDescription>
        </Alert>
      )}

      {mediaVariations.map((variation, index) => (
        <div key={variation.id} className="space-y-6 p-6 rounded-lg bg-card border border-border">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-foreground">
              📎 Mídia {variation.id}
            </h3>
            {mediaVariations.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => removeVariation(variation.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
              enabled={variation.squareEnabled === true}
              onEnabledChange={(enabled) => updateVariationEnabled(variation.id, 'square', enabled)}
              canDisable={canDisablePosition(variation, 'square')}
            />

            <SingleFileUploadSection
              title="📱 Formato Vertical"
              format="vertical"
              dimensions="1080x1920px ou múltiplos superiores (9:16)"
              file={variation.verticalFile}
              onFileChange={(file) => updateVariationFile(variation.id, 'vertical', file)}
              enabled={variation.verticalEnabled === true}
              onEnabledChange={(enabled) => updateVariationEnabled(variation.id, 'vertical', enabled)}
              canDisable={canDisablePosition(variation, 'vertical')}
            />

            <SingleFileUploadSection
              title="💻 Formato Horizontal"
              format="horizontal"
              dimensions="1200x628px ou múltiplos superiores (1.91:1)"
              file={variation.horizontalFile}
              onFileChange={(file) => updateVariationFile(variation.id, 'horizontal', file)}
              enabled={variation.horizontalEnabled === true}
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
            className="bg-card hover:bg-accent border-2 border-dashed border-muted hover:border-primary transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Variação ({mediaVariations.length}/10)
          </Button>
        </div>
      )}

      {/* Apenas mostrar erro quando há erro de validação do formulário */}
      {errors.files && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{errors.files}</p>
          </div>
        </div>
      )}

      {/* Info box */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Dica</p>
            <p className="text-sm text-muted-foreground">
              Você pode enviar um arquivo por formato em cada mídia. Use os toggles para ativar/desativar posicionamentos (máximo 2 desativados). Adicione variações para criar diferentes versões do seu anúncio.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleMediaSection;
