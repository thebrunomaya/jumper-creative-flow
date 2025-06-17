
import React from 'react';

interface MetaZoneOverlayProps {
  imageUrl: string;
  format: 'square' | 'vertical' | 'horizontal';
  onImageLoad?: () => void;
}

const MetaZoneOverlay: React.FC<MetaZoneOverlayProps> = ({ 
  imageUrl, 
  format,
  onImageLoad 
}) => {
  // Only show overlay for vertical format (Stories/Reels)
  if (format !== 'vertical') {
    return (
      <img 
        src={imageUrl} 
        alt="Preview" 
        className="w-full h-full object-cover rounded"
        onLoad={onImageLoad}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Base Image */}
      <img 
        src={imageUrl} 
        alt="Preview com overlay de zonas Meta" 
        className="w-full h-full object-cover rounded"
        onLoad={onImageLoad}
      />
      
      {/* Zone Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Danger Zone - 8% */}
        <div 
          className="absolute top-0 left-0 right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ height: '8%' }}
        >
          <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-2 py-1 rounded">
            8%
          </span>
        </div>

        {/* Left Side Danger Zone - 6% */}
        <div 
          className="absolute top-0 left-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ width: '6%' }}
        >
          <span 
            className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-2 rounded transform -rotate-90"
            style={{ fontSize: '10px' }}
          >
            6%
          </span>
        </div>

        {/* Right Side Danger Zone - 6% */}
        <div 
          className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ width: '6%' }}
        >
          <span 
            className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-2 rounded transform rotate-90"
            style={{ fontSize: '10px' }}
          >
            6%
          </span>
        </div>

        {/* Bottom Danger Zone - 21% */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ height: '21%' }}
        >
          <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-2 py-1 rounded">
            21%
          </span>
        </div>

        {/* Safe Zone - Center area with light green tint */}
        <div 
          className="absolute bg-green-500 bg-opacity-10"
          style={{ 
            top: '8%', 
            left: '6%', 
            right: '6%', 
            bottom: '21%' 
          }}
        />
      </div>
    </div>
  );
};

export default MetaZoneOverlay;
