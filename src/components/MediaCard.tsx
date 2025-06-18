
import React from 'react';
import { ValidatedFile } from '@/types/creative';
import { Badge } from '@/components/ui/badge';
import ThumbnailPreview from './ThumbnailPreview';
import FileUploadZone from './FileUploadZone';
import FileDetails from './FileDetails';
import BaseMediaUploadCard from './BaseMediaUploadCard';

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
  isValidating = false
}) => {
  // Status Badge Component
  const statusBadge = !enabled ? (
    <Badge variant="outline" className="text-xs">
      Desativado
    </Badge>
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
    <BaseMediaUploadCard
      title={title}
      dimensions={dimensions}
      headerActions={statusBadge}
    >
      {/* Thumbnail Container - padronizado com w-32 (128px) */}
      <div className="w-32 bg-gray-50 border-r border-gray-200 flex items-center justify-center p-4">
        <ThumbnailPreview
          format={format}
          file={file}
          onPreviewClick={onPreviewClick}
          carouselMode={carouselMode}
          carouselAspectRatio={carouselAspectRatio}
          enabled={enabled}
        />
      </div>

      {/* Upload Area ou File Details Container */}
      <div className="flex-1 flex flex-col min-h-[160px]">
        {!file ? (
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
    </BaseMediaUploadCard>
  );
};

export default MediaCard;
