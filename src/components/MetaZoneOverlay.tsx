
import React from 'react';
import { getZoneConfig } from '@/config/adPlatformZones';

interface MetaZoneOverlayProps {
  imageUrl: string;
  format: 'square' | 'vertical' | 'horizontal';
  file?: File;
  onImageLoad?: () => void;
  expanded?: boolean;
  size?: 'thumbnail' | 'lightbox';
}

const MetaZoneOverlay: React.FC<MetaZoneOverlayProps> = ({ 
  imageUrl, 
  format,
  file,
  onImageLoad,
  expanded = false,
  size = 'lightbox'
}) => {
  console.log('MetaZoneOverlay - Rendering with props:', { 
    format, 
    fileName: file?.name, 
    fileType: file?.type,
    imageUrl: imageUrl ? 'Present' : 'Missing',
    expanded,
    size
  });

  // Only show overlay for vertical format (Stories/Reels)
  if (format !== 'vertical') {
    console.log('MetaZoneOverlay - Not vertical format, showing simple preview');
    
    if (file?.type.startsWith('video/')) {
      return (
        <video 
          src={imageUrl} 
          className="w-full h-full object-cover rounded"
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
        className="w-full h-full object-cover rounded"
        onLoad={onImageLoad}
      />
    );
  }

  // Get zone configuration based on file type
  const zoneConfig = getZoneConfig(file);
  console.log('MetaZoneOverlay - Zone config result:', {
    configName: zoneConfig?.name,
    isVideo: zoneConfig?.contentTypes.includes('video'),
    hasZones: !!zoneConfig?.zones
  });
  
  if (!zoneConfig) {
    console.log('MetaZoneOverlay - No zone config found, showing simple preview');
    
    if (file?.type.startsWith('video/')) {
      return (
        <video 
          src={imageUrl} 
          className="w-full h-full object-cover rounded"
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
        className="w-full h-full object-cover rounded"
        onLoad={onImageLoad}
      />
    );
  }

  const { zones } = zoneConfig;
  const isReels = zoneConfig.contentTypes.includes('video');
  const isThumbnail = size === 'thumbnail';
  
  console.log('MetaZoneOverlay - Will render overlay:', { 
    isReels, 
    zones,
    topMargin: zones.topSafeMargin,
    bottomMargin: zones.bottomSafeMargin,
    expanded,
    size,
    isThumbnail
  });

  // For videos, show video element with overlay
  if (isReels && file?.type.startsWith('video/')) {
    console.log('MetaZoneOverlay - Rendering video with overlay');
    return (
      <div className="relative w-full h-full">
        {/* Base Video */}
        <video 
          src={imageUrl} 
          className="w-full h-full object-cover rounded"
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

          {/* Safe Zone - Only show detailed info in lightbox */}
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
        className="w-full h-full object-cover rounded"
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
