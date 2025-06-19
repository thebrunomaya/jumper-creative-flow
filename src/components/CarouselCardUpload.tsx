
import React, { useCallback, useState } from 'react';
import { CarouselCard, ValidatedFile } from '@/types/creative';
import { validateFile } from '@/utils/fileValidation';
import { useDropzone } from 'react-dropzone';
import MediaPreviewLightbox from './MediaPreviewLightbox';
import MediaCard from './MediaCard';

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

  const handleUploadClick = () => {
    document.getElementById(`replace-carousel-${card.id}`)?.click();
  };

  return (
    <>
      <MediaCard
        title={`🎴 Cartão ${cardNumber}`}
        format="square" // Use square for both 1:1 and 4:5 to maintain base format
        dimensions={dimensions}
        file={card.file}
        onPreviewClick={() => setLightboxOpen(true)}
        onUploadClick={handleUploadClick}
        onReplaceClick={handleReplace}
        onRemoveClick={removeFile}
        enabled={true}
        carouselMode={true}
        carouselAspectRatio={aspectRatio}
        getRootProps={getRootProps}
        getInputProps={getInputProps}
        isDragActive={isDragActive}
        isValidating={isValidating}
        showHeader={true}
        onRemove={onRemove}
        canRemove={canRemove}
      />

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
          format="square" // Use square as base format
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
          carouselMode={true}
          carouselAspectRatio={aspectRatio}
        />
      )}
    </>
  );
};

export default CarouselCardUpload;
