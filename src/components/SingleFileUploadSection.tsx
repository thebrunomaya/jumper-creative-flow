
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Upload, CheckCircle, AlertCircle, Image, Replace, Eye } from 'lucide-react';
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

  const getThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal') => {
    // Container disponível: aproximadamente 150px de largura e 150px de altura
    // Usando margem padronizada de 16px (8px de cada lado)
    const containerWidth = 150;
    const containerHeight = 150;
    const margin = 16;
    const maxWidth = containerWidth - margin;
    const maxHeight = containerHeight - margin;
    
    let aspectRatio: number;
    
    switch (format) {
      case 'square':
        aspectRatio = 1; // 1:1
        break;
      case 'vertical':
        aspectRatio = 9 / 16; // 9:16
        break;
      case 'horizontal':
        aspectRatio = 1.91; // 1.91:1
        break;
      default:
        aspectRatio = 1;
    }
    
    // Calcular dimensões para usar o máximo do espaço disponível
    let width: number;
    let height: number;
    
    if (aspectRatio >= 1) {
      // Formato horizontal ou quadrado - limitar pela largura disponível
      width = maxWidth;
      height = width / aspectRatio;
      
      // Se a altura calculada exceder o limite, ajustar pela altura
      if (height > maxHeight) {
        height = maxHeight;
        width = height * aspectRatio;
      }
    } else {
      // Formato vertical - limitar pela altura disponível
      height = maxHeight;
      width = height * aspectRatio;
      
      // Se a largura calculada exceder o limite, ajustar pela largura
      if (width > maxWidth) {
        width = maxWidth;
        height = width / aspectRatio;
      }
    }
    
    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  };

  const createMockupFile = (format: 'square' | 'vertical' | 'horizontal') => {
    const canvas = document.createElement('canvas');
    const { width, height } = getThumbnailDimensions(format);
    canvas.width = width * 3;
    canvas.height = height * 3;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      switch (format) {
        case 'square':
          gradient.addColorStop(0, '#f8fafc');
          gradient.addColorStop(1, '#e2e8f0');
          break;
        case 'vertical':
          gradient.addColorStop(0, '#faf5ff');
          gradient.addColorStop(1, '#e9d5ff');
          break;
        case 'horizontal':
          gradient.addColorStop(0, '#f0fdf4');
          gradient.addColorStop(1, '#dcfce7');
          break;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      
      ctx.fillStyle = '#64748b';
      ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1',
        canvas.width / 2,
        canvas.height / 2
      );
    }
    
    return canvas.toDataURL('image/png');
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
          {/* Upload Zone or File Display - Container com altura fixa */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm h-[200px]">
            <div className="flex h-full">
              {/* Thumbnail Container - altura fixa com flexbox para centralizar */}
              <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-4">
                <div 
                  className="relative border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer flex-shrink-0"
                  style={getThumbnailDimensions(format)}
                  onClick={() => file && setLightboxOpen(true)}
                >
                  <MetaZoneOverlay
                    imageUrl={file?.preview || createMockupFile(format)}
                    format={format}
                    file={file?.file}
                    size="thumbnail"
                  />
                  
                  <div className="absolute top-1.5 left-1.5">
                    <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                      {format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1'}
                    </div>
                  </div>

                  {/* Botão Ver dentro da imagem, centralizado na parte inferior */}
                  {file && (
                    <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2">
                      <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded backdrop-blur-sm hover:bg-blue-600 transition-colors flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>Ver</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload Area ou File Details Container - altura fixa */}
              <div className="w-3/4 flex flex-col">
                {!file ? (
                  <div 
                    {...getRootProps()}
                    className={`flex-1 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                      isDragActive
                      ? 'bg-blue-50 border-blue-200'
                      : 'hover:bg-gray-50'
                    }`}
                  >
                    <input {...getInputProps()} />
                    <div className="text-left space-y-4 p-8 w-full">
                      <div className="flex items-center space-x-3">
                        <Upload className="h-10 w-10 text-gray-400 flex-shrink-0" />
                        <div className="text-left">
                          <p className="text-lg font-medium text-jumper-text">
                            {isDragActive 
                            ? 'Solte o arquivo aqui' 
                            : 'Clique ou arraste uma imagem/vídeo'
                            }
                          </p>
                          <p className="text-sm text-gray-600 mt-1">
                            JPG, PNG, MP4, MOV • {dimensions}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Máx: 30MB (imagens) / 4GB (vídeos)
                          </p>
                        </div>
                      </div>
                      {isValidating && (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-jumper-blue"></div>
                          <span className="text-sm text-jumper-blue">Validando...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Image className="h-5 w-5 text-blue-500 flex-shrink-0" />
                        <p className="text-lg font-semibold text-jumper-text truncate">
                          {file.file.name}
                        </p>
                        {file.valid ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById(`replace-${format}`)?.click()}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                          title="Substituir arquivo"
                        >
                          <Replace className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={removeFile}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50"
                          title="Remover arquivo"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-4 flex items-center space-x-4 text-left">
                      <span className="font-medium">{formatFileSize(file.file.size)}</span>
                      {file.dimensions && (
                        <span>{file.dimensions.width}×{file.dimensions.height}px</span>
                      )}
                      {file.duration && (
                        <span>{file.duration}s</span>
                      )}
                    </div>
                    
                    <div className="space-y-2 text-left">
                      {file.errors.map((error, errorIndex) => (
                        <div 
                          key={errorIndex}
                          className={`text-sm font-medium flex items-center space-x-2 ${
                            file.valid ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          <span className="flex-shrink-0">{file.valid ? '✓' : '✗'}</span>
                          <span>{error}</span>
                        </div>
                      ))}
                    </div>
                  </div>
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
