
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Button } from '@/components/ui/button';
import { Play, Image, FileText, Instagram, Link, ExternalLink } from 'lucide-react';

interface ThumbnailPreviewProps {
  format: 'square' | 'vertical' | 'horizontal';
  file?: ValidatedFile;
  onPreviewClick: () => void;
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  enabled: boolean;
  urlMode?: boolean;
  existingPostData?: any;
}

const ThumbnailPreview: React.FC<ThumbnailPreviewProps> = ({
  format,
  file,
  onPreviewClick,
  carouselMode = false,
  carouselAspectRatio = '1:1',
  enabled,
  urlMode = false,
  existingPostData
}) => {
  // Handle URL mode
  if (urlMode) {
    if (!existingPostData || !existingPostData.valid) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300">
          <div className="text-center">
            <Instagram className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <span className="text-xs text-gray-500">Instagram Post</span>
          </div>
        </div>
      );
    }

    // Valid Instagram URL
    return (
      <div className="w-full h-full relative">
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 rounded border">
          <div className="text-center text-white">
            <Instagram className="h-12 w-12 mx-auto mb-2" />
            <div className="text-xs font-medium">Instagram</div>
            <div className="text-xs opacity-90">Post</div>
          </div>
        </div>
        
        {/* Valid indicator */}
        <div className="absolute top-1 right-1">
          <div className="bg-green-500 text-white rounded-full p-1">
            <ExternalLink className="h-3 w-3" />
          </div>
        </div>
      </div>
    );
  }

  // Handle file mode (existing logic)
  if (!enabled) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded opacity-50">
        <div className="text-center">
          <FileText className="h-8 w-8 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-500">Desativado</span>
        </div>
      </div>
    );
  }

  if (!file) {
    const aspectRatioClass = format === 'square' ? 'aspect-square' :
                            format === 'vertical' ? 'aspect-[9/16]' : 'aspect-[16/9]';
    
    if (carouselMode) {
      const carouselAspectClass = carouselAspectRatio === '1:1' ? 'aspect-square' : 'aspect-[4/5]';
      return (
        <div className={`w-full h-full flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300`}>
          <div className="text-center">
            <Image className="h-8 w-8 text-gray-400 mx-auto mb-1" />
            <span className="text-xs text-gray-500">
              {carouselAspectRatio === '1:1' ? '1:1' : '4:5'}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className={`w-full h-full flex items-center justify-center bg-gray-100 rounded border-2 border-dashed border-gray-300`}>
        <div className="text-center">
          <Image className="h-8 w-8 text-gray-400 mx-auto mb-1" />
          <span className="text-xs text-gray-500">{format}</span>
        </div>
      </div>
    );
  }

  const isVideo = file.file.type.startsWith('video/');
  const isValid = file.valid;

  return (
    <div className="w-full h-full relative">
      <Button
        variant="ghost"
        className="w-full h-full p-0 rounded border hover:opacity-80 transition-opacity"
        onClick={onPreviewClick}
        disabled={!isValid}
      >
        <div className="w-full h-full relative overflow-hidden rounded">
          {file.preview ? (
            <>
              <img
                src={file.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
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
              <FileText className="h-8 w-8 text-gray-400" />
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
