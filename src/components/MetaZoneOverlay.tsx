
import React from 'react';
import { getZoneConfig } from '@/config/adPlatformZones';

interface MetaZoneOverlayProps {
  imageUrl: string;
  format: 'square' | 'vertical' | 'horizontal';
  file?: File;
  onImageLoad?: () => void;
}

const MetaZoneOverlay: React.FC<MetaZoneOverlayProps> = ({ 
  imageUrl, 
  format,
  file,
  onImageLoad 
}) => {
  console.log('MetaZoneOverlay - Rendering with props:', { 
    format, 
    fileName: file?.name, 
    fileType: file?.type,
    imageUrl: imageUrl ? 'Present' : 'Missing'
  });

  // Only show overlay for vertical format (Stories/Reels)
  if (format !== 'vertical') {
    console.log('MetaZoneOverlay - Not vertical format, showing simple preview');
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
  
  console.log('MetaZoneOverlay - Will render overlay:', { 
    isReels, 
    zones,
    topMargin: zones.topSafeMargin,
    bottomMargin: zones.bottomSafeMargin
  });

  // For videos, show video element instead of img
  if (isReels && file?.type.startsWith('video/')) {
    console.log('MetaZoneOverlay - Rendering video with overlay');
    return (
      <div className="relative w-full h-full">
        {/* Base Video */}
        <video 
          src={imageUrl} 
          className="w-full h-full object-cover rounded"
          muted
          controls={false}
          onLoadedData={onImageLoad}
        />
        
        {/* Zone Overlays */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Top Safe Margin */}
          <div 
            className="absolute top-0 left-0 right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
            style={{ height: `${zones.topSafeMargin}%` }}
          >
            <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-2 py-1 rounded">
              {zones.topSafeMargin}%
            </span>
          </div>

          {/* Left Side Safe Margin */}
          <div 
            className="absolute top-0 left-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
            style={{ width: `${zones.leftSafeMargin}%` }}
          >
            <span 
              className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-2 rounded transform -rotate-90"
              style={{ fontSize: '10px' }}
            >
              {zones.leftSafeMargin}%
            </span>
          </div>

          {/* Right Side Safe Margin */}
          <div 
            className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
            style={{ width: `${zones.rightSafeMargin}%` }}
          >
            <span 
              className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-2 rounded transform rotate-90"
              style={{ fontSize: '10px' }}
            >
              {zones.rightSafeMargin}%
            </span>
          </div>

          {/* Reels: Complex Lower Right Zone */}
          {zones.lowerRightZone && (
            <div 
              className="absolute right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
              style={{ 
                top: `${100 - zones.lowerRightZone.zoneHeight}%`,
                height: `${zones.lowerRightZone.zoneHeight}%`,
                width: `${zones.lowerRightZone.safeMargin}%`
              }}
            >
              <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-1 rounded transform rotate-90"
                    style={{ fontSize: '9px' }}>
                {zones.lowerRightZone.safeMargin}%
              </span>
            </div>
          )}

          {/* Bottom Safe Margin */}
          <div 
            className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
            style={{ height: `${zones.bottomSafeMargin}%` }}
          >
            <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-2 py-1 rounded">
              {zones.bottomSafeMargin}%
            </span>
          </div>

          {/* Safe Zone - Center area with light green tint */}
          <div 
            className="absolute bg-green-500 bg-opacity-10"
            style={{ 
              top: `${zones.topSafeMargin}%`, 
              left: `${zones.leftSafeMargin}%`, 
              right: zones.lowerRightZone ? 
                `max(${zones.rightSafeMargin}%, ${zones.lowerRightZone.safeMargin}%)` : 
                `${zones.rightSafeMargin}%`,
              bottom: `${zones.bottomSafeMargin}%`
            }}
          />
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
      
      {/* Zone Overlays */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top Safe Margin */}
        <div 
          className="absolute top-0 left-0 right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ height: `${zones.topSafeMargin}%` }}
        >
          <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-2 py-1 rounded">
            {zones.topSafeMargin}%
          </span>
        </div>

        {/* Left Side Safe Margin */}
        <div 
          className="absolute top-0 left-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ width: `${zones.leftSafeMargin}%` }}
        >
          <span 
            className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-2 rounded transform -rotate-90"
            style={{ fontSize: '10px' }}
          >
            {zones.leftSafeMargin}%
          </span>
        </div>

        {/* Right Side Safe Margin */}
        <div 
          className="absolute top-0 right-0 bottom-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ width: `${zones.rightSafeMargin}%` }}
        >
          <span 
            className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-2 rounded transform rotate-90"
            style={{ fontSize: '10px' }}
          >
            {zones.rightSafeMargin}%
          </span>
        </div>

        {/* Reels: Complex Lower Right Zone (for images too if detected as video format) */}
        {isReels && zones.lowerRightZone && (
          <div 
            className="absolute right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
            style={{ 
              top: `${100 - zones.lowerRightZone.zoneHeight}%`,
              height: `${zones.lowerRightZone.zoneHeight}%`,
              width: `${zones.lowerRightZone.safeMargin}%`
            }}
          >
            <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-1 py-1 rounded transform rotate-90"
                  style={{ fontSize: '9px' }}>
              {zones.lowerRightZone.safeMargin}%
            </span>
          </div>
        )}

        {/* Bottom Safe Margin */}
        <div 
          className="absolute bottom-0 left-0 right-0 bg-red-500 bg-opacity-30 flex items-center justify-center"
          style={{ height: `${zones.bottomSafeMargin}%` }}
        >
          <span className="text-white text-xs font-semibold bg-red-600 bg-opacity-80 px-2 py-1 rounded">
            {zones.bottomSafeMargin}%
          </span>
        </div>

        {/* Safe Zone - Center area with light green tint */}
        <div 
          className="absolute bg-green-500 bg-opacity-10"
          style={{ 
            top: `${zones.topSafeMargin}%`, 
            left: `${zones.leftSafeMargin}%`, 
            right: isReels && zones.lowerRightZone ? 
              `max(${zones.rightSafeMargin}%, ${zones.lowerRightZone.safeMargin}%)` : 
              `${zones.rightSafeMargin}%`,
            bottom: `${zones.bottomSafeMargin}%`
          }}
        />
      </div>
    </div>
  );
};

export default MetaZoneOverlay;
