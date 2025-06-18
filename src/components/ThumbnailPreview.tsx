
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Eye } from 'lucide-react';
import MetaZoneOverlay from './MetaZoneOverlay';
import { getThumbnailDimensions, createMockupFile } from '@/utils/thumbnailUtils';

interface ThumbnailPreviewProps {
  format: 'square' | 'vertical' | 'horizontal';
  file?: ValidatedFile;
  onPreviewClick: () => void;
  carouselMode?: boolean; // New prop for carousel mode
  carouselAspectRatio?: '1:1' | '4:5'; // New prop for carousel aspect ratio
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  format,
  file,
  onPreviewClick,
  carouselMode = false,
  carouselAspectRatio = '1:1'
}) => {
  const { width, height } = getThumbnailDimensions(format);
  
  // For carousel mode, show the aspect ratio instead of format ratio
  const displayRatio = carouselMode ? carouselAspectRatio : 
    (format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1');
  
  return (
    <div 
      className="relative border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer flex-shrink-0"
      style={{ width, height }}
      onClick={() => file && onPreviewClick()}
    >
      <MetaZoneOverlay
        imageUrl={file?.preview || createMockupFile(format)}
        format={format}
        file={file?.file}
        size="thumbnail"
        carouselMode={carouselMode}
        carouselAspectRatio={carouselAspectRatio}
      />
      
      <div className="absolute top-1.5 left-1.5">
        <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {displayRatio}
        </div>
      </div>

      {/* Botão Ver dentro da imagem, centralizado na parte inferior */}
      {file && (
        <div className="absolute bottom-1.5 left-1/2 transform -translate-x-1/2">
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded backdrop-blur-sm hover:bg-blue-600 transition-colors flex items-center space-x-1">
            <Eye className="h-3 w-3" />
            <span>Ver</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThumbnailPreview;
