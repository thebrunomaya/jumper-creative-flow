
import React, { useCallback, useState } from 'react';
import { CarouselCard, ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { useDropzone } from 'react-dropzone';
import { Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThumbnailPreview from './ThumbnailPreview';
import FileUploadZone from './FileUploadZone';
import FileDetails from './FileDetails';
import MediaPreviewLightbox from './MediaPreviewLightbox';

interface CarouselCardUploadProps {
  card: CarouselCard;
  aspectRatio: '1:1' | '4:5';
  onFileChange: (file?: ValidatedFile) => void;
  onRemove?: () => void;
  canRemove: boolean;
  cardNumber: number;
}

const CarouselCardUpload: React.FC<CarouselCardUploadProps> = ({
  card,
  aspectRatio,
  onFileChange,
  onRemove,
  canRemove,
  cardNumber
}) => {
  const [isValidating, setIsValidating] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const format = aspectRatio === '1:1' ? 'carousel-1:1' : 'carousel-4:5';
  const dimensions = aspectRatio === '1:1' ? '1080x1080px (1:1)' : '1080x1350px (4:5)';

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    
    console.log('CarouselCardUpload onDrop - Processing file:', {
      fileName: acceptedFiles[0].name,
      fileType: acceptedFiles[0].type,
      format: format,
      aspectRatio: aspectRatio
    });
    
    setIsValidating(true);
    const validatedFile = await validateFile(acceptedFiles[0], format);
    console.log('CarouselCardUpload onDrop - Validation complete:', {
      valid: validatedFile.valid,
      hasPreview: !!validatedFile.preview
    });
    onFileChange(validatedFile);
    setIsValidating(false);
  }, [onFileChange, format, aspectRatio]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    multiple: false,
    maxFiles: 1
  });

  const removeFile = () => {
    onFileChange(undefined);
  };

  const handleReplace = () => {
    document.getElementById(`replace-carousel-${card.id}`)?.click();
  };

  return (
    <div className="space-y-4 p-6 bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-lg font-semibold text-jumper-text">
          🎴 Cartão {cardNumber}
        </h4>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-500">{dimensions}</span>
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

      {/* Upload Area */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-sm min-h-[200px]">
        <div className="flex min-h-[200px]">
          {/* Thumbnail Container */}
          <div className="w-[160px] bg-gray-100 border-r border-gray-200 flex items-center justify-center p-4">
            <ThumbnailPreview
              format={aspectRatio === '1:1' ? 'square' : 'vertical'}
              file={card.file}
              onPreviewClick={() => setLightboxOpen(true)}
              carouselMode={true}
              carouselAspectRatio={aspectRatio}
            />
          </div>

          {/* Upload Area ou File Details Container */}
          <div className="flex-1 flex flex-col min-h-[200px]">
            {!card.file ? (
              <FileUploadZone
                getRootProps={getRootProps}
                getInputProps={getInputProps}
                isDragActive={isDragActive}
                isValidating={isValidating}
                dimensions={dimensions}
              />
            ) : (
              <FileDetails
                file={card.file}
                format={aspectRatio === '1:1' ? 'square' : 'vertical'}
                onRemove={removeFile}
                onReplace={handleReplace}
              />
            )}
          </div>
        </div>
      </div>

      {/* Hidden file input for replacement */}
      <input
        id={`replace-carousel-${card.id}`}
        type="file"
        accept="image/*,video/mp4,video/mov,video/quicktime"
        onChange={(e) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            onDrop([files[0]]);
          }
        }}
        style={{ display: 'none' }}
      />

      {/* Media Preview Lightbox */}
      {card.file && (
        <MediaPreviewLightbox
          file={card.file}
          format={aspectRatio === '1:1' ? 'square' : 'vertical'}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
};

export default CarouselCardUpload;
