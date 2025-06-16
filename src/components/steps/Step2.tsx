
import React from 'react';
import { FormData, ValidatedFile } from '@/types/creative';
import FileUpload from '@/components/FileUpload';
import ImageUploadSection from '@/components/ImageUploadSection';

interface Step2Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step2: React.FC<Step2Props> = ({ formData, updateFormData, errors }) => {
  // For single image/video ads, we need separate upload sections for images
  if (formData.creativeType === 'single') {
    const squareFiles = formData.validatedFiles.filter(f => f.format === 'square');
    const verticalFiles = formData.validatedFiles.filter(f => f.format === 'vertical');
    const horizontalFiles = formData.validatedFiles.filter(f => f.format === 'horizontal');

    const updateFilesForFormat = (format: 'square' | 'vertical' | 'horizontal', newFiles: ValidatedFile[]) => {
      const otherFiles = formData.validatedFiles.filter(f => f.format !== format);
      const updatedFiles = [...otherFiles, ...newFiles];
      updateFormData({ validatedFiles: updatedFiles });
    };

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-jumper-text mb-2">🖼️ Upload de Arquivos</h2>
          <p className="text-gray-600">Envie suas imagens e vídeos nos diferentes formatos</p>
        </div>

        <div className="grid gap-8">
          <ImageUploadSection
            title="📐 Formato Quadrado"
            format="square"
            dimensions="1080x1080px"
            files={squareFiles}
            onFilesChange={(files) => updateFilesForFormat('square', files)}
            placeholder="Ideal para feed do Instagram e Facebook"
          />

          <ImageUploadSection
            title="📱 Formato Vertical"
            format="vertical"
            dimensions="1080x1350px"
            files={verticalFiles}
            onFilesChange={(files) => updateFilesForFormat('vertical', files)}
            placeholder="Ideal para Stories e feed mobile"
          />

          <ImageUploadSection
            title="💻 Formato Horizontal"
            format="horizontal"
            dimensions="1200x628px"
            files={horizontalFiles}
            onFilesChange={(files) => updateFilesForFormat('horizontal', files)}
            placeholder="Ideal para Facebook feed desktop"
          />
        </div>

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
                  Envie pelo menos um arquivo em cada formato para ter máxima cobertura nas plataformas.
                </p>
              </div>
            </div>
          </div>
        )}
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
