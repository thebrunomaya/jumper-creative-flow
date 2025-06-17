
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

  const getThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal') => {
    const baseWidth = 120; // Increased from 100px for better visibility
    
    switch (format) {
      case 'square':
        return { width: baseWidth, height: baseWidth }; // 120x120 (1:1)
      case 'vertical':
        return { width: baseWidth, height: Math.round(baseWidth * 16 / 9) }; // 120x213 (9:16)
      case 'horizontal':
        return { width: baseWidth, height: Math.max(80, Math.round(baseWidth / 1.91)) }; // 120x63 min 80px (1.91:1)
      default:
        return { width: baseWidth, height: baseWidth };
    }
  };

  const createMockupFile = (format: 'square' | 'vertical' | 'horizontal') => {
    const canvas = document.createElement('canvas');
    const { width, height } = getThumbnailDimensions(format);
    canvas.width = width * 3; // Higher resolution for quality
    canvas.height = height * 3;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Softer, more harmonious gradients
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      switch (format) {
        case 'square':
          gradient.addColorStop(0, '#f8fafc'); // Very light gray-blue
          gradient.addColorStop(1, '#e2e8f0'); // Light gray-blue
          break;
        case 'vertical':
          gradient.addColorStop(0, '#faf5ff'); // Very light purple
          gradient.addColorStop(1, '#e9d5ff'); // Light purple
          break;
        case 'horizontal':
          gradient.addColorStop(0, '#f0fdf4'); // Very light green
          gradient.addColorStop(1, '#dcfce7'); // Light green
          break;
      }
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      
      // Add centered text
      ctx.fillStyle = '#64748b'; // Softer text color
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
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-sm text-amber-800">
            📍 Posicionamento desativado
          </p>
        </div>
      )}

      {/* Upload Zone or File Display */}
      {!file ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
          <div className="flex min-h-[160px]">
            {/* Thumbnail Mockup Container */}
            <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-6">
              <div 
                className="relative border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm"
                style={getThumbnailDimensions(format)}
              >
                <MetaZoneOverlay
                  imageUrl={createMockupFile(format)}
                  format={format}
                  size="thumbnail"
                />
                
                {/* Format indicator */}
                <div className="absolute top-1.5 left-1.5">
                  <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                    {format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1'}
                  </div>
                </div>
              </div>
            </div>

            {/* Upload Area Container */}
            <div 
              {...getRootProps()}
              className={`w-3/4 flex items-center justify-center cursor-pointer transition-all duration-200 ${
                !enabled 
                  ? 'bg-gray-50 cursor-not-allowed opacity-60'
                  : isDragActive
                  ? 'bg-blue-50 border-blue-200'
                  : 'hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="text-center space-y-4 p-8">
                <Upload className={`mx-auto h-10 w-10 ${enabled ? 'text-gray-400' : 'text-gray-300'}`} />
                <div>
                  <p className={`text-lg font-medium ${enabled ? 'text-jumper-text' : 'text-gray-400'}`}>
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
                        JPG, PNG, MP4, MOV • {dimensions}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Máx: 30MB (imagens) / 4GB (vídeos)
                      </p>
                      {placeholder && (
                        <p className="text-sm text-gray-500 mt-3 italic">{placeholder}</p>
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
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className={`border-2 transition-all duration-200 ${
            file.valid 
              ? 'border-emerald-200 bg-emerald-50/50' 
              : 'border-red-200 bg-red-50/50'
          }`}>
            <CardContent className="p-0">
              <div className="flex">
                {/* Thumbnail Container */}
                <div className="w-1/4 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-6">
                  {file.preview && (
                    <div 
                      className="relative border-2 border-gray-300 rounded-lg overflow-hidden cursor-pointer hover:border-blue-400 transition-all duration-200 group bg-white shadow-sm"
                      style={getThumbnailDimensions(format)}
                      onClick={() => setLightboxOpen(true)}
                    >
                      <MetaZoneOverlay
                        imageUrl={file.preview}
                        format={format}
                        file={file.file}
                        size="thumbnail"
                      />
                      
                      {/* Hover overlay */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
                        <ExpandIcon className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      
                      {/* Format indicator */}
                      <div className="absolute top-1.5 left-1.5">
                        <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                          {format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1'}
                        </div>
                      </div>

                      {/* View hint */}
                      <div className="absolute bottom-1.5 right-1.5">
                        <div className="bg-blue-500 bg-opacity-80 text-white text-xs px-2 py-1 rounded flex items-center space-x-1 backdrop-blur-sm">
                          <Eye className="h-3 w-3" />
                          <span>Ver</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* File Details Container */}
                <div className="w-3/4 bg-white p-6">
                  <div className="flex flex-col justify-between h-full min-w-0">
                    {/* Header with name and status */}
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

                      {/* Action buttons */}
                      <div className="flex items-center space-x-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => document.getElementById(`replace-${format}`)?.click()}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-500 hover:bg-blue-50"
                          title="Substituir arquivo"
                          disabled={!enabled}
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
                    
                    {/* File metadata */}
                    <div className="text-sm text-gray-600 mb-4 flex items-center space-x-4">
                      <span className="font-medium">{formatFileSize(file.file.size)}</span>
                      {file.dimensions && (
                        <span>{file.dimensions.width}×{file.dimensions.height}px</span>
                      )}
                      {file.duration && (
                        <span>{file.duration}s</span>
                      )}
                    </div>
                    
                    {/* Validation messages */}
                    <div className="space-y-2">
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
