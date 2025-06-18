
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Switch } from '@/components/ui/switch';
import { useDropzone } from 'react-dropzone';
import MediaPreviewLightbox from './MediaPreviewLightbox';
import MediaCard from './MediaCard';
import ValidationPanel from './ValidationPanel';

interface SingleFileUploadSectionProps {
  title: string;
  format: 'square' | 'vertical' | 'horizontal';
  dimensions: string;
  file?: ValidatedFile;
  onFileChange: (file?: ValidatedFile) => void;
  placeholder?: string;
  enabled: boolean;
  onEnabledChange: (enabled: boolean) => void;
  canDisable: boolean;
}

const SingleFileUploadSection: React.FC<SingleFileUploadSectionProps> = ({
  title,
  format,
  dimensions,
  file,
  onFileChange,
  placeholder,
  enabled,
  onEnabledChange,
  canDisable
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const processFile = useCallback(async (selectedFile: File) => {
    if (!enabled) return;
    
    console.log('SingleFileUploadSection - Processing file:', {
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      format: format
    });
    
    setIsValidating(true);
    const validatedFile = await validateFile(selectedFile, format);
    console.log('SingleFileUploadSection - Validation complete:', {
      valid: validatedFile.valid,
      hasPreview: !!validatedFile.preview
    });
    onFileChange(validatedFile);
    setIsValidating(false);
  }, [onFileChange, format, enabled]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !enabled) return;
    await processFile(acceptedFiles[0]);
  }, [processFile, enabled]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    multiple: false,
    maxFiles: 1,
    disabled: !enabled
  });

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/mp4,video/mov,video/quicktime';
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };
    input.click();
  };

  const handleReplaceClick = () => {
    handleUploadClick();
  };

  const handleRemoveClick = () => {
    onFileChange(undefined);
  };

  // Generate validation items for the panel
  const validations = [];
  if (file) {
    if (file.valid) {
      validations.push({
        id: 'file-valid',
        type: 'success' as const,
        message: `Arquivo ${format} válido e pronto para uso`
      });
    } else if (file.errors) {
      file.errors.forEach((error, index) => {
        validations.push({
          id: `error-${index}`,
          type: 'error' as const,
          message: error
        });
      });
    }
  }

  if (isValidating) {
    validations.push({
      id: 'validating',
      type: 'info' as const,
      message: 'Validando arquivo...'
    });
  }

  return (
    <div className="space-y-4">
      {/* Header with Switch */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-jumper-text">{title}</h3>
          <div className="flex items-center space-x-2">
            <Switch
              checked={enabled}
              onCheckedChange={onEnabledChange}
              disabled={!canDisable && enabled}
            />
            <span className="text-sm text-gray-600">
              {enabled ? 'Ativo' : 'Inativo'}
            </span>
          </div>
        </div>
        <span className="text-sm text-gray-500">{dimensions}</span>
      </div>

      {/* Main Content Area - Usando o padrão padronizado */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Media Card - Takes 3/4 of the space on large screens */}
        <div className="lg:col-span-3">
          <MediaCard
            title={title}
            format={format}
            dimensions={dimensions}
            file={file}
            onPreviewClick={() => setLightboxOpen(true)}
            onUploadClick={handleUploadClick}
            onReplaceClick={handleReplaceClick}
            onRemoveClick={handleRemoveClick}
            enabled={enabled}
            getRootProps={getRootProps}
            getInputProps={getInputProps}
            isDragActive={isDragActive}
            isValidating={isValidating}
            compact={true}
          />
        </div>

        {/* Validation Panel - Takes 1/4 of the space on large screens */}
        <div className="lg:col-span-1">
          <ValidationPanel validations={validations} />
        </div>
      </div>

      {/* Media Preview Lightbox */}
      {file && (
        <MediaPreviewLightbox
          file={file}
          format={format}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
};

export default SingleFileUploadSection;
