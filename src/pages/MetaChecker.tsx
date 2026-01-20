import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle, ExternalLink, Smartphone, Square, RectangleHorizontal, RectangleVertical, Image as ImageIcon, Video, Trash2, Plus } from 'lucide-react';
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

interface BatchFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'done' | 'error';
  validated?: ValidatedFile;
  detectedFormat?: DetectedFormat;
}

const MAX_FILES = 50;
const CONCURRENCY_LIMIT = 5;
const PROCESSING_TIMEOUT = 30000;

const MetaChecker: React.FC = () => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<BatchFile | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Summary stats
  const summary = useMemo(() => {
    const total = files.length;
    const valid = files.filter(f => f.status === 'done' && f.detectedFormat && f.detectedFormat !== 'unknown').length;
    const unknown = files.filter(f => f.status === 'done' && f.detectedFormat === 'unknown').length;
    const errors = files.filter(f => f.status === 'error' || (f.status === 'done' && f.validated && !f.validated.valid)).length;
    const pending = files.filter(f => f.status === 'pending' || f.status === 'processing').length;
    return { total, valid, unknown, errors, pending };
  }, [files]);

  const validateAndDetectFormat = useCallback(async (file: File): Promise<{ validated: ValidatedFile; format: DetectedFormat }> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout ao processar arquivo'));
      }, PROCESSING_TIMEOUT);

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
          clearTimeout(timeoutId);
          const width = video.videoWidth;
          const height = video.videoHeight;
          const duration = Math.round(video.duration);
          const format = detectFormat(width, height);

          URL.revokeObjectURL(video.src);

          if (valid) {
            errors.push(`Dimensoes: ${width}x${height}px | Duracao: ${duration}s`);
          }

          resolve({
            validated: {
              file,
              valid,
              dimensions: { width, height },
              duration,
              errors: errors.length > 0 ? errors : ['Arquivo valido'],
              preview: URL.createObjectURL(file),
            },
            format,
          });
        };
        video.onerror = () => {
          clearTimeout(timeoutId);
          URL.revokeObjectURL(video.src);
          resolve({
            validated: {
              file,
              valid: false,
              errors: ['Erro ao carregar video'],
            },
            format: 'unknown',
          });
        };
        video.src = URL.createObjectURL(file);
      } else {
        const img = new Image();
        img.onload = () => {
          clearTimeout(timeoutId);
          const width = img.width;
          const height = img.height;
          const format = detectFormat(width, height);

          URL.revokeObjectURL(img.src);

          if (valid) {
            errors.push(`Dimensoes: ${width}x${height}px`);
          }

          resolve({
            validated: {
              file,
              valid,
              dimensions: { width, height },
              errors: errors.length > 0 ? errors : ['Arquivo valido'],
              preview: URL.createObjectURL(file),
            },
            format,
          });
        };
        img.onerror = () => {
          clearTimeout(timeoutId);
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

  // Process files with concurrency limit
  const processFiles = useCallback(async (batchFiles: BatchFile[]) => {
    setIsProcessing(true);

    const pendingFiles = batchFiles.filter(f => f.status === 'pending');
    const chunks: BatchFile[][] = [];

    for (let i = 0; i < pendingFiles.length; i += CONCURRENCY_LIMIT) {
      chunks.push(pendingFiles.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      // Mark chunk as processing
      setFiles(prev => prev.map(f =>
        chunk.some(c => c.id === f.id) ? { ...f, status: 'processing' as const } : f
      ));

      // Process chunk in parallel
      const results = await Promise.allSettled(
        chunk.map(async (bf) => {
          try {
            const { validated, format } = await validateAndDetectFormat(bf.file);
            return { id: bf.id, validated, format, status: 'done' as const };
          } catch {
            return { id: bf.id, status: 'error' as const };
          }
        })
      );

      // Update state with results
      setFiles(prev => prev.map(f => {
        const result = results.find((r, idx) =>
          r.status === 'fulfilled' && chunk[idx]?.id === f.id
        );
        if (result && result.status === 'fulfilled') {
          const value = result.value;
          if (value.status === 'done') {
            return { ...f, status: 'done', validated: value.validated, detectedFormat: value.format };
          }
          return { ...f, status: 'error' };
        }
        const errorResult = results.find((r, idx) =>
          r.status === 'rejected' && chunk[idx]?.id === f.id
        );
        if (errorResult) {
          return { ...f, status: 'error' };
        }
        return f;
      }));
    }

    setIsProcessing(false);
  }, [validateAndDetectFormat]);

  const handleFileDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    // Limit total files
    const remainingSlots = MAX_FILES - files.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);

    if (filesToAdd.length === 0) return;

    // Create batch file entries
    const newBatchFiles: BatchFile[] = filesToAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newBatchFiles]);

    // Start processing
    processFiles([...files, ...newBatchFiles]);
  }, [files, processFiles]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop: handleFileDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'video/mp4': ['.mp4'],
      'video/quicktime': ['.mov'],
    },
    maxFiles: MAX_FILES,
    disabled: isProcessing,
    noClick: files.length > 0,
    noKeyboard: files.length > 0,
  });

  const handleClearAll = useCallback(() => {
    // Revoke all preview URLs
    files.forEach(bf => {
      if (bf.validated?.preview) {
        URL.revokeObjectURL(bf.validated.preview);
      }
    });
    setFiles([]);
    setSelectedFile(null);
  }, [files]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.validated?.preview) {
        URL.revokeObjectURL(file.validated.preview);
      }
      return prev.filter(f => f.id !== id);
    });
    if (selectedFile?.id === id) {
      setSelectedFile(null);
    }
  }, [selectedFile]);

  const getStatusBadge = (bf: BatchFile) => {
    if (bf.status === 'pending' || bf.status === 'processing') {
      return (
        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-jumper-orange border-t-transparent" />
        </div>
      );
    }
    if (bf.status === 'error' || (bf.validated && !bf.validated.valid)) {
      return (
        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
          <X className="w-4 h-4 text-white" />
        </div>
      );
    }
    if (bf.detectedFormat === 'unknown') {
      return (
        <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
      );
    }
    return (
      <div className="absolute top-1 right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-4 h-4 text-white" />
      </div>
    );
  };

  const selectedFormatInfo = selectedFile?.detectedFormat ? FORMAT_INFO[selectedFile.detectedFormat] : null;
  const selectedOverlayProps = selectedFile?.detectedFormat ? getOverlayProps(selectedFile.detectedFormat) : null;

  return (
    <JumperBackground overlay={false} className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <JumperLogo size="lg" className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">
            MetaChecker
          </h1>
          <p className="text-muted-foreground text-center mt-2 max-w-lg">
            Verifique multiplas artes de uma vez - ate {MAX_FILES} arquivos
          </p>
        </header>

        {/* Summary Card */}
        {files.length > 0 && (
          <section className="mb-6">
            <JumperCard className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-medium text-foreground">
                    {summary.total} arquivo{summary.total !== 1 ? 's' : ''}
                  </span>
                  {summary.pending > 0 && (
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-jumper-orange border-t-transparent" />
                      {summary.pending} processando
                    </span>
                  )}
                  {summary.valid > 0 && (
                    <span className="flex items-center gap-1 text-sm text-green-500">
                      <Check className="w-4 h-4" />
                      {summary.valid} valido{summary.valid !== 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.unknown > 0 && (
                    <span className="flex items-center gap-1 text-sm text-yellow-500">
                      <AlertCircle className="w-4 h-4" />
                      {summary.unknown} desconhecido{summary.unknown !== 1 ? 's' : ''}
                    </span>
                  )}
                  {summary.errors > 0 && (
                    <span className="flex items-center gap-1 text-sm text-red-500">
                      <X className="w-4 h-4" />
                      {summary.errors} erro{summary.errors !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <JumperButton variant="ghost" size="sm" onClick={handleClearAll} disabled={isProcessing}>
                  <Trash2 className="w-4 h-4 mr-1" />
                  Limpar tudo
                </JumperButton>
              </div>
            </JumperCard>
          </section>
        )}

        {/* Upload Section / Grid */}
        <section className="mb-8">
          <JumperCard className="p-6">
            {files.length === 0 ? (
              // Empty state - full dropzone
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-12 text-center cursor-pointer
                  transition-all duration-200
                  ${isDragActive
                    ? 'border-jumper-orange bg-jumper-orange/5'
                    : 'border-border hover:border-jumper-orange/50 hover:bg-card/50'
                  }
                `}
              >
                <input {...getInputProps()} />

                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-lg">
                      {isDragActive ? 'Solte os arquivos aqui' : 'Arraste ou clique para enviar'}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      JPG, PNG, MP4 ou MOV - ate {MAX_FILES} arquivos
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      O formato de cada arquivo sera detectado automaticamente
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              // Grid with files
              <div {...getRootProps()} className={`
                ${isDragActive ? 'ring-2 ring-jumper-orange ring-offset-2 ring-offset-background rounded-lg' : ''}
              `}>
                <input {...getInputProps()} />
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-3">
                  {files.map((bf) => (
                    <div
                      key={bf.id}
                      className={`
                        relative aspect-square rounded-lg overflow-hidden cursor-pointer
                        border-2 transition-all duration-200
                        ${selectedFile?.id === bf.id
                          ? 'border-jumper-orange ring-2 ring-jumper-orange/30'
                          : 'border-border hover:border-jumper-orange/50'
                        }
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (bf.status === 'done') {
                          setSelectedFile(bf);
                        }
                      }}
                      title={`${bf.file.name}${bf.validated?.dimensions ? ` - ${bf.validated.dimensions.width}x${bf.validated.dimensions.height}px` : ''}`}
                    >
                      {/* Thumbnail */}
                      {bf.validated?.preview ? (
                        bf.file.type.startsWith('video/') ? (
                          <video
                            src={bf.validated.preview}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={bf.validated.preview}
                            alt={bf.file.name}
                            className="w-full h-full object-cover"
                          />
                        )
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          {bf.file.type.startsWith('video/') ? (
                            <Video className="w-6 h-6 text-muted-foreground" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          )}
                        </div>
                      )}

                      {/* Status Badge */}
                      {getStatusBadge(bf)}

                      {/* Remove button on hover */}
                      <button
                        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(bf.id);
                        }}
                        title="Remover"
                      >
                        <X className="w-4 h-4 text-foreground" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button */}
                  {files.length < MAX_FILES && (
                    <button
                      className={`
                        aspect-square rounded-lg border-2 border-dashed border-border
                        flex flex-col items-center justify-center gap-1
                        hover:border-jumper-orange/50 hover:bg-card/50 transition-all
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isProcessing) {
                          open();
                        }
                      }}
                      disabled={isProcessing}
                    >
                      <Plus className="w-6 h-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Adicionar</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </JumperCard>
        </section>

        {/* Modal/Lightbox for selected file */}
        {selectedFile && selectedFile.validated && (
          <div
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={() => setSelectedFile(null)}
          >
            <div
              className="bg-background rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  {selectedFormatInfo && (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedFile.detectedFormat === 'unknown'
                        ? 'bg-yellow-500/20 text-yellow-600'
                        : 'bg-jumper-orange/20 text-jumper-orange'
                    }`}>
                      {selectedFormatInfo.icon}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-foreground truncate max-w-[300px]">
                      {selectedFile.file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedFormatInfo?.label} - {selectedFormatInfo?.description}
                    </p>
                  </div>
                </div>
                <JumperButton variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                  <X className="w-5 h-5" />
                </JumperButton>
              </div>

              {/* Modal Content */}
              <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Preview */}
                <div className="flex justify-center">
                  <div className={`relative w-full max-w-[320px] ${selectedFormatInfo?.aspectRatio || 'aspect-square'} bg-black rounded-lg overflow-hidden`}>
                    {selectedFile.validated.preview && selectedOverlayProps ? (
                      <MetaZoneOverlay
                        imageUrl={selectedFile.validated.preview}
                        format={selectedOverlayProps.format}
                        file={selectedFile.file}
                        carouselMode={selectedOverlayProps.carouselMode}
                        carouselAspectRatio={selectedOverlayProps.carouselAspectRatio}
                        size="lightbox"
                        expanded={true}
                      />
                    ) : selectedFile.validated.preview ? (
                      selectedFile.file.type.startsWith('video/') ? (
                        <video
                          src={selectedFile.validated.preview}
                          className="w-full h-full object-contain"
                          controls
                          muted
                        />
                      ) : (
                        <img
                          src={selectedFile.validated.preview}
                          alt="Preview"
                          className="w-full h-full object-contain"
                        />
                      )
                    ) : null}
                  </div>
                </div>

                {/* File Details */}
                <div>
                  <h3 className="font-medium text-foreground mb-4">
                    Detalhes do Arquivo
                  </h3>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Arquivo</span>
                      <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                        {selectedFile.file.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Dimensoes</span>
                      <span className="text-sm font-medium text-foreground">
                        {selectedFile.validated.dimensions
                          ? `${selectedFile.validated.dimensions.width}x${selectedFile.validated.dimensions.height}px`
                          : '-'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                      <span className="text-sm text-muted-foreground">Tipo</span>
                      <span className="text-sm font-medium text-foreground">
                        {selectedFile.file.type.startsWith('video/') ? (
                          <span className="flex items-center gap-1">
                            <Video className="w-4 h-4" /> Video
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
                        {(selectedFile.file.size / (1024 * 1024)).toFixed(2)} MB
                      </span>
                    </div>
                    {selectedFile.validated.duration && (
                      <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Duracao</span>
                        <span className="text-sm font-medium text-foreground">
                          {selectedFile.validated.duration}s
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Status */}
                  {selectedFile.detectedFormat === 'unknown' ? (
                    <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-yellow-600" />
                        <span className="font-medium text-yellow-600">
                          Formato nao reconhecido
                        </span>
                      </div>
                      <p className="text-sm text-yellow-600">
                        Use proporcoes padrao: 9:16 (Stories), 1:1 (Feed), 4:5 (Feed) ou 1.91:1 (Horizontal)
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
                        Mantenha o conteudo importante dentro da zona verde para garantir visibilidade.
                      </p>
                    </div>
                  )}

                  {/* Legend */}
                  {selectedFile.detectedFormat !== 'unknown' && (
                    <div className="mt-4">
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
                </div>
              </div>
            </div>
          </div>
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
            Zonas seguras baseadas nas especificacoes oficiais do Meta Ads
          </p>
        </footer>
      </div>
    </JumperBackground>
  );
};

export default MetaChecker;
