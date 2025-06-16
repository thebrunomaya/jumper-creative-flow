
import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, CheckCircle, AlertCircle, Image, Replace } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface SingleFileUploadSectionProps {
  title: string;
  format: 'square' | 'vertical' | 'horizontal';
  dimensions: string;
  file?: ValidatedFile;
  onFileChange: (file?: ValidatedFile) => void;
  placeholder?: string;
}

const SingleFileUploadSection: React.FC<SingleFileUploadSectionProps> = ({
  title,
  format,
  dimensions,
  file,
  onFileChange,
  placeholder
}) => {
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    setIsValidating(true);
    const validatedFile = await validateFile(acceptedFiles[0], format);
    onFileChange(validatedFile);
    setIsValidating(false);
  }, [onFileChange, format]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    multiple: false,
    maxFiles: 1
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-jumper-text">{title}</h3>
        <span className="text-sm text-gray-500">{dimensions}</span>
      </div>

      {/* Upload Zone or File Display */}
      {!file ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-jumper-blue bg-blue-50'
              : 'border-gray-300 hover:border-jumper-blue hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-3">
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-jumper-text">
                {isDragActive ? 'Solte o arquivo aqui' : 'Clique ou arraste uma imagem/vídeo'}
              </p>
              <p className="text-xs text-gray-600 mt-1">
                JPG, PNG, MP4, MOV • {dimensions} • Máx: 30MB (imagens) / 4GB (vídeos)
              </p>
              {placeholder && (
                <p className="text-xs text-gray-500 mt-1">{placeholder}</p>
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

                {file.preview && (
                  <div className="flex-shrink-0">
                    <img 
                      src={file.preview} 
                      alt="Preview" 
                      className="w-12 h-12 object-cover rounded border"
                    />
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
      )}

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
    </div>
  );
};

export default SingleFileUploadSection;
