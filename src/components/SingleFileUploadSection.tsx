
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { X, Upload, CheckCircle, AlertCircle, Image, Replace, Info } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
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
  const [showZoneOverlay, setShowZoneOverlay] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0 || !enabled) return;
    
    setIsValidating(true);
    const validatedFile = await validateFile(acceptedFiles[0], format);
    onFileChange(validatedFile);
    setIsValidating(false);

    // Auto-show overlay for vertical format images if validation is successful
    if (format === 'vertical' && validatedFile.valid && validatedFile.preview) {
      setTimeout(() => setShowZoneOverlay(true), 100);
    }
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
    setShowZoneOverlay(false);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Check if image has correct 9:16 ratio for vertical format
  const hasCorrectVerticalRatio = (file: ValidatedFile) => {
    if (format !== 'vertical' || !file.dimensions) return true;
    const aspectRatio = file.dimensions.width / file.dimensions.height;
    const expectedRatio = 9 / 16; // 0.5625
    return Math.abs(aspectRatio - expectedRatio) < 0.01;
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

                    {/* Warning for incorrect 9:16 ratio on vertical format */}
                    {format === 'vertical' && file.valid && file.file.type.startsWith('image/') && 
                     !hasCorrectVerticalRatio(file) && (
                      <div className="text-xs text-orange-600 mt-1 font-medium">
                        ⚠️ Imagem deve ter proporção 9:16 para Stories/Reels
                      </div>
                    )}
                  </div>

                  {file.preview && (
                    <div className="flex-shrink-0">
                      <div className="w-20 h-24 border rounded overflow-hidden">
                        <MetaZoneOverlay 
                          imageUrl={file.preview} 
                          format={format}
                        />
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

          {/* Meta Zone Protection Info for Vertical Format */}
          {format === 'vertical' && file.valid && file.preview && file.file.type.startsWith('image/') && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
              <div className="flex items-center space-x-2">
                <Info className="h-4 w-4 text-blue-600" />
                <h4 className="text-sm font-semibold text-blue-800">Proteção de Zonas Meta</h4>
              </div>
              
              {/* Larger Preview with Overlay */}
              <div className="w-48 h-64 mx-auto border rounded overflow-hidden bg-white">
                <MetaZoneOverlay 
                  imageUrl={file.preview} 
                  format={format}
                />
              </div>

              {/* Legend */}
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center space-x-4 text-xs">
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-red-500 bg-opacity-30 border border-red-400 rounded"></div>
                    <span className="text-red-700">Zona de Risco (interface Meta)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 bg-green-500 bg-opacity-10 border border-green-400 rounded"></div>
                    <span className="text-green-700">Zona Segura</span>
                  </div>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  ⚠️ Evite colocar textos ou logos importantes nas áreas vermelhas
                </p>
                <p className="text-xs text-gray-500">
                  Esta máscara mostra onde a interface do Meta pode cobrir seu conteúdo
                </p>
              </div>
            </div>
          )}
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
    </div>
  );
};

export default SingleFileUploadSection;
