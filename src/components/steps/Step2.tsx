
import React from 'react';
import { FormData } from '@/types/creative';
import FileUpload from '@/components/FileUpload';
import CarouselMediaSection from '@/components/sections/CarouselMediaSection';
import SingleMediaSection from '@/components/sections/SingleMediaSection';
import ExistingPostSection from '@/components/sections/ExistingPostSection';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface Step2Props {
  formData: FormData;
  updateFormData: (data: Partial<FormData>) => void;
  errors: Record<string, string>;
}

const Step2: React.FC<Step2Props> = ({
  formData,
  updateFormData,
  errors
}) => {
  // For carousel creative type
  if (formData.creativeType === 'carousel') {
    return (
      <CarouselMediaSection 
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    );
  }

  // For single image/video ads
  if (formData.creativeType === 'single') {
    return (
      <SingleMediaSection 
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    );
  }

  // For existing post type
  if (formData.creativeType === 'existing-post') {
    return (
      <ExistingPostSection 
        formData={formData}
        updateFormData={updateFormData}
        errors={errors}
      />
    );
  }

  // For other creative types, use the original FileUpload component
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-2">📎 Upload de Arquivos</h2>
        <p className="text-muted-foreground">Envie seus criativos para validação automática</p>
      </div>

      <FileUpload
        files={formData.validatedFiles}
        onFilesChange={(files) => updateFormData({ validatedFiles: files })}
        platform={formData.platform}
      />

      {/* Apenas mostrar erro quando há erro de validação do formulário */}
      {errors.files && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{errors.files}</p>
          </div>
        </div>
      )}

      {formData.validatedFiles.length > 0 && (
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
