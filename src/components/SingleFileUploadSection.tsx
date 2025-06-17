
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Upload, CheckCircle, AlertCircle, Image, Replace, Eye, ExpandIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import MediaPreviewLightbox from './MediaPreviewLightbox';

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getThumbnailDimensions = (file: ValidatedFile) => {
    if (!file.dimensions) return { width: 80, height: 80 };
    
    const { width, height } = file.dimensions;
    const aspectRatio = width / height;
    
    // Calculate thumbnail size maintaining aspect ratio
    const maxSize = 100;
    if (aspectRatio > 1) {
      // Landscape
      return { width: maxSize, height: maxSize / aspectRatio };
    } else {
      // Portrait or square
      return { width: maxSize * aspectRatio, height: maxSize };
    }
  };

  return (
    <div className="space-y-4">
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

      {!enabled && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            📍 Posicionamento desativado
          </p>
        </div>
      )}

      {/* Upload Zone or File Display */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 ${
            !enabled 
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
              : isDragActive
              ? 'border-jumper-blue bg-blue-50 cursor-pointer'
              : 'border-gray-300 hover:border-jumper-blue hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <Upload className={`mx-auto h-8 w-8 ${enabled ? 'text-gray-400' : 'text-gray-300'}`} />
            <div>
              <p className={`text-sm font-medium ${enabled ? 'text-jumper-text' : 'text-gray-400'}`}>
                {!enabled 
                  ? 'Posicionamento desativado'
                  : isDragActive 
                  ? 'Solte o arquivo aqui' 
                  : 'Clique ou arraste uma imagem/vídeo'
                }
              </p>
              {enabled && (
                <>
                  <p className="text-xs text-gray-600 mt-1">
                    JPG, PNG, MP4, MOV • {dimensions} • Máx: 30MB (imagens) / 4GB (vídeos)
                  </p>
                  {placeholder && (
                    <p className="text-xs text-gray-500 mt-1">{placeholder}</p>
                  )}
                </>
              )}
            </div>
            {isValidating && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-jumper-blue"></div>
                <span className="text-xs text-jumper-blue">Validando...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Card className={`${file.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <Image className="h-6 w-6 text-blue-500 flex-shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <p className="text-sm font-medium text-jumper-text truncate">
                        {file.file.name}
                      </p>
                      {file.valid ? (
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-600">
                      {formatFileSize(file.file.size)}
                      {file.dimensions && (
                        <span> • {file.dimensions.width}x{file.dimensions.height}px</span>
                      )}
                      {file.duration && (
                        <span> • {file.duration}s</span>
                      )}
                    </div>
                    
                    {file.errors.map((error, errorIndex) => (
                      <div 
                        key={errorIndex}
                        className={`text-xs mt-1 ${file.valid ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {error}
                      </div>
                    ))}
                  </div>

                  {/* Enhanced Thumbnail with Overlay */}
                  {file.preview && (
                    <div className="flex-shrink-0 relative">
                      <div 
                        className="border rounded overflow-hidden cursor-pointer hover:opacity-90 transition-opacity relative group"
                        style={getThumbnailDimensions(file)}
                        onClick={() => setLightboxOpen(true)}
                      >
                        {file.file.type.startsWith('video/') ? (
                          <video 
                            src={file.preview} 
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img 
                            src={file.preview} 
                            alt="Preview" 
                            className="w-full h-full object-cover"
                          />
                        )}
                        
                        {/* Hover overlay with expand icon */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                          <ExpandIcon className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        
                        {/* Format indicator */}
                        <div className="absolute top-1 left-1">
                          <div className="bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded">
                            {format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1'}
                          </div>
                        </div>

                        {/* Click hint */}
                        <div className="absolute bottom-1 right-1">
                          <div className="bg-blue-500 bg-opacity-80 text-white text-xs px-1 py-0.5 rounded flex items-center space-x-1">
                            <Eye className="h-2 w-2" />
                            <span>Ver</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => document.getElementById(`replace-${format}`)?.click()}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-blue-500"
                    title="Substituir arquivo"
                    disabled={!enabled}
                  >
                    <Replace className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                    title="Remover arquivo"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hidden file input for replacement */}
      <input
        id={`replace-${format}`}
        type="file"
        accept="image/*,video/mp4,video/mov,video/quicktime"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0 && enabled) {
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
    </div>
  );
};

export default SingleFileUploadSection;
