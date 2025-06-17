
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Eye } from 'lucide-react';
import MetaZoneOverlay from './MetaZoneOverlay';
import { getThumbnailDimensions, createMockupFile } from '@/utils/thumbnailUtils';

interface ThumbnailPreviewProps {
  format: 'square' | 'vertical' | 'horizontal';
  file?: ValidatedFile;
  onPreviewClick: () => void;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  format,
  file,
  onPreviewClick
}) => {
  const { width, height } = getThumbnailDimensions(format);
  
  // Definir posicionamento específico por formato para manter 4px de margem exata
  const getPositionClasses = () => {
    switch (format) {
      case 'square':
        return 'absolute top-1 right-1'; // 4px do topo e direita
      case 'horizontal':
        return 'absolute top-1 right-1'; // 4px do topo e direita
      case 'vertical':
        return 'absolute bottom-1 left-1/2 transform -translate-x-1/2'; // 4px de baixo, centralizado horizontalmente
      default:
        return 'absolute top-1 right-1';
    }
  };
  
  return (
    <div 
      className={`relative border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer flex-shrink-0 ${getPositionClasses()}`}
      style={{ width, height }}
      onClick={() => file && onPreviewClick()}
    >
      <MetaZoneOverlay
        imageUrl={file?.preview || createMockupFile(format)}
        format={format}
        file={file?.file}
        size="thumbnail"
      />
      
      <div className="absolute top-1.5 left-1.5">
        <div className="bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
          {format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1'}
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
