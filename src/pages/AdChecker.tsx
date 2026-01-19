import React, { useState, useMemo } from 'react';
import { Smartphone, Square, RectangleVertical, Check, AlertCircle, ExternalLink } from 'lucide-react';
import { JumperBackground } from '@/components/ui/jumper-background';
import { JumperLogo } from '@/components/ui/jumper-logo';
import { JumperCard } from '@/components/ui/jumper-card';
import MetaZoneOverlay from '@/components/MetaZoneOverlay';
import AdCheckerUpload from '@/components/adchecker/AdCheckerUpload';
import { ValidatedFile } from '@/types/creative';

type AdFormat = 'vertical' | 'carousel-1:1' | 'carousel-4:5';

interface FormatOption {
  id: AdFormat;
  label: string;
  description: string;
  dimensions: string;
  icon: React.ReactNode;
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    id: 'vertical',
    label: 'Stories / Reels',
    description: 'Formato vertical para Stories e Reels',
    dimensions: '1080x1920 (9:16)',
    icon: <Smartphone className="w-6 h-6" />,
  },
  {
    id: 'carousel-1:1',
    label: 'Carousel 1:1',
    description: 'Formato quadrado para carrossel no Feed',
    dimensions: '1080x1080 (1:1)',
    icon: <Square className="w-6 h-6" />,
  },
  {
    id: 'carousel-4:5',
    label: 'Carousel 4:5',
    description: 'Formato vertical para carrossel no Feed',
    dimensions: '1080x1350 (4:5)',
    icon: <RectangleVertical className="w-6 h-6" />,
  },
];

const AdChecker: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<AdFormat | null>(null);
  const [validatedFile, setValidatedFile] = useState<ValidatedFile | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Get overlay props based on selected format
  const overlayProps = useMemo(() => {
    if (!selectedFormat) return null;

    switch (selectedFormat) {
      case 'vertical':
        return {
          format: 'vertical' as const,
          carouselMode: false,
        };
      case 'carousel-1:1':
        return {
          format: 'square' as const,
          carouselMode: true,
          carouselAspectRatio: '1:1' as const,
        };
      case 'carousel-4:5':
        return {
          format: 'vertical' as const,
          carouselMode: true,
          carouselAspectRatio: '4:5' as const,
        };
      default:
        return null;
    }
  }, [selectedFormat]);

  // Get preview aspect ratio based on format
  const getPreviewAspectRatio = () => {
    switch (selectedFormat) {
      case 'vertical':
        return 'aspect-[9/16]';
      case 'carousel-1:1':
        return 'aspect-square';
      case 'carousel-4:5':
        return 'aspect-[4/5]';
      default:
        return 'aspect-square';
    }
  };

  const handleFormatSelect = (format: AdFormat) => {
    // Clear file when changing format
    if (validatedFile?.preview) {
      URL.revokeObjectURL(validatedFile.preview);
    }
    setValidatedFile(null);
    setSelectedFormat(format);
  };

  return (
    <JumperBackground overlay={false} className="min-h-screen">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
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

        {/* Format Selection */}
        <section className="mb-8">
          <h2 className="text-lg font-medium text-foreground mb-4">
            1. Selecione o formato
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FORMAT_OPTIONS.map((option) => (
              <JumperCard
                key={option.id}
                selected={selectedFormat === option.id}
                className="p-4 cursor-pointer"
                onClick={() => handleFormatSelect(option.id)}
              >
                <div className="flex flex-col items-center text-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                      selectedFormat === option.id
                        ? 'bg-jumper-orange text-white'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {option.icon}
                  </div>
                  <h3 className="font-medium text-foreground">{option.label}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {option.description}
                  </p>
                  <span className="text-xs text-muted-foreground mt-2 font-mono">
                    {option.dimensions}
                  </span>
                </div>
              </JumperCard>
            ))}
          </div>
        </section>

        {/* Upload Section - Only show when format is selected */}
        {selectedFormat && (
          <section className="mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4">
              2. Faça upload da sua arte
            </h2>
            <JumperCard className="p-6">
              <AdCheckerUpload
                selectedFormat={selectedFormat}
                validatedFile={validatedFile}
                isValidating={isValidating}
                onFileValidated={setValidatedFile}
                onValidatingChange={setIsValidating}
              />
            </JumperCard>
          </section>
        )}

        {/* Preview Section - Only show when file is validated */}
        {validatedFile && validatedFile.preview && overlayProps && (
          <section className="mb-8">
            <h2 className="text-lg font-medium text-foreground mb-4">
              3. Preview com zonas seguras
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Preview */}
              <JumperCard className="p-4">
                <div className="flex justify-center">
                  <div
                    className={`relative w-full max-w-[320px] ${getPreviewAspectRatio()} bg-black rounded-lg overflow-hidden`}
                  >
                    <MetaZoneOverlay
                      imageUrl={validatedFile.preview}
                      format={overlayProps.format}
                      file={validatedFile.file}
                      carouselMode={overlayProps.carouselMode}
                      carouselAspectRatio={overlayProps.carouselAspectRatio}
                      size="lightbox"
                      expanded={true}
                    />
                  </div>
                </div>
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
              </JumperCard>

              {/* Validation Results */}
              <JumperCard className="p-6">
                <h3 className="font-medium text-foreground mb-4">
                  Resultado da Validação
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
                      {validatedFile.file.type}
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
                </div>

                {/* Validation Status */}
                <div
                  className={`p-4 rounded-lg ${
                    validatedFile.valid
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {validatedFile.valid ? (
                      <>
                        <Check className="w-5 h-5 text-green-500" />
                        <span className="font-medium text-green-500">
                          Arte aprovada
                        </span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="font-medium text-red-500">
                          Arte precisa de ajustes
                        </span>
                      </>
                    )}
                  </div>
                  <ul className="space-y-1">
                    {validatedFile.errors.map((error, index) => (
                      <li
                        key={index}
                        className={`text-sm ${
                          validatedFile.valid
                            ? 'text-green-600'
                            : 'text-red-500'
                        }`}
                      >
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
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
