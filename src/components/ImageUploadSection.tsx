import React, { useCallback, useState } from 'react';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { X, Upload, CheckCircle, AlertCircle, Image } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface ImageUploadSectionProps {
  title: string;
  format: 'square' | 'vertical' | 'horizontal';
  dimensions: string;
  files: ValidatedFile[];
  onFilesChange: (files: ValidatedFile[]) => void;
  placeholder?: string;
}

const ImageUploadSection: React.FC<ImageUploadSectionProps> = ({
  title,
  format,
  dimensions,
  files,
  onFilesChange,
  placeholder
}) => {
  const [isValidating, setIsValidating] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setIsValidating(true);
    const newValidatedFiles: ValidatedFile[] = [];
    
    for (const file of acceptedFiles) {
      const validatedFile = await validateFile(file, format);
      newValidatedFiles.push(validatedFile);
    }
    
    onFilesChange([...files, ...newValidatedFiles]);
    setIsValidating(false);
  }, [files, onFilesChange, format]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    multiple: true
  });

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
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

      {/* Upload Zone */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? 'border-accent-critical bg-accent-critical/10'
            : 'border-accent-border hover:border-accent-critical hover:bg-accent-critical/5'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-3">
          <Upload className="mx-auto h-8 w-8 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-jumper-text">
              {isDragActive ? 'Solte os arquivos aqui' : 'Clique ou arraste imagens e vídeos'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
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

      {/* Uploaded Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((validatedFile, index) => (
            <Card key={index} className={`${validatedFile.valid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <Image className="h-6 w-6 text-accent-subtle flex-shrink-0" />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-medium text-jumper-text truncate">
                          {validatedFile.file.name}
                        </p>
                        {validatedFile.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                        )}
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {formatFileSize(validatedFile.file.size)}
                        {validatedFile.dimensions && (
                          <span> • {validatedFile.dimensions.width}x{validatedFile.dimensions.height}px</span>
                        )}
                        {validatedFile.duration && (
                          <span> • {validatedFile.duration}s</span>
                        )}
                      </div>
                      
                      {validatedFile.errors.map((error, errorIndex) => (
                        <div 
                          key={errorIndex}
                          className={`text-xs mt-1 ${validatedFile.valid ? 'text-green-600' : 'text-red-600'}`}
                        >
                          {error}
                        </div>
                      ))}
                    </div>

                    {validatedFile.preview && (
                      <div className="flex-shrink-0">
                        <img 
                          src={validatedFile.preview} 
                          alt="Preview" 
                          className="w-12 h-12 object-cover rounded border"
                        />
                      </div>
                    )}
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 ml-2"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploadSection;
