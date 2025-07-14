import { getGradientImage, getDisplayText } from '@/utils/thumbnailUtils';

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
  const gradientImage = getGradientImage(format, carouselMode, carouselAspectRatio);
  const displayText = getDisplayText(format, carouselMode, carouselAspectRatio);

  return (
    <div 
      className={`relative w-full h-full overflow-hidden rounded border border-border ${className}`}
      style={{
        backgroundImage: `url(${gradientImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
      onClick={onClick}
    >
      {/* Overlay para o texto */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="bg-white/90 px-2 py-1 rounded text-sm font-bold text-gray-700">
          {displayText}
        </div>
      </div>
    </div>
  );
};