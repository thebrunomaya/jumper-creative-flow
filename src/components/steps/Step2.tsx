
import React from 'react';
import { FormData, ValidatedFile, MediaVariation } from '@/types/creative';
import FileUpload from '@/components/FileUpload';
import SingleFileUploadSection from '@/components/SingleFileUploadSection';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';

interface Step2Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step2: React.FC<Step2Props> = ({ formData, updateFormData, errors }) => {
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

  // Check if all enabled positions have files for all variations
  const hasAllRequiredFiles = () => {
    return mediaVariations.every(variation => {
      const requiredPositions = [];
      if (variation.squareEnabled !== false) requiredPositions.push('square');
      if (variation.verticalEnabled !== false) requiredPositions.push('vertical');
      if (variation.horizontalEnabled !== false) requiredPositions.push('horizontal');
      
      return requiredPositions.every(position => {
        const file = variation[`${position}File`];
        return file && file.valid;
      });
    });
  };

  // For single image/video ads, we need separate upload sections for images
  if (formData.creativeType === 'single') {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-jumper-text mb-2">🖼️ Upload de Arquivos</h2>
          <p className="text-gray-600">Envie suas imagens e vídeos nos diferentes formatos</p>
        </div>

        {/* Warning when positions are disabled */}
        {hasAnyDisabledPosition() && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <strong>Atenção:</strong> Para impedir que o Meta faça ajustes automáticos no anúncio, é necessário enviar mídias compatíveis para todos os posicionamentos.
            </AlertDescription>
          </Alert>
        )}

        {/* Alert when missing required files */}
        {!hasAllRequiredFiles() && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Arquivos obrigatórios:</strong> Para continuar, você deve enviar arquivos válidos para todos os posicionamentos ativos ou desativar os posicionamentos que não terão arquivos (máximo 2 desativados por variação).
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
                placeholder="Ideal para feed do Instagram e Facebook"
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
                placeholder="Ideal para Stories e feed mobile"
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
                placeholder="Ideal para Facebook feed desktop"
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

        {errors.files && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">{errors.files}</p>
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

      {errors.files && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600">{errors.files}</p>
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
