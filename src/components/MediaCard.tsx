
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import ThumbnailPreview from './ThumbnailPreview';
import FileUploadZone from './FileUploadZone';
import UrlInputZone from './UrlInputZone';
import FileDetails from './FileDetails';

interface MediaCardProps {
  title: string;
  format: 'square' | 'vertical' | 'horizontal';
  dimensions: string;
  file?: ValidatedFile;
  onPreviewClick: () => void;
  onUploadClick: () => void;
  onReplaceClick: () => void;
  onRemoveClick: () => void;
  enabled: boolean;
  carouselMode?: boolean;
  carouselAspectRatio?: '1:1' | '4:5';
  compact?: boolean;
  getRootProps?: () => any;
  getInputProps?: () => any;
  isDragActive?: boolean;
  isValidating?: boolean;
  showHeader?: boolean;
  onRemove?: () => void;
  canRemove?: boolean;
  // New props for URL mode
  urlMode?: boolean;
  existingPostData?: any;
}

const MediaCard: React.FC<MediaCardProps> = ({
  title,
  format,
  dimensions,
  file,
  onPreviewClick,
  onUploadClick,
  onReplaceClick,
  onRemoveClick,
  enabled,
  carouselMode = false,
  carouselAspectRatio = '1:1',
  getRootProps,
  getInputProps,
  isDragActive,
  isValidating = false,
  showHeader = false,
  onRemove,
  canRemove = false,
  urlMode = false,
  existingPostData
}) => {
  // Status Badge Component
  const statusBadge = !enabled ? (
    <Badge variant="outline" className="text-xs">
      Desativado
    </Badge>
  ) : urlMode ? (
    existingPostData ? (
      <Badge variant={existingPostData.valid ? "default" : "destructive"} className="text-xs">
        {existingPostData.valid ? 'URL Válida' : 'URL Inválida'}
      </Badge>
    ) : (
      <Badge variant="outline" className="text-xs">
        Sem URL
      </Badge>
    )
  ) : file ? (
    <Badge variant={file.valid ? "default" : "destructive"} className="text-xs">
      {file.valid ? 'Válido' : 'Erro'}
    </Badge>
  ) : (
    <Badge variant="outline" className="text-xs">
      Vazio
    </Badge>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
      {/* Header - apenas se showHeader for true */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h4 className="text-lg font-semibold text-jumper-text">
            {title}
          </h4>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">{dimensions}</span>
            {statusBadge}
            {canRemove && onRemove && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRemove}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="flex h-40">
        {/* Thumbnail Container - quadrado 160x160px */}
        <div className="w-40 h-40 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-2">
          <ThumbnailPreview
            format={format}
            file={file}
            onPreviewClick={onPreviewClick}
            carouselMode={carouselMode}
            carouselAspectRatio={carouselAspectRatio}
            enabled={enabled}
            urlMode={urlMode}
            existingPostData={existingPostData}
          />
        </div>

        {/* Upload Area, URL Input Zone ou File Details Container */}
        <div className="flex-1 flex flex-col h-40">
          {urlMode ? (
            <UrlInputZone
              isValidating={isValidating}
              enabled={enabled}
              onUrlInputClick={onUploadClick}
              existingPostData={existingPostData}
            />
          ) : !file ? (
            <FileUploadZone
              getRootProps={getRootProps || (() => ({}))}
              getInputProps={getInputProps || (() => ({}))}
              isDragActive={isDragActive || false}
              isValidating={isValidating}
              dimensions={dimensions}
              enabled={enabled}
              onUploadClick={onUploadClick}
            />
          ) : (
            <FileDetails
              file={file}
              format={format}
              onRemove={onRemoveClick}
              onReplace={onReplaceClick}
              enabled={enabled}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MediaCard;
