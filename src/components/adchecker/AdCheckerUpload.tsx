import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Video } from 'lucide-react';
import { JumperButton } from '@/components/ui/jumper-button';
import { ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';

interface AdCheckerUploadProps {
  selectedFormat: 'vertical' | 'carousel-1:1' | 'carousel-4:5';
  validatedFile: ValidatedFile | null;
  isValidating: boolean;
  onFileValidated: (file: ValidatedFile | null) => void;
  onValidatingChange: (isValidating: boolean) => void;
}

const AdCheckerUpload: React.FC<AdCheckerUploadProps> = ({
  selectedFormat,
  validatedFile,
  isValidating,
  onFileValidated,
  onValidatingChange,
}) => {
  const handleFileDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      onValidatingChange(true);

      try {
        const validated = await validateFile(file, selectedFormat);
        onFileValidated(validated);
      } catch (error) {
        console.error('Validation error:', error);
        onFileValidated({
          file,
          valid: false,
          errors: ['Erro ao validar arquivo'],
        });
      } finally {
        onValidatingChange(false);
      }
    },
    [selectedFormat, onFileValidated, onValidatingChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: 1,
    disabled: isValidating,
  });

  const handleClear = () => {
    if (validatedFile?.preview) {
      URL.revokeObjectURL(validatedFile.preview);
    }
    onFileValidated(null);
  };

  const getFormatLabel = () => {
    switch (selectedFormat) {
      case 'vertical':
        return '1080x1920 (9:16)';
      case 'carousel-1:1':
        return '1080x1080 (1:1)';
      case 'carousel-4:5':
        return '1080x1350 (4:5)';
      default:
        return '';
    }
  };

  if (validatedFile) {
    const isVideo = validatedFile.file.type.startsWith('video/');

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
          <div className="flex items-center gap-3">
            {isVideo ? (
              <Video className="w-5 h-5 text-muted-foreground" />
            ) : (
              <ImageIcon className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-sm text-foreground truncate max-w-[200px]">
                {validatedFile.file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {validatedFile.dimensions
                  ? `${validatedFile.dimensions.width}x${validatedFile.dimensions.height}px`
                  : 'Carregando dimensões...'}
                {validatedFile.duration && ` • ${validatedFile.duration}s`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {validatedFile.valid ? (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check className="w-4 h-4" />
                Válido
              </span>
            ) : (
              <span className="flex items-center gap-1 text-red-500 text-sm">
                <AlertCircle className="w-4 h-4" />
                Inválido
              </span>
            )}
            <JumperButton
              variant="ghost"
              size="icon"
              onClick={handleClear}
              className="h-8 w-8"
            >
              <X className="w-4 h-4" />
            </JumperButton>
          </div>
        </div>

        {/* Validation Details */}
        <div className="space-y-2">
          {validatedFile.errors.map((error, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 text-sm p-2 rounded ${
                validatedFile.valid
                  ? 'bg-green-500/10 text-green-600'
                  : 'bg-red-500/10 text-red-500'
              }`}
            >
              {validatedFile.valid ? (
                <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              )}
              <span>{error}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`
        border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        transition-all duration-200
        ${isDragActive
          ? 'border-jumper-orange bg-jumper-orange/5'
          : 'border-border hover:border-jumper-orange/50 hover:bg-card/50'
        }
        ${isValidating ? 'opacity-50 cursor-not-allowed' : ''}
      `}
    >
      <input {...getInputProps()} />

      <div className="flex flex-col items-center gap-4">
        {isValidating ? (
          <>
            <div className="w-12 h-12 rounded-full bg-jumper-orange/10 flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-jumper-orange border-t-transparent" />
            </div>
            <p className="text-sm text-muted-foreground">Validando arquivo...</p>
          </>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">
                {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para enviar'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG, MP4 ou MOV • Dimensões: {getFormatLabel()}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdCheckerUpload;
