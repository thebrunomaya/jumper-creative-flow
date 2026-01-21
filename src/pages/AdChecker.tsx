import React, { useState, useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check, AlertCircle, ExternalLink, Smartphone, Square, RectangleHorizontal, RectangleVertical, Image as ImageIcon, Video, Trash2, Plus, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
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

function detectFormat(width: number, height: number): DetectedFormat {
  const ratio = width / height;
  if (Math.abs(ratio - 0.5625) < 0.05) return 'vertical';
  if (Math.abs(ratio - 1.0) < 0.05) return 'square';
  if (Math.abs(ratio - 0.8) < 0.05) return 'feed-4:5';
  if (Math.abs(ratio - 1.91) < 0.1) return 'horizontal';
  return 'unknown';
}

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

const AdChecker: React.FC = () => {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreviews, setShowPreviews] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const summary = useMemo(() => {
    const total = files.length;
    const valid = files.filter(f => f.status === 'done' && f.detectedFormat && f.detectedFormat !== 'unknown').length;
    const unknown = files.filter(f => f.status === 'done' && f.detectedFormat === 'unknown').length;
    const errors = files.filter(f => f.status === 'error' || (f.status === 'done' && f.validated && !f.validated.valid)).length;
    const pending = files.filter(f => f.status === 'pending' || f.status === 'processing').length;
    const done = files.filter(f => f.status === 'done').length;
    return { total, valid, unknown, errors, pending, done };
  }, [files]);

  const validateAndDetectFormat = useCallback(async (file: File): Promise<{ validated: ValidatedFile; format: DetectedFormat }> => {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error('Timeout ao processar arquivo'));
      }, PROCESSING_TIMEOUT);

      const errors: string[] = [];
      let valid = true;

      const typeValidation = validateFileType(file);
      if (!typeValidation.valid) {
        errors.push(typeValidation.message);
        valid = false;
      }

      const isVideo = file.type.startsWith('video/');
      const sizeValidation = validateFileSize(file, isVideo);
      if (!sizeValidation.valid) {
        errors.push(sizeValidation.message);
        valid = false;
      }

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
            errors.push(`Dimensões: ${width}x${height}px | Duração: ${duration}s`);
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
          clearTimeout(timeoutId);
          URL.revokeObjectURL(video.src);
          resolve({
            validated: { file, valid: false, errors: ['Erro ao carregar vídeo'] },
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
          clearTimeout(timeoutId);
          URL.revokeObjectURL(img.src);
          resolve({
            validated: { file, valid: false, errors: ['Erro ao carregar imagem'] },
            format: 'unknown',
          });
        };
        img.src = URL.createObjectURL(file);
      }
    });
  }, []);

  const processFiles = useCallback(async (batchFiles: BatchFile[]) => {
    setIsProcessing(true);
    const pendingFiles = batchFiles.filter(f => f.status === 'pending');
    const chunks: BatchFile[][] = [];

    for (let i = 0; i < pendingFiles.length; i += CONCURRENCY_LIMIT) {
      chunks.push(pendingFiles.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const chunk of chunks) {
      setFiles(prev => prev.map(f =>
        chunk.some(c => c.id === f.id) ? { ...f, status: 'processing' as const } : f
      ));

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
    const remainingSlots = MAX_FILES - files.length;
    const filesToAdd = acceptedFiles.slice(0, remainingSlots);
    if (filesToAdd.length === 0) return;

    const newBatchFiles: BatchFile[] = filesToAdd.map(file => ({
      id: crypto.randomUUID(),
      file,
      status: 'pending',
    }));

    setFiles(prev => [...prev, ...newBatchFiles]);
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
    files.forEach(bf => {
      if (bf.validated?.preview) {
        URL.revokeObjectURL(bf.validated.preview);
      }
    });
    setFiles([]);
    setShowPreviews(false);
    setCurrentIndex(0);
  }, [files]);

  const handleRemoveFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.validated?.preview) {
        URL.revokeObjectURL(file.validated.preview);
      }
      return prev.filter(f => f.id !== id);
    });
  }, []);

  const getStatusBadge = (bf: BatchFile) => {
    if (bf.status === 'pending' || bf.status === 'processing') {
      return (
        <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
          <div className="animate-spin rounded-full h-3 w-3 border-2 border-jumper-orange border-t-transparent" />
        </div>
      );
    }
    if (bf.status === 'error' || (bf.validated && !bf.validated.valid)) {
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
          <X className="w-3 h-3 text-white" />
        </div>
      );
    }
    if (bf.detectedFormat === 'unknown') {
      return (
        <div className="w-5 h-5 rounded-full bg-yellow-500 flex items-center justify-center">
          <AlertCircle className="w-3 h-3 text-white" />
        </div>
      );
    }
    return (
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
        <Check className="w-3 h-3 text-white" />
      </div>
    );
  };

  const processedFiles = files.filter(f => f.status === 'done' && f.validated?.preview);
  const currentFile = processedFiles[currentIndex];

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : processedFiles.length - 1));
  }, [processedFiles.length]);

  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev < processedFiles.length - 1 ? prev + 1 : 0));
  }, [processedFiles.length]);

  // Keyboard navigation
  React.useEffect(() => {
    if (!showPreviews) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'Escape') setShowPreviews(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showPreviews, handlePrev, handleNext]);

  const openPreviewsModal = useCallback(() => {
    setCurrentIndex(0);
    setShowPreviews(true);
  }, []);

  return (
    <JumperBackground overlay={false} className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <JumperLogo size="lg" className="mb-4" />
          <h1 className="text-2xl md:text-3xl font-bold text-foreground text-center">
            AdChecker
          </h1>
          <p className="text-muted-foreground text-center mt-2 max-w-lg">
            Verifique se seus criativos estão dentro das zonas seguras do Meta - até {MAX_FILES} arquivos
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
                      {summary.valid}
                    </span>
                  )}
                  {summary.unknown > 0 && (
                    <span className="flex items-center gap-1 text-sm text-yellow-500">
                      <AlertCircle className="w-4 h-4" />
                      {summary.unknown}
                    </span>
                  )}
                  {summary.errors > 0 && (
                    <span className="flex items-center gap-1 text-sm text-red-500">
                      <X className="w-4 h-4" />
                      {summary.errors}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {summary.done > 0 && !isProcessing && (
                    <JumperButton variant="primary" size="sm" onClick={openPreviewsModal}>
                      <Eye className="w-4 h-4 mr-1" />
                      Ver Prévias
                    </JumperButton>
                  )}
                  <JumperButton variant="ghost" size="sm" onClick={handleClearAll} disabled={isProcessing}>
                    <Trash2 className="w-4 h-4 mr-1" />
                    Limpar
                  </JumperButton>
                </div>
              </div>
            </JumperCard>
          </section>
        )}

        {/* Upload Section */}
        <section className="mb-8">
          <JumperCard className="p-6">
            {files.length === 0 ? (
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
                      JPG, PNG, MP4 ou MOV - até {MAX_FILES} arquivos
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div {...getRootProps()} className={isDragActive ? 'ring-2 ring-jumper-orange ring-offset-2 ring-offset-background rounded-lg' : ''}>
                <input {...getInputProps()} />

                {/* File list - simple, no previews */}
                <div className="space-y-2 max-h-[400px] overflow-y-auto">
                  {files.map((bf) => (
                    <div
                      key={bf.id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                    >
                      {/* File type icon */}
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        {bf.file.type.startsWith('video/') ? (
                          <Video className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        )}
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {bf.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {bf.validated?.dimensions
                            ? `${bf.validated.dimensions.width}x${bf.validated.dimensions.height}px`
                            : (bf.file.size / (1024 * 1024)).toFixed(2) + ' MB'
                          }
                          {bf.detectedFormat && bf.detectedFormat !== 'unknown' && (
                            <span className="ml-2">{FORMAT_INFO[bf.detectedFormat].label}</span>
                          )}
                        </p>
                      </div>

                      {/* Status */}
                      {getStatusBadge(bf)}

                      {/* Remove button */}
                      <button
                        className="p-1 rounded hover:bg-muted transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(bf.id);
                        }}
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add more */}
                {files.length < MAX_FILES && (
                  <button
                    className="mt-4 w-full p-3 border-2 border-dashed border-border rounded-lg
                      flex items-center justify-center gap-2 text-muted-foreground
                      hover:border-jumper-orange/50 hover:text-foreground transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isProcessing) open();
                    }}
                    disabled={isProcessing}
                  >
                    <Plus className="w-5 h-5" />
                    Adicionar mais arquivos
                  </button>
                )}
              </div>
            )}
          </JumperCard>
        </section>

        {/* Carousel Previews Modal */}
        {showPreviews && currentFile && (
          <div
            className="fixed inset-0 z-50 bg-black/95 flex flex-col"
            onClick={() => setShowPreviews(false)}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 bg-background/10">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-white bg-white/20 px-3 py-1 rounded-full">
                  {currentIndex + 1} / {processedFiles.length}
                </span>
                {currentFile.detectedFormat && (
                  <span className={`text-sm px-3 py-1 rounded-full ${
                    currentFile.detectedFormat === 'unknown'
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-jumper-orange/20 text-jumper-orange'
                  }`}>
                    {FORMAT_INFO[currentFile.detectedFormat].label}
                  </span>
                )}
              </div>
              <button
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPreviews(false);
                }}
              >
                <X className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Carousel Content */}
            <div
              className="flex-1 flex items-center justify-center p-4 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Previous button */}
              {processedFiles.length > 1 && (
                <button
                  className="absolute left-4 top-1/2 -translate-y-1/2 z-10
                    w-12 h-12 rounded-full bg-white/10 hover:bg-white/20
                    flex items-center justify-center transition-colors"
                  onClick={handlePrev}
                >
                  <ChevronLeft className="w-8 h-8 text-white" />
                </button>
              )}

              {/* Preview */}
              <div className="max-w-4xl w-full">
                {(() => {
                  const formatInfo = currentFile.detectedFormat ? FORMAT_INFO[currentFile.detectedFormat] : null;
                  const overlayProps = currentFile.detectedFormat ? getOverlayProps(currentFile.detectedFormat) : null;

                  return (
                    <div className="bg-background rounded-xl overflow-hidden">
                      {/* Header */}
                      <div className="p-4 border-b border-border flex items-center gap-3">
                        {formatInfo && (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            currentFile.detectedFormat === 'unknown'
                              ? 'bg-yellow-500/20 text-yellow-600'
                              : 'bg-jumper-orange/20 text-jumper-orange'
                          }`}>
                            {formatInfo.icon}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {currentFile.file.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatInfo?.label} - {formatInfo?.description}
                          </p>
                        </div>
                      </div>

                      {/* Content - Preview + Details as centered block */}
                      <div className="p-4 flex justify-center">
                        <div className="flex flex-col lg:flex-row gap-10 items-center lg:items-start">
                          {/* Preview image */}
                          <div className={`relative w-full max-w-[320px] ${formatInfo?.aspectRatio || 'aspect-square'} bg-black rounded-lg overflow-hidden flex-shrink-0`}>
                            {currentFile.validated?.preview && overlayProps ? (
                              <MetaZoneOverlay
                                imageUrl={currentFile.validated.preview}
                                format={overlayProps.format}
                                file={currentFile.file}
                                carouselMode={overlayProps.carouselMode}
                                carouselAspectRatio={overlayProps.carouselAspectRatio}
                                size="lightbox"
                                expanded={true}
                              />
                            ) : currentFile.validated?.preview ? (
                              currentFile.file.type.startsWith('video/') ? (
                                <video
                                  src={currentFile.validated.preview}
                                  className="w-full h-full object-contain"
                                  controls
                                  muted
                                />
                              ) : (
                                <img
                                  src={currentFile.validated.preview}
                                  alt="Preview"
                                  className="w-full h-full object-contain"
                                />
                              )
                            ) : null}
                          </div>

                          {/* File Details */}
                          <div className="w-full max-w-sm">
                            <h3 className="font-medium text-foreground mb-4">
                              Detalhes do Arquivo
                            </h3>

                            <div className="space-y-3 mb-6">
                              <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">Dimensões</span>
                                <span className="text-sm font-medium text-foreground">
                                  {currentFile.validated?.dimensions
                                    ? `${currentFile.validated.dimensions.width}x${currentFile.validated.dimensions.height}px`
                                    : '-'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-border">
                                <span className="text-sm text-muted-foreground">Tipo</span>
                                <span className="text-sm font-medium text-foreground">
                                  {currentFile.file.type.startsWith('video/') ? (
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
                                  {(currentFile.file.size / (1024 * 1024)).toFixed(2)} MB
                                </span>
                              </div>
                              {currentFile.validated?.duration && (
                                <div className="flex justify-between items-center py-2 border-b border-border">
                                  <span className="text-sm text-muted-foreground">Duração</span>
                                  <span className="text-sm font-medium text-foreground">
                                    {currentFile.validated.duration}s
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Status */}
                            {currentFile.detectedFormat === 'unknown' ? (
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

                            {/* Legend */}
                            {currentFile.detectedFormat !== 'unknown' && (
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
                  );
                })()}
              </div>

              {/* Next button */}
              {processedFiles.length > 1 && (
                <button
                  className="absolute right-4 top-1/2 -translate-y-1/2 z-10
                    w-12 h-12 rounded-full bg-white/10 hover:bg-white/20
                    flex items-center justify-center transition-colors"
                  onClick={handleNext}
                >
                  <ChevronRight className="w-8 h-8 text-white" />
                </button>
              )}
            </div>

            {/* Thumbnail navigation */}
            {processedFiles.length > 1 && (
              <div className="p-4 bg-background/10">
                <div className="flex justify-center gap-2 overflow-x-auto max-w-full pb-2">
                  {processedFiles.map((bf, index) => (
                    <button
                      key={bf.id}
                      className={`w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                        index === currentIndex
                          ? 'border-jumper-orange ring-2 ring-jumper-orange/30'
                          : 'border-transparent hover:border-white/30'
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentIndex(index);
                      }}
                    >
                      {bf.validated?.preview && (
                        bf.file.type.startsWith('video/') ? (
                          <video
                            src={bf.validated.preview}
                            className="w-full h-full object-cover"
                            muted
                          />
                        ) : (
                          <img
                            src={bf.validated.preview}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        )
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-center text-xs text-white/50 mt-2">
                  Use as setas ← → para navegar
                </p>
              </div>
            )}
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
        </footer>
      </div>
    </JumperBackground>
  );
};

export default AdChecker;
