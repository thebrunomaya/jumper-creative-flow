
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Switch } from '@/components/ui/switch';
import { useDropzone } from 'react-dropzone';
import MediaPreviewLightbox from './MediaPreviewLightbox';
import ThumbnailPreview from './ThumbnailPreview';
import FileUploadZone from './FileUploadZone';
import FileDetails from './FileDetails';

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

  const removeFile = () => {
    onFileChange(undefined);
  };

  const handleReplace = () => {
    document.getElementById(`replace-${format}`)?.click();
  };

  return (
    <div className="space-y-4">
      {/* Header - always visible */}
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

      {/* Show disabled message when positioning is off */}
      {!enabled && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            📍 Posicionamento desativado
          </p>
        </div>
      )}

      {/* Only show upload section when enabled */}
      {enabled && (
        <>
          {/* Upload Zone or File Display - Container com altura flexível */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[200px]">
            <div className="flex min-h-[200px]">
              {/* Thumbnail Container - largura fixa, altura flexível para centralizar */}
              <div className="w-[140px] bg-gray-50 border-r border-gray-200 flex items-center justify-center p-4">
                <ThumbnailPreview
                  format={format}
                  file={file}
                  onPreviewClick={() => setLightboxOpen(true)}
                />
              </div>

              {/* Upload Area ou File Details Container - altura flexível */}
              <div className="flex-1 flex flex-col min-h-[200px]">
                {!file ? (
                  <FileUploadZone
                    getRootProps={getRootProps}
                    getInputProps={getInputProps}
                    isDragActive={isDragActive}
                    isValidating={isValidating}
                    dimensions={dimensions}
                  />
                ) : (
                  <FileDetails
                    file={file}
                    format={format}
                    onRemove={removeFile}
                    onReplace={handleReplace}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Hidden file input for replacement */}
          <input
            id={`replace-${format}`}
            type="file"
            accept="image/*,video/mp4,video/mov,video/quicktime"
            onChange={(e) => {
              const files = e.target.files;
              if (files && files.length > 0) {
                onDrop([files[0]]);
              }
            }}
            style={{ display: 'none' }}
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
        </>
      )}
    </div>
  );
};

export default SingleFileUploadSection;
