
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Eye, Upload, X } from 'lucide-react';
import MetaZoneOverlay from './MetaZoneOverlay';
import { getThumbnailDimensions, createMockupFile } from '@/utils/thumbnailUtils';

interface MediaCardProps {
  title: string;
  format: 'square' | 'vertical' | 'horizontal';
  dimensions: string;
  file?: ValidatedFile;
  onFileChange: (file?: ValidatedFile) => void;
  onPreviewClick: () => void;
  enabled: boolean;
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  compact?: boolean;
}

const MediaCard: React.FC<MediaCardProps> = ({
  title,
  format,
  dimensions,
  file,
  onFileChange,
  onPreviewClick,
  enabled,
  carouselMode = false,
  carouselAspectRatio = '1:1',
  compact = false
}) => {
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);
  
  const displayRatio = carouselMode ? carouselAspectRatio : 
    (format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1');

  const handleReplace = () => {
    document.getElementById(`replace-${format}-${carouselMode ? 'carousel' : 'single'}`)?.click();
  };

  const handleFileInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      // This would need to be connected to the validation logic
      // For now, just clear the input
      event.target.value = '';
    }
  };

  return (
    <Card className={`overflow-hidden ${!enabled ? 'opacity-60' : ''} ${compact ? 'border-gray-200' : ''}`}>
      <CardContent className="p-0">
        <div className={`flex ${compact ? 'h-32' : 'h-40'}`}>
          {/* Thumbnail Section */}
          <div className="w-32 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-3">
            <div 
              className="relative border border-gray-300 rounded-lg overflow-hidden bg-white shadow-sm cursor-pointer flex-shrink-0"
              style={{ width: width * 0.8, height: height * 0.8 }}
              onClick={() => file && enabled && onPreviewClick()}
            >
              <MetaZoneOverlay
                imageUrl={file?.preview || createMockupFile(format, carouselMode, carouselAspectRatio)}
                format={format}
                file={file?.file}
                size="thumbnail"
                carouselMode={carouselMode}
                carouselAspectRatio={carouselAspectRatio}
              />
              
              {/* Format Badge */}
              <div className="absolute top-1 left-1">
                <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-black bg-opacity-60 text-white border-0">
                  {displayRatio}
                </Badge>
              </div>

              {/* View Button */}
              {file && enabled && (
                <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2">
                  <Button size="sm" variant="secondary" className="h-6 px-2 text-xs">
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 p-4 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-medium text-gray-900 text-sm">{title}</h4>
                <p className="text-xs text-gray-500">{dimensions}</p>
              </div>
              
              {/* Status Badge */}
              <div className="flex items-center space-x-2">
                {file ? (
                  <Badge variant={file.valid ? "default" : "destructive"} className="text-xs">
                    {file.valid ? 'Válido' : 'Erro'}
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    Vazio
                  </Badge>
                )}
              </div>
            </div>

            {/* File Info or Upload Area */}
            <div className="flex-1 flex items-center">
              {file ? (
                <div className="w-full">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {file.file.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(1)} MB
                  </p>
                  
                  {!file.valid && file.errors && (
                    <div className="mt-2">
                      <p className="text-xs text-red-600">
                        {file.errors[0]}
                      </p>
                    </div>
                  )}
                </div>
              ) : enabled ? (
                <div className="w-full text-center">
                  <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">
                    Arraste ou clique para enviar
                  </p>
                </div>
              ) : (
                <div className="w-full text-center">
                  <p className="text-xs text-gray-400">
                    Posicionamento desativado
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            {enabled && (
              <div className="flex items-center justify-end space-x-2 mt-2">
                {file ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleReplace}
                      className="h-7 px-2 text-xs"
                    >
                      Substituir
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onFileChange(undefined)}
                      className="h-7 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => document.getElementById(`upload-${format}-${carouselMode ? 'carousel' : 'single'}`)?.click()}
                    className="h-7 px-2 text-xs"
                  >
                    <Upload className="h-3 w-3 mr-1" />
                    Enviar
                  </Button>
                )}
              </div>
            )}

            {/* Hidden File Inputs */}
            <input
              id={`upload-${format}-${carouselMode ? 'carousel' : 'single'}`}
              type="file"
              accept="image/*,video/mp4,video/mov,video/quicktime"
              onChange={handleFileInput}
              className="hidden"
            />
            <input
              id={`replace-${format}-${carouselMode ? 'carousel' : 'single'}`}
              type="file"
              accept="image/*,video/mp4,video/mov,video/quicktime"
              onChange={handleFileInput}
              className="hidden"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MediaCard;
