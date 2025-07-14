import React, { useState, useEffect } from 'react';
import { generateThumbnailPreview, getDisplayText } from '@/utils/thumbnailUtils';
import { JumperCard, JumperCardContent } from '@/components/ui/jumper-card';
import { Loader } from 'lucide-react';

interface GradientThumbnailDemoProps {
  format: 'square' | 'vertical' | 'horizontal';
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  className?: string;
}

export const GradientThumbnailDemo: React.FC<GradientThumbnailDemoProps> = ({
  format,
  carouselMode = false,
  carouselAspectRatio = '1:1',
  className = ''
}) => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateThumbnail = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const src = await generateThumbnailPreview(format, carouselMode, carouselAspectRatio);
        setThumbnailSrc(src);
      } catch (err) {
        console.error('Erro ao gerar thumbnail:', err);
        setError('Falha ao carregar');
      } finally {
        setIsLoading(false);
      }
    };

    generateThumbnail();
  }, [format, carouselMode, carouselAspectRatio]);

  const displayText = getDisplayText(format, carouselMode, carouselAspectRatio);
  const formatLabel = carouselMode 
    ? `Carrossel ${carouselAspectRatio}` 
    : format.charAt(0).toUpperCase() + format.slice(1);

  return (
    <div className={`text-center space-y-2 ${className}`}>
      <div className="w-32 h-32 mx-auto border border-border rounded-lg bg-muted/20 flex items-center justify-center overflow-hidden">
        {isLoading ? (
          <Loader className="w-6 h-6 animate-spin text-muted-foreground" />
        ) : error ? (
          <span className="text-xs text-destructive">{error}</span>
        ) : (
          <img 
            src={thumbnailSrc} 
            alt={`${formatLabel} thumbnail`} 
            className="max-w-full max-h-full object-contain"
          />
        )}
      </div>
      <div>
        <p className="font-medium text-sm">{formatLabel}</p>
        <p className="text-xs text-muted-foreground">{displayText}</p>
        {carouselMode && (
          <p className="text-xs text-accent-subtle">Modo Carrossel</p>
        )}
      </div>
    </div>
  );
};