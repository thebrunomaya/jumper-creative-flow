
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Switch } from '@/components/ui/switch';
import { useDropzone } from 'react-dropzone';
import MediaPreviewLightbox from './MediaPreviewLightbox';
import MediaCard from './MediaCard';

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
    if (!enabled) return;
    
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

      {/* Main Content Area - MediaCard ocupa toda a largura */}
      <MediaCard
        title={title}
        format={format}
        dimensions={dimensions}
        file={file}
        onPreviewClick={() => file && setLightboxOpen(true)}
        onUploadClick={handleUploadClick}
        onReplaceClick={handleReplaceClick}
        onRemoveClick={handleRemoveClick}
        enabled={enabled}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isValidating={isValidating}
        urlMode={false}
      />

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
