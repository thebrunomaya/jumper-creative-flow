import React, { useState, useEffect } from 'react';
import { generateThumbnailPreview, getDisplayText } from '@/utils/thumbnailUtils';

interface GradientPreviewProps {
  format: 'square' | 'vertical' | 'horizontal';
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  className?: string;
  onClick?: () => void;
}

export const GradientPreview = ({ 
  format, 
  carouselMode = false, 
  carouselAspectRatio, 
  className = '',
  onClick
}: GradientPreviewProps) => {
  const [thumbnailSrc, setThumbnailSrc] = useState<string>('');
  const displayText = getDisplayText(format, carouselMode, carouselAspectRatio);

  useEffect(() => {
    generateThumbnailPreview(format, carouselMode, carouselAspectRatio)
      .then(setThumbnailSrc)
      .catch(() => {
        // Fallback - usar createMockupFile se necessário
        console.warn('Failed to generate gradient thumbnail, using fallback');
      });
  }, [format, carouselMode, carouselAspectRatio]);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded border border-border ${className}`}
      onClick={onClick}
    >
      {thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={`${format} preview`}
          className="w-full h-full object-cover"
          style={{ imageRendering: 'crisp-edges' }}
        />
      ) : (
        // Loading state com gradiente CSS como fallback
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <div className="bg-white/90 px-2 py-1 rounded text-sm font-bold text-gray-700">
            {displayText}
          </div>
        </div>
      )}
    </div>
  );
};