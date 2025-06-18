
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !enabled) return;
    
    console.log('onDrop - Processing file:', {
      fileName: acceptedFiles[0].name,
      fileType: acceptedFiles[0].type,
      format: format
    });
    
    setIsValidating(true);
    const validatedFile = await validateFile(acceptedFiles[0], format);
    console.log('onDrop - Validation complete:', {
      valid: validatedFile.valid,
      hasPreview: !!validatedFile.preview,
      isVideo: validatedFile.file.type.startsWith('video/')
    });
    onFileChange(validatedFile);
    setIsValidating(false);
  }, [onFileChange, format, enabled]);

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

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Media Card */}
        <div className="lg:col-span-2">
          <div {...getRootProps()} className={isDragActive ? 'opacity-75' : ''}>
            <input {...getInputProps()} />
            <MediaCard
              title={title}
              format={format}
              dimensions={dimensions}
              file={file}
              onFileChange={onFileChange}
              onPreviewClick={() => setLightboxOpen(true)}
              enabled={enabled}
              compact={true}
            />
          </div>
        </div>

        {/* Validation Panel */}
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
