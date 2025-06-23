
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

  const processFile = useCallback(async (selectedFile: File) => {
    console.log('CarouselCardUpload - Processing file:', {
      fileName: selectedFile.name,
      fileType: selectedFile.type,
      format: format,
      aspectRatio: aspectRatio
    });
    
    setIsValidating(true);
    const validatedFile = await validateFile(selectedFile, format);
    console.log('CarouselCardUpload - Validation complete:', {
      valid: validatedFile.valid,
      hasPreview: !!validatedFile.preview
    });
    onFileChange(validatedFile);
    setIsValidating(false);
  }, [onFileChange, format, aspectRatio]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    await processFile(acceptedFiles[0]);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'video/*': ['.mp4', '.mov']
    },
    multiple: false,
    maxFiles: 1
  });

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,video/mp4,video/mov,video/quicktime';
    input.onchange = (event) => {
      const files = (event.target as HTMLInputElement).files;
      if (files && files.length > 0) {
        processFile(files[0]);
      }
    };
    input.click();
  };

  const handleReplaceClick = () => {
    handleUploadClick();
  };

  const handleRemoveClick = () => {
    onFileChange(undefined);
  };

  return (
    <>
      <MediaCard
        title={`🎴 Cartão ${cardNumber}`}
        format="square" // Use square for both 1:1 and 4:5 to maintain base format
        dimensions={dimensions}
        file={card.file}
        onPreviewClick={() => card.file && setLightboxOpen(true)}
        onUploadClick={handleUploadClick}
        onReplaceClick={handleReplaceClick}
        onRemoveClick={handleRemoveClick}
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
        urlMode={false}
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
