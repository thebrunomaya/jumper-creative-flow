
import { META_SPECS, ValidatedFile } from '@/types/creative';

export const validateImage = (file: File, format?: 'square' | 'vertical' | 'horizontal'): Promise<{ valid: boolean; width: number; height: number; message: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let isValid = false;
      let expectedDimensions = '';

      if (format) {
        // Validate specific format with exact dimensions or higher multiples
        switch (format) {
          case 'square':
            // For square: accept 1080x1080 or any larger square image with 1:1 aspect ratio
            isValid = img.width >= 1080 && img.height >= 1080 && img.width === img.height;
            expectedDimensions = '1080x1080px ou múltiplos superiores (1:1)';
            break;
          case 'vertical':
            // For vertical: accept 1080x1920 or proportional larger images (9:16 ratio)
            const verticalAspectRatio = 9 / 16; // 0.5625 (width/height)
            const imageAspectRatio = img.width / img.height;
            const aspectRatioTolerance = 0.01; // Small tolerance for floating point precision
            isValid = img.width >= 1080 && img.height >= 1920 && 
                     Math.abs(imageAspectRatio - verticalAspectRatio) < aspectRatioTolerance;
            expectedDimensions = '1080x1920px ou múltiplos superiores (9:16)';
            break;
          case 'horizontal':
            // For horizontal: accept 1200x628 or proportional larger images (1.91:1 ratio)
            const horizontalAspectRatio = 1.91; // width/height
            const imageHorizontalRatio = img.width / img.height;
            const horizontalTolerance = 0.05; // Slightly larger tolerance
            isValid = img.width >= 1200 && img.height >= 628 && 
                     Math.abs(imageHorizontalRatio - horizontalAspectRatio) < horizontalTolerance;
            expectedDimensions = '1200x628px ou múltiplos superiores (1.91:1)';
            break;
        }
      } else {
        // Original validation for backward compatibility
        const isValidFeed = img.width === 1080 && img.height === 1080;
        const isValidStories = img.width === 1080 && img.height === 1920;
        isValid = isValidFeed || isValidStories;
        expectedDimensions = '1080x1080 ou 1080x1920px';
      }
      
      resolve({
        valid: isValid,
        width: img.width,
        height: img.height,
        message: isValid 
          ? `Dimensões corretas (${img.width}x${img.height}px)` 
          : `Dimensão inválida (${img.width}x${img.height}px). Use ${expectedDimensions}`
      });
    };
    img.onerror = () => {
      resolve({
        valid: false,
        width: 0,
        height: 0,
        message: 'Erro ao carregar imagem'
      });
    };
    img.src = URL.createObjectURL(file);
  });
};

export const validateVideo = (file: File): Promise<{ valid: boolean; duration: number; message: string }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      const duration = Math.round(video.duration);
      const isValidDuration = duration >= 15 && duration <= 60;
      
      resolve({
        valid: isValidDuration,
        duration,
        message: isValidDuration 
          ? `Duração válida (${duration}s)` 
          : `Duração inválida (${duration}s). Use entre 15-60 segundos`
      });
    };
    
    video.onerror = () => {
      resolve({
        valid: false,
        duration: 0,
        message: 'Erro ao carregar vídeo'
      });
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const validateFileSize = (file: File, isVideo: boolean): { valid: boolean; message: string } => {
  const maxSize = isVideo ? META_SPECS.video.feed.maxSize : META_SPECS.image.square.maxSize;
  const sizeInMB = file.size / (1024 * 1024);
  const maxSizeInMB = maxSize / (1024 * 1024);
  
  return {
    valid: file.size <= maxSize,
    message: file.size <= maxSize 
      ? `Tamanho válido (${sizeInMB.toFixed(1)}MB)` 
      : `Arquivo muito grande (${sizeInMB.toFixed(1)}MB). Máximo: ${maxSizeInMB}MB`
  };
};

export const validateFileType = (file: File): { valid: boolean; message: string } => {
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  const videoTypes = ['video/mp4', 'video/mov', 'video/quicktime'];
  const allValidTypes = [...imageTypes, ...videoTypes];
  
  return {
    valid: allValidTypes.includes(file.type),
    message: allValidTypes.includes(file.type) 
      ? 'Formato válido' 
      : 'Formato inválido. Use JPG, PNG, MP4 ou MOV'
  };
};

export const validateFile = async (file: File, format?: 'square' | 'vertical' | 'horizontal'): Promise<ValidatedFile> => {
  console.log('validateFile - Starting validation:', {
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
    format: format
  });

  const errors: string[] = [];
  let valid = true;
  let dimensions: { width: number; height: number } | undefined;
  let duration: number | undefined;

  // Validate file type
  const typeValidation = validateFileType(file);
  console.log('validateFile - Type validation:', typeValidation);
  if (!typeValidation.valid) {
    errors.push(typeValidation.message);
    valid = false;
  }

  const isVideo = file.type.startsWith('video/');
  const isImage = file.type.startsWith('image/');
  console.log('validateFile - File type detection:', { isVideo, isImage });

  // Validate file size
  const sizeValidation = validateFileSize(file, isVideo);
  console.log('validateFile - Size validation:', sizeValidation);
  if (!sizeValidation.valid) {
    errors.push(sizeValidation.message);
    valid = false;
  }

  // Validate dimensions for images
  if (isImage && typeValidation.valid) {
    console.log('validateFile - Validating image dimensions');
    const imageValidation = await validateImage(file, format);
    dimensions = { width: imageValidation.width, height: imageValidation.height };
    console.log('validateFile - Image validation result:', imageValidation);
    if (!imageValidation.valid) {
      errors.push(imageValidation.message);
      valid = false;
    }
  }

  // Validate duration for videos
  if (isVideo && typeValidation.valid) {
    console.log('validateFile - Validating video duration');
    const videoValidation = await validateVideo(file);
    duration = videoValidation.duration;
    console.log('validateFile - Video validation result:', videoValidation);
    if (!videoValidation.valid) {
      errors.push(videoValidation.message);
      valid = false;
    }
  }

  // Create preview for both images AND videos
  let preview: string | undefined;
  if (isImage || isVideo) {
    preview = URL.createObjectURL(file);
    console.log('validateFile - Created preview URL:', { preview: !!preview, isVideo, isImage });
  }

  const result = {
    file,
    valid,
    dimensions,
    duration,
    errors: errors.length > 0 ? errors : (valid ? ['Arquivo válido'] : ['Erro na validação']),
    preview,
    format
  };

  console.log('validateFile - Final result:', {
    valid: result.valid,
    hasPreview: !!result.preview,
    hasErrors: result.errors.length > 0,
    duration: result.duration
  });

  return result;
};

export const validateText = (text: string, maxLength: number) => {
  const count = text.length;
  const percentage = count / maxLength;
  
  return {
    valid: count <= maxLength,
    count,
    maxLength,
    percentage,
    color: count > maxLength ? 'text-red-500' : 
           percentage > 0.9 ? 'text-orange-500' : 
           percentage > 0.7 ? 'text-yellow-500' : 'text-green-500'
  };
};
