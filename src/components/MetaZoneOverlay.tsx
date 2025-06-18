import React from 'react';
import { getZoneConfig } from '@/config/adPlatformZones';

interface MetaZoneOverlayProps {
  imageUrl: string;
  format: 'square' | 'vertical' | 'horizontal';
  file?: File;
  onImageLoad?: () => void;
  expanded?: boolean;
  size?: 'thumbnail' | 'lightbox';
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
}

const MetaZoneOverlay: React.FC<MetaZoneOverlayProps> = ({ 
  imageUrl, 
  format,
  file,
  onImageLoad,
  expanded = false,
  size = 'lightbox',
  carouselMode = false,
  carouselAspectRatio = '1:1'
}) => {
  console.log('MetaZoneOverlay - Rendering with props:', { 
    format, 
    fileName: file?.name, 
    fileType: file?.type,
    imageUrl: imageUrl ? 'Present' : 'Missing',
    expanded,
    size,
    carouselMode,
    carouselAspectRatio
  });

  // For carousel mode, use specific carousel overlays with new Feed format support
  if (carouselMode) {
    const objectFit = size === 'lightbox' ? 'object-contain' : 'object-cover';
    const isThumbnail = size === 'thumbnail';
    
    // Define carousel safe zones based on Feed format specifications
    const carouselZones = carouselAspectRatio === '1:1' ? {
      // Square Feed (1:1): 10% margin on all sides
      topSafeMargin: 10,
      bottomSafeMargin: 10,
      leftSafeMargin: 10,
      rightSafeMargin: 10,
      safeZonePercentage: 80,
      warningMessage: "Zona segura: 80% central"
    } : {
      // Vertical Feed (4:5): 18.5% top/bottom, 6% sides
      topSafeMargin: 18.5,
      bottomSafeMargin: 18.5,
      leftSafeMargin: 6,
      rightSafeMargin: 6,
      pixelEquivalent: "~250px",
      warningMessage: "Mantenha conteúdo importante no centro vertical"
    };

    console.log('MetaZoneOverlay - Carousel mode with Feed zones:', carouselZones);

    return (
      <div className="relative w-full h-full">
        {/* Base Media */}
        {file?.type.startsWith('video/') ? (
          <video 
            src={imageUrl} 
            className={`w-full h-full ${objectFit} rounded`}
            muted
            controls={expanded && size === 'lightbox'}
            onLoadedData={onImageLoad}
          />
        ) : (
          <img 
            src={imageUrl} 
            alt="Carousel Feed Preview" 
            className={`w-full h-full ${objectFit} rounded`}
            onLoad={onImageLoad}
          />
        )}
        
        {/* Feed Zone Overlays - Enhanced visibility for lightbox */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Safe Margin */}
          <div 
            className={`absolute top-0 left-0 right-0 bg-red-500 ${size === 'lightbox' ? 'bg-opacity-40' : 'bg-opacity-30'} border-b-2 border-red-400`}
            style={{ height: `${carouselZones.topSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full">
                <span className="text-white text-sm font-bold bg-red-600 bg-opacity-90 px-2 py-1 rounded shadow">
                  {carouselAspectRatio === '1:1' ? '10%' : `${carouselZones.topSafeMargin}% ${carouselZones.pixelEquivalent || ''}`}
                </span>
              </div>
            )}
          </div>

          {/* Left Safe Margin */}
          <div 
            className={`absolute top-0 left-0 bottom-0 bg-red-500 ${size === 'lightbox' ? 'bg-opacity-40' : 'bg-opacity-30'} border-r-2 border-red-400`}
            style={{ width: `${carouselZones.leftSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full">
                <span className="text-white text-sm font-bold bg-red-600 bg-opacity-90 px-2 py-1 rounded transform -rotate-90 shadow">
                  {carouselZones.leftSafeMargin}%
                </span>
              </div>
            )}
          </div>

          {/* Right Safe Margin */}
          <div 
            className={`absolute top-0 right-0 bottom-0 bg-red-500 ${size === 'lightbox' ? 'bg-opacity-40' : 'bg-opacity-30'} border-l-2 border-red-400`}
            style={{ width: `${carouselZones.rightSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full">
                <span className="text-white text-sm font-bold bg-red-600 bg-opacity-90 px-2 py-1 rounded transform rotate-90 shadow">
                  {carouselZones.rightSafeMargin}%
                </span>
              </div>
            )}
          </div>

          {/* Bottom Safe Margin */}
          <div 
            className={`absolute bottom-0 left-0 right-0 bg-red-500 ${size === 'lightbox' ? 'bg-opacity-40' : 'bg-opacity-30'} border-t-2 border-red-400`}
            style={{ height: `${carouselZones.bottomSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full">
                <span className="text-white text-sm font-bold bg-red-600 bg-opacity-90 px-2 py-1 rounded shadow">
                  {carouselAspectRatio === '1:1' ? '10%' : `${carouselZones.bottomSafeMargin}% ${carouselZones.pixelEquivalent || ''}`}
                </span>
              </div>
            )}
          </div>

          {/* Safe Zone - Enhanced styling and visibility */}
          <div 
            className={`absolute ${size === 'lightbox' ? 'bg-green-400 bg-opacity-25 border-4 border-green-500' : 'bg-green-500 bg-opacity-15 border-2 border-green-400'} border-dashed`}
            style={{ 
              top: `${carouselZones.topSafeMargin}%`, 
              left: `${carouselZones.leftSafeMargin}%`, 
              right: `${carouselZones.rightSafeMargin}%`,
              bottom: `${carouselZones.bottomSafeMargin}%`
            }}
          >
            {size === 'lightbox' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="bg-green-600 bg-opacity-95 text-white px-4 py-3 rounded-lg shadow-lg text-center">
                  <div className="text-lg font-bold mb-1">
                    Zona Segura Feed {carouselAspectRatio}
                  </div>
                  <div className="text-sm">
                    {carouselZones.warningMessage}
                  </div>
                  {carouselAspectRatio === '1:1' && (
                    <div className="text-xs mt-1 text-green-100">
                      {carouselZones.safeZonePercentage}% da área total
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Only show overlay for vertical format (Stories/Reels)
  if (format !== 'vertical') {
    console.log('MetaZoneOverlay - Not vertical format, showing simple preview');
    
    // Determine object-fit based on context
    const objectFit = size === 'lightbox' ? 'object-contain' : 'object-cover';
    
    if (file?.type.startsWith('video/')) {
      return (
        <video 
          src={imageUrl} 
          className={`w-full h-full ${objectFit} rounded`}
          muted
          controls={expanded}
          onLoadedData={onImageLoad}
        />
      );
    }
    
    return (
      <img 
        src={imageUrl} 
        alt="Preview" 
        className={`w-full h-full ${objectFit} rounded`}
        onLoad={onImageLoad}
      />
    );
  }

  // Get zone configuration based on file type for Stories/Reels
  const zoneConfig = getZoneConfig(file);
  console.log('MetaZoneOverlay - Zone config result:', {
    configName: zoneConfig?.name,
    isVideo: zoneConfig?.contentTypes.includes('video'),
    hasZones: !!zoneConfig?.zones
  });
  
  if (!zoneConfig) {
    console.log('MetaZoneOverlay - No zone config found, showing simple preview');
    
    // Determine object-fit based on context
    const objectFit = size === 'lightbox' ? 'object-contain' : 'object-cover';
    
    if (file?.type.startsWith('video/')) {
      return (
        <video 
          src={imageUrl} 
          className={`w-full h-full ${objectFit} rounded`}
          muted
          controls={expanded}
          onLoadedData={onImageLoad}
        />
      );
    }
    
    return (
      <img 
        src={imageUrl} 
        alt="Preview" 
        className={`w-full h-full ${objectFit} rounded`}
        onLoad={onImageLoad}
      />
    );
  }

  const { zones } = zoneConfig;
  const isReels = zoneConfig.contentTypes.includes('video');
  const isThumbnail = size === 'thumbnail';
  
  // Determine object-fit based on context - use contain for lightbox to show full image
  const objectFit = size === 'lightbox' ? 'object-contain' : 'object-cover';
  
  console.log('MetaZoneOverlay - Will render overlay:', { 
    isReels, 
    zones,
    topMargin: zones.topSafeMargin,
    bottomMargin: zones.bottomSafeMargin,
    expanded,
    size,
    isThumbnail,
    objectFit
  });

  // For videos, show video element with overlay
  if (isReels && file?.type.startsWith('video/')) {
    console.log('MetaZoneOverlay - Rendering video with overlay');
    return (
      <div className="relative w-full h-full">
        {/* Base Video */}
        <video 
          src={imageUrl} 
          className={`w-full h-full ${objectFit} rounded`}
          muted
          controls={expanded && size === 'lightbox'}
          onLoadedData={onImageLoad}
        />
        
        {/* Zone Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Safe Margin */}
          <div 
            className="absolute top-0 left-0 right-0 bg-red-500 bg-opacity-30"
            style={{ height: `${zones.topSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full border-b border-red-400">
                <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-0.5 rounded">
                  Interface Superior
                </span>
              </div>
            )}
          </div>

          {/* Left Side Safe Margin */}
          <div 
            className="absolute top-0 left-0 bottom-0 bg-red-500 bg-opacity-30"
            style={{ width: `${zones.leftSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full border-r border-red-400">
                <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-1 rounded transform -rotate-90">
                  {zones.leftSafeMargin}%
                </span>
              </div>
            )}
          </div>

          {/* Right Side Safe Margin */}
          <div 
            className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-30"
            style={{ width: `${zones.rightSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full border-l border-red-400">
                <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-1 rounded transform rotate-90">
                  {zones.rightSafeMargin}%
                </span>
              </div>
            )}
          </div>

          {/* Reels: Complex Lower Right Zone */}
          {zones.lowerRightZone && (
            <div 
              className="absolute right-0 bg-red-500 bg-opacity-30"
              style={{ 
                top: `${100 - zones.lowerRightZone.zoneHeight}%`,
                height: `${zones.lowerRightZone.zoneHeight}%`,
                width: `${zones.lowerRightZone.safeMargin}%`
              }}
            >
              {!isThumbnail && (
                <div className="flex items-center justify-center h-full border-l border-t border-red-400">
                  <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-0.5 rounded transform rotate-90">
                    CTA
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Bottom Safe Margin */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-30"
            style={{ height: `${zones.bottomSafeMargin}%` }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full border-t border-red-400">
                <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-0.5 rounded">
                  Interface Inferior
                </span>
              </div>
            )}
          </div>

          {/* Safe Zone */}
          {!isThumbnail && (
            <div 
              className="absolute bg-green-500 bg-opacity-10 border border-green-400 border-dashed"
              style={{ 
                top: `${zones.topSafeMargin}%`, 
                left: `${zones.leftSafeMargin}%`, 
                right: zones.lowerRightZone ? 
                  `max(${zones.rightSafeMargin}%, ${zones.lowerRightZone.safeMargin}%)` : 
                  `${zones.rightSafeMargin}%`,
                bottom: `${zones.bottomSafeMargin}%`
              }}
            >
              {expanded && size === 'lightbox' && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <span className="text-green-700 text-xs font-semibold bg-green-100 bg-opacity-90 px-2 py-1 rounded">
                    Zona Segura
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For images, use img element with overlay
  console.log('MetaZoneOverlay - Rendering image with overlay');
  return (
    <div className="relative w-full h-full">
      {/* Base Image */}
      <img 
        src={imageUrl} 
        alt={`Preview com overlay de zonas ${zoneConfig.name}`}
        className={`w-full h-full ${objectFit} rounded`}
        onLoad={onImageLoad}
      />
      
      {/* Zone Overlays - Same structure as video but simplified for thumbnails */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Safe Margin */}
        <div 
          className="absolute top-0 left-0 right-0 bg-red-500 bg-opacity-30"
          style={{ height: `${zones.topSafeMargin}%` }}
        >
          {!isThumbnail && (
            <div className="flex items-center justify-center h-full border-b border-red-400">
              <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-0.5 rounded">
                Interface Superior
              </span>
            </div>
          )}
        </div>

        {/* Left Side Safe Margin */}
        <div 
          className="absolute top-0 left-0 bottom-0 bg-red-500 bg-opacity-30"
          style={{ width: `${zones.leftSafeMargin}%` }}
        >
          {!isThumbnail && (
            <div className="flex items-center justify-center h-full border-r border-red-400">
              <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-1 rounded transform -rotate-90">
                {zones.leftSafeMargin}%
              </span>
            </div>
          )}
        </div>

        {/* Right Side Safe Margin */}
        <div 
          className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-30"
          style={{ width: `${zones.rightSafeMargin}%` }}
        >
          {!isThumbnail && (
            <div className="flex items-center justify-center h-full border-l border-red-400">
              <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-1 rounded transform rotate-90">
                {zones.rightSafeMargin}%
              </span>
            </div>
          )}
        </div>

        {/* Stories: Complex Lower Right Zone (for images too if detected as video format) */}
        {isReels && zones.lowerRightZone && (
          <div 
            className="absolute right-0 bg-red-500 bg-opacity-30"
            style={{ 
              top: `${100 - zones.lowerRightZone.zoneHeight}%`,
              height: `${zones.lowerRightZone.zoneHeight}%`,
              width: `${zones.lowerRightZone.safeMargin}%`
            }}
          >
            {!isThumbnail && (
              <div className="flex items-center justify-center h-full border-l border-t border-red-400">
                <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-0.5 rounded transform rotate-90">
                  CTA
                </span>
              </div>
            )}
          </div>
        )}

        {/* Bottom Safe Margin */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-30"
          style={{ height: `${zones.bottomSafeMargin}%` }}
        >
          {!isThumbnail && (
            <div className="flex items-center justify-center h-full border-t border-red-400">
              <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-90 px-1 py-0.5 rounded">
                Interface Inferior
              </span>
            </div>
          )}
        </div>

        {/* Safe Zone - Only show detailed info in lightbox */}
        {!isThumbnail && (
          <div 
            className="absolute bg-green-500 bg-opacity-10 border border-green-400 border-dashed"
            style={{ 
              top: `${zones.topSafeMargin}%`, 
              left: `${zones.leftSafeMargin}%`, 
              right: isReels && zones.lowerRightZone ? 
                `max(${zones.rightSafeMargin}%, ${zones.lowerRightZone.safeMargin}%)` : 
                `${zones.rightSafeMargin}%`,
              bottom: `${zones.bottomSafeMargin}%`
            }}
          >
            {expanded && size === 'lightbox' && (
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <span className="text-green-700 text-xs font-semibold bg-green-100 bg-opacity-90 px-2 py-1 rounded">
                  Zona Segura
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MetaZoneOverlay;
