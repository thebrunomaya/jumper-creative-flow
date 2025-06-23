
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Button } from '@/components/ui/button';
import { Play, FileText } from 'lucide-react';
import { getThumbnailDimensions, createMockupFile } from '@/utils/thumbnailUtils';

interface ThumbnailPreviewProps {
  format: 'square' | 'vertical' | 'horizontal';
  file?: ValidatedFile;
  onPreviewClick: () => void;
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  enabled: boolean;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  format,
  file,
  onPreviewClick,
  carouselMode = false,
  carouselAspectRatio = '1:1',
  enabled
}) => {
  // Get thumbnail dimensions for proper sizing
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);

  // Handle disabled state
  if (!enabled) {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded opacity-50"
        style={{ width: `${width}px`, height: `${height}px` }}
      >
        <div className="text-center">
          <FileText className="h-6 w-6 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-500">Desativado</span>
        </div>
      </div>
    );
  }

  // Handle empty state (no file) - Show beautiful mockup
  if (!file) {
    const mockupSrc = createMockupFile(format, carouselMode, carouselAspectRatio);
    
    return (
      <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
        <Button
          variant="ghost"
          className="w-full h-full p-0 rounded hover:opacity-80 transition-opacity"
          onClick={onPreviewClick}
        >
          <div className="w-full h-full relative overflow-hidden rounded">
            <img
              src={mockupSrc}
              alt={`Preview ${carouselMode 
                ? (carouselAspectRatio === '1:1' ? '1:1' : '4:5')
                : format
              }`}
              className="w-full h-full object-cover"
            />
          </div>
        </Button>
        
        {/* Format indicator - moved to top-left */}
        <div className="absolute top-1 left-1">
          <div className="bg-gray-600 bg-opacity-90 text-white text-xs px-1.5 py-0.5 rounded">
            {carouselMode 
              ? (carouselAspectRatio === '1:1' ? '1:1' : '4:5')
              : (format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1')
            }
          </div>
        </div>
      </div>
    );
  }

  // Handle file preview
  const isVideo = file.file.type.startsWith('video/');
  const isValid = file.valid;

  return (
    <div className="relative" style={{ width: `${width}px`, height: `${height}px` }}>
      <Button
        variant="ghost"
        className="w-full h-full p-0 rounded hover:opacity-80 transition-opacity"
        onClick={onPreviewClick}
        disabled={!isValid}
      >
        <div className="w-full h-full relative overflow-hidden rounded">
          {file.preview ? (
            <>
              {isVideo ? (
                <video
                  src={file.preview}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <img
                  src={file.preview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              )}
              {isVideo && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                  <div className="bg-white bg-opacity-90 rounded-full p-2">
                    <Play className="h-4 w-4 text-gray-800 fill-current" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <FileText className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
      </Button>
      
      {/* Status indicator */}
      <div className="absolute top-1 right-1">
        <div className={`w-3 h-3 rounded-full ${isValid ? 'bg-green-500' : 'bg-red-500'}`}></div>
      </div>
    </div>
  );
};

export default ThumbnailPreview;
