import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle, ExternalLink, Smartphone, Square, RectangleHorizontal, RectangleVertical, Image as ImageIcon, Video } from 'lucide-react';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { JumperCard } from '@/components/ui/jumper-card';
import { JumperButton } from '@/components/ui/jumper-button';
import MetaZoneOverlay from '@/components/MetaZoneOverlay';
import { ValidatedFile } from '@/types/creative';
import { validateFileType, validateFileSize } from '@/utils/fileValidation';

type DetectedFormat = 'vertical' | 'square' | 'horizontal' | 'feed-4:5' | 'unknown';

interface FormatInfo {
  label: string;
  description: string;
  icon: React.ReactNode;
  aspectRatio: string;
}

const FORMAT_INFO: Record<DetectedFormat, FormatInfo> = {
  vertical: {
    label: 'Stories / Reels',
    description: 'Formato vertical 9:16',
    icon: <Smartphone className="w-5 h-5" />,
    aspectRatio: 'aspect-[9/16]',
  },
  square: {
    label: 'Feed Quadrado',
    description: 'Formato 1:1',
    icon: <Square className="w-5 h-5" />,
    aspectRatio: 'aspect-square',
  },
  'feed-4:5': {
    label: 'Feed Vertical',
    description: 'Formato 4:5',
    icon: <RectangleVertical className="w-5 h-5" />,
    aspectRatio: 'aspect-[4/5]',
  },
  horizontal: {
    label: 'Feed Horizontal',
    description: 'Formato 1.91:1',
    icon: <RectangleHorizontal className="w-5 h-5" />,
    aspectRatio: 'aspect-[1.91/1]',
  },
  unknown: {
    label: 'Formato Desconhecido',
    description: 'Proporção não reconhecida',
    icon: <ImageIcon className="w-5 h-5" />,
    aspectRatio: 'aspect-square',
  },
};

// Detect format based on aspect ratio
function detectFormat(width: number, height: number): DetectedFormat {
  const ratio = width / height;

  // 9:16 vertical (Stories/Reels) - ratio ~0.5625
  if (Math.abs(ratio - 0.5625) < 0.05) {
    return 'vertical';
  }

  // 1:1 square - ratio = 1.0
  if (Math.abs(ratio - 1.0) < 0.05) {
    return 'square';
  }

  // 4:5 vertical feed - ratio = 0.8
  if (Math.abs(ratio - 0.8) < 0.05) {
    return 'feed-4:5';
  }

  // 1.91:1 horizontal - ratio ~1.91
  if (Math.abs(ratio - 1.91) < 0.1) {
    return 'horizontal';
  }

  return 'unknown';
}

// Get overlay props based on detected format
function getOverlayProps(format: DetectedFormat) {
  switch (format) {
    case 'vertical':
      return { format: 'vertical' as const, carouselMode: false };
    case 'square':
      return { format: 'square' as const, carouselMode: true, carouselAspectRatio: '1:1' as const };
    case 'feed-4:5':
      return { format: 'vertical' as const, carouselMode: true, carouselAspectRatio: '4:5' as const };
    case 'horizontal':
      return { format: 'horizontal' as const, carouselMode: false };
    default:
      return null;
  }
}

const AdChecker: React.FC = () => {
  const [validatedFile, setValidatedFile] = useState<ValidatedFile | null>(null);
  const [detectedFormat, setDetectedFormat] = useState<DetectedFormat | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validateAndDetectFormat = useCallback(async (file: File): Promise<{ validated: ValidatedFile; format: DetectedFormat }> => {
    return new Promise((resolve) => {
      const errors: string[] = [];
      let valid = true;

      // Validate file type
      const typeValidation = validateFileType(file);
      if (!typeValidation.valid) {
        errors.push(typeValidation.message);
        valid = false;
      }

      // Validate file size
      const isVideo = file.type.startsWith('video/');
      const sizeValidation = validateFileSize(file, isVideo);
      if (!sizeValidation.valid) {
        errors.push(sizeValidation.message);
        valid = false;
      }

      // Get dimensions and detect format
      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          const width = video.videoWidth;
          const height = video.videoHeight;
          const duration = Math.round(video.duration);
          const format = detectFormat(width, height);

          URL.revokeObjectURL(video.src);

          if (valid) {
            errors.push(`Dimensões: ${width}x${height}px • Duração: ${duration}s`);
          }

          resolve({
            validated: {
              file,
              valid,
              dimensions: { width, height },
              duration,
              errors: errors.length > 0 ? errors : ['Arquivo válido'],
              preview: URL.createObjectURL(file),
            },
            format,
          });
        };
        video.onerror = () => {
          URL.revokeObjectURL(video.src);
          resolve({
            validated: {
              file,
              valid: false,
              errors: ['Erro ao carregar vídeo'],
            },
            format: 'unknown',
          });
        };
        video.src = URL.createObjectURL(file);
      } else {
        const img = new Image();
        img.onload = () => {
          const width = img.width;
          const height = img.height;
          const format = detectFormat(width, height);

          URL.revokeObjectURL(img.src);

          if (valid) {
            errors.push(`Dimensões: ${width}x${height}px`);
          }

          resolve({
            validated: {
              file,
              valid,
              dimensions: { width, height },
              errors: errors.length > 0 ? errors : ['Arquivo válido'],
              preview: URL.createObjectURL(file),
            },
            format,
          });
        };
        img.onerror = () => {
          URL.revokeObjectURL(img.src);
          resolve({
            validated: {
              file,
              valid: false,
              errors: ['Erro ao carregar imagem'],
            },
            format: 'unknown',
          });
        };
        img.src = URL.createObjectURL(file);
      }
    });
  }, []);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setIsValidating(true);

    try {
      const { validated, format } = await validateAndDetectFormat(file);
      setValidatedFile(validated);
      setDetectedFormat(format);
    } catch (error) {
      console.error('Validation error:', error);
      setValidatedFile({
        file,
        valid: false,
        errors: ['Erro ao processar arquivo'],
      });
      setDetectedFormat('unknown');
    } finally {
      setIsValidating(false);
    }
  }, [validateAndDetectFormat]);

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
    setValidatedFile(null);
    setDetectedFormat(null);
  };

  const formatInfo = detectedFormat ? FORMAT_INFO[detectedFormat] : null;
  const overlayProps = detectedFormat ? getOverlayProps(detectedFormat) : null;

  return (
    <JumperBackground overlay={false} className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <JumperLogo size="lg" className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">
            Ad Checker
          </h1>
          <p className="text-muted-foreground text-center mt-2 max-w-lg">
            Verifique se suas artes respeitam as zonas seguras do Meta Ads
          </p>
        </header>

        {/* Upload Section */}
        {!validatedFile && (
          <section className="mb-8">
            <JumperCard className="p-6">
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
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
                      <div className="w-16 h-16 rounded-full bg-jumper-orange/10 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-jumper-orange border-t-transparent" />
                      </div>
                      <p className="text-muted-foreground">Analisando arquivo...</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-lg">
                          {isDragActive ? 'Solte o arquivo aqui' : 'Arraste ou clique para enviar'}
                        </p>
                        <p className="text-sm text-muted-foreground mt-2">
                          JPG, PNG, MP4 ou MOV
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          O formato será detectado automaticamente
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </JumperCard>
          </section>
        )}

        {/* Results Section */}
        {validatedFile && formatInfo && (
          <section className="mb-8">
            {/* Detected Format Badge */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  detectedFormat === 'unknown' ? 'bg-yellow-500/20 text-yellow-600' : 'bg-jumper-orange/20 text-jumper-orange'
                }`}>
                  {formatInfo.icon}
                </div>
                <div>
                  <p className="font-medium text-foreground">{formatInfo.label}</p>
                  <p className="text-sm text-muted-foreground">{formatInfo.description}</p>
                </div>
              </div>
              <JumperButton variant="ghost" size="sm" onClick={handleClear}>
                <X className="w-4 h-4 mr-1" />
                Trocar arquivo
              </JumperButton>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <JumperCard className="p-4">
                <div className="flex justify-center">
                  <div className={`relative w-full max-w-[320px] ${formatInfo.aspectRatio} bg-black rounded-lg overflow-hidden`}>
                    {validatedFile.preview && overlayProps ? (
                      <MetaZoneOverlay
                        imageUrl={validatedFile.preview}
                        format={overlayProps.format}
                        file={validatedFile.file}
                        carouselMode={overlayProps.carouselMode}
                        carouselAspectRatio={overlayProps.carouselAspectRatio}
                        size="lightbox"
                        expanded={true}
                      />
                    ) : validatedFile.preview ? (
                      validatedFile.file.type.startsWith('video/') ? (
                        <video
                          src={validatedFile.preview}
                          className="w-full h-full object-contain"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={validatedFile.preview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )
                    ) : null}
                  </div>
                </div>

                {detectedFormat !== 'unknown' && (
                  <div className="mt-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      <span className="inline-block w-3 h-3 bg-red-500/40 rounded mr-1" />
                      Vermelho = Zona de perigo
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="inline-block w-3 h-3 bg-green-500/40 rounded mr-1 border border-green-500 border-dashed" />
                      Verde = Zona segura
                    </p>
                  </div>
                )}
              </JumperCard>

              {/* Validation Results */}
              <JumperCard className="p-6">
                <h3 className="font-medium text-foreground mb-4">
                  Detalhes do Arquivo
                </h3>

                {/* File Info */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Arquivo</span>
                    <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                      {validatedFile.file.name}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Dimensões</span>
                    <span className="text-sm font-medium text-foreground">
                      {validatedFile.dimensions
                        ? `${validatedFile.dimensions.width}x${validatedFile.dimensions.height}px`
                        : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Tipo</span>
                    <span className="text-sm font-medium text-foreground">
                      {validatedFile.file.type.startsWith('video/') ? (
                        <span className="flex items-center gap-1">
                          <Video className="w-4 h-4" /> Vídeo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-4 h-4" /> Imagem
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Tamanho</span>
                    <span className="text-sm font-medium text-foreground">
                      {(validatedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                    </span>
                  </div>
                  {validatedFile.duration && (
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Duração</span>
                      <span className="text-sm font-medium text-foreground">
                        {validatedFile.duration}s
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-sm text-muted-foreground">Formato Detectado</span>
                    <span className={`text-sm font-medium ${detectedFormat === 'unknown' ? 'text-yellow-600' : 'text-foreground'}`}>
                      {formatInfo.label}
                    </span>
                  </div>
                </div>

                {/* Status */}
                {detectedFormat === 'unknown' ? (
                  <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                      <span className="font-medium text-yellow-600">
                        Formato não reconhecido
                      </span>
                    </div>
                    <p className="text-sm text-yellow-600">
                      Use proporções padrão: 9:16 (Stories), 1:1 (Feed), 4:5 (Feed) ou 1.91:1 (Horizontal)
                    </p>
                  </div>
                ) : (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-5 h-5 text-green-500" />
                      <span className="font-medium text-green-500">
                        Formato reconhecido
                      </span>
                    </div>
                    <p className="text-sm text-green-600">
                      Mantenha o conteúdo importante dentro da zona verde para garantir visibilidade.
                    </p>
                  </div>
                )}
              </JumperCard>
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm">
            Ferramenta gratuita da{' '}
            <a
              href="https://jumper.studio"
              target="_blank"
              rel="noopener noreferrer"
              className="text-jumper-orange hover:underline inline-flex items-center gap-1"
            >
              Jumper Studio
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
          <p className="text-muted-foreground/60 text-xs mt-2">
            Zonas seguras baseadas nas especificações oficiais do Meta Ads
          </p>
        </footer>
      </div>
    </JumperBackground>
  );
};

export default AdChecker;
