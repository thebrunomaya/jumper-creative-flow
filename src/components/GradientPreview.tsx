import React from 'react';
import { useLazyThumbnail } from '@/hooks/useLazyThumbnail';
import { getDisplayText } from '@/utils/thumbnailUtils';

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
  const displayText = getDisplayText(format, carouselMode, carouselAspectRatio);
  
  // Use lazy loading hook with caching
  const { ref, thumbnailSrc, isLoading, error } = useLazyThumbnail({
    format,
    carouselMode,
    carouselAspectRatio: carouselAspectRatio || '1:1',
    enabled: true
  });

  return (
    <div 
      ref={ref}
      className={`relative w-full h-full overflow-hidden rounded border border-border ${className}`}
      onClick={onClick}
    >
      {isLoading ? (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <div className="bg-white/90 px-2 py-1 rounded text-sm font-bold text-gray-700">
            {displayText}
          </div>
        </div>
      ) : error ? (
        <div className="w-full h-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
          <div className="bg-white/90 px-2 py-1 rounded text-sm font-bold text-red-700">
            Erro
          </div>
        </div>
      ) : thumbnailSrc ? (
        <img
          src={thumbnailSrc}
          alt={`${format} preview`}
          className="w-full h-full object-cover"
          style={{ imageRendering: 'crisp-edges' }}
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <div className="bg-white/90 px-2 py-1 rounded text-sm font-bold text-gray-700">
            {displayText}
          </div>
        </div>
      )}
    </div>
  );
};