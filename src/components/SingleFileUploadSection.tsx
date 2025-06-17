
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Upload, CheckCircle, AlertCircle, Image, Replace, Eye, ExpandIcon } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import MediaPreviewLightbox from './MediaPreviewLightbox';
import MetaZoneOverlay from './MetaZoneOverlay';

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

  const getStandardizedThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal') => {
    const height = 120; // Padronizar altura para todos
    
    switch (format) {
      case 'square':
        return { width: height, height }; // 120x120
      case 'vertical':
        return { width: Math.round(height * 9 / 16), height }; // 67x120 (9:16)
      case 'horizontal':
        return { width: Math.round(height * 1.91), height }; // 229x120 (1.91:1)
      default:
        return { width: height, height };
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
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
            !enabled 
              ? 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
              : isDragActive
              ? 'border-jumper-blue bg-blue-50 cursor-pointer'
              : 'border-gray-300 hover:border-jumper-blue hover:bg-gray-50 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <Upload className={`mx-auto h-10 w-10 ${enabled ? 'text-gray-400' : 'text-gray-300'}`} />
            <div>
              <p className={`text-base font-medium ${enabled ? 'text-jumper-text' : 'text-gray-400'}`}>
                {!enabled 
                  ? 'Posicionamento desativado'
                  : isDragActive 
                  ? 'Solte o arquivo aqui' 
                  : 'Clique ou arraste uma imagem/vídeo'
                }
              </p>
              {enabled && (
                <>
                  <p className="text-sm text-gray-600 mt-2">
                    JPG, PNG, MP4, MOV • {dimensions} • Máx: 30MB (imagens) / 4GB (vídeos)
                  </p>
                  {placeholder && (
                    <p className="text-sm text-gray-500 mt-1">{placeholder}</p>
                  )}
                </>
              )}
            </div>
            {isValidating && (
              <div className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-jumper-blue"></div>
                <span className="text-sm text-jumper-blue">Validando...</span>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className={`${file.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <CardContent className="p-5">
              <div className="flex items-start space-x-4">
                {/* Thumbnail com overlay */}
                {file.preview && (
                  <div className="flex-shrink-0">
                    <div 
                      className="relative border-2 border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:border-blue-300 transition-all duration-200 group bg-gray-50"
                      style={getStandardizedThumbnailDimensions(format)}
                      onClick={() => setLightboxOpen(true)}
                    >
                      <MetaZoneOverlay
                        imageUrl={file.preview}
                        format={format}
                        file={file.file}
                        size="thumbnail"
                      />
                      
                      {/* Hover overlay com ícone de expandir */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                        <ExpandIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* Indicador de formato */}
                      <div className="absolute top-2 left-2">
                        <div className="bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                          {format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1'}
                        </div>
                      </div>

                      {/* Hint de clique */}
                      <div className="absolute bottom-2 right-2">
                        <div className="bg-blue-500 bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1">
                          <Eye className="h-3 w-3" />
                          <span>Ver</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Informações do arquivo */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Nome do arquivo e status */}
                      <div className="flex items-center space-x-3 mb-2">
                        <Image className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <p className="text-base font-semibold text-jumper-text truncate">
                          {file.file.name}
                        </p>
                        {file.valid ? (
                          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Metadados do arquivo */}
                      <div className="text-sm text-gray-600 mb-3">
                        <span className="font-medium">{formatFileSize(file.file.size)}</span>
                        {file.dimensions && (
                          <span> • {file.dimensions.width}×{file.dimensions.height}px</span>
                        )}
                        {file.duration && (
                          <span> • {file.duration}s</span>
                        )}
                      </div>
                      
                      {/* Mensagens de validação */}
                      <div className="space-y-1">
                        {file.errors.map((error, errorIndex) => (
                          <div 
                            key={errorIndex}
                            className={`text-sm font-medium ${file.valid ? 'text-green-600' : 'text-red-600'}`}
                          >
                            {file.valid ? '✓' : '✗'} {error}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => document.getElementById(`replace-${format}`)?.click()}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500"
                        title="Substituir arquivo"
                        disabled={!enabled}
                      >
                        <Replace className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeFile}
                        className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        title="Remover arquivo"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
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
