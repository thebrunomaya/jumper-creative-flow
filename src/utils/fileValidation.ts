import { META_SPECS, ValidatedFile } from '@/types/creative';

export const validateImage = (file: File, format?: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5'): Promise<{ valid: boolean; width: number; height: number; message: string }> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Revoke the object URL after processing
      URL.revokeObjectURL(img.src);
      
      let isValid = false;
      let expectedDimensions = '';

      if (format) {
        // Validate specific format with exact dimensions or higher multiples
        console.log(`🔍 Validating image for format: ${format}`, {
          width: img.width,
          height: img.height,
          aspectRatio: img.width / img.height
        });
        
        switch (format) {
          case 'square':
            // For square: accept 1080x1080 or any larger square image with 1:1 aspect ratio
            isValid = img.width >= 1080 && img.height >= 1080 && img.width === img.height;
            expectedDimensions = '1080x1080px ou múltiplos superiores (1:1)';
            console.log(`✓ Square validation:`, {
              dimensionsOK: img.width >= 1080 && img.height >= 1080,
              aspectRatioOK: img.width === img.height,
              result: isValid
            });
            break;
          case 'vertical':
            // For vertical: accept 1080x1920 or proportional larger images (9:16 ratio)
            const verticalAspectRatio = 9 / 16; // 0.5625 (width/height)
            const imageAspectRatio = img.width / img.height;
            const aspectRatioTolerance = 0.01; // Small tolerance for floating point precision
            isValid = img.width >= 1080 && img.height >= 1920 && 
                     Math.abs(imageAspectRatio - verticalAspectRatio) < aspectRatioTolerance;
            expectedDimensions = '1080x1920px ou múltiplos superiores (9:16)';
            console.log(`✓ Vertical validation:`, {
              dimensionsOK: img.width >= 1080 && img.height >= 1920,
              aspectRatio: imageAspectRatio.toFixed(4),
              expectedRatio: verticalAspectRatio.toFixed(4),
              difference: Math.abs(imageAspectRatio - verticalAspectRatio).toFixed(4),
              tolerance: aspectRatioTolerance,
              aspectRatioOK: Math.abs(imageAspectRatio - verticalAspectRatio) < aspectRatioTolerance,
              result: isValid
            });
            break;
          case 'horizontal':
            // For horizontal: accept 1200x628 or proportional larger images (1.91:1 ratio)
            const horizontalAspectRatio = 1.91; // width/height
            const imageHorizontalRatio = img.width / img.height;
            const horizontalTolerance = 0.05; // Slightly larger tolerance
            isValid = img.width >= 1200 && img.height >= 628 && 
                     Math.abs(imageHorizontalRatio - horizontalAspectRatio) < horizontalTolerance;
            expectedDimensions = '1200x628px ou múltiplos superiores (1.91:1)';
            console.log(`✓ Horizontal validation:`, {
              dimensionsOK: img.width >= 1200 && img.height >= 628,
              aspectRatio: imageHorizontalRatio.toFixed(4),
              expectedRatio: horizontalAspectRatio.toFixed(4),
              difference: Math.abs(imageHorizontalRatio - horizontalAspectRatio).toFixed(4),
              tolerance: horizontalTolerance,
              aspectRatioOK: Math.abs(imageHorizontalRatio - horizontalAspectRatio) < horizontalTolerance,
              result: isValid
            });
            break;
          case 'carousel-1:1':
            // For carousel 1:1: accept 1080x1080 or any larger square image with 1:1 aspect ratio
            isValid = img.width >= 1080 && img.height >= 1080 && img.width === img.height;
            expectedDimensions = '1080x1080px ou múltiplos superiores (1:1)';
            break;
          case 'carousel-4:5':
            // For carousel 4:5: accept 1080x1350 or proportional larger images (4:5 ratio)
            const carousel45AspectRatio = 4 / 5; // 0.8 (width/height)
            const imageCarousel45Ratio = img.width / img.height;
            const carousel45Tolerance = 0.01; // Small tolerance for floating point precision
            isValid = img.width >= 1080 && img.height >= 1350 && 
                     Math.abs(imageCarousel45Ratio - carousel45AspectRatio) < carousel45Tolerance;
            expectedDimensions = '1080x1350px ou múltiplos superiores (4:5)';
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
      // Revoke the object URL on error
      URL.revokeObjectURL(img.src);
      
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

export const validateVideo = (file: File, format?: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5'): Promise<{ valid: boolean; duration: number; width?: number; height?: number; message: string }> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      // Revoke the object URL after processing
      URL.revokeObjectURL(video.src);
      
      const duration = Math.round(video.duration);
      const width = video.videoWidth;
      const height = video.videoHeight;
      
      
      // Validate duration
      const isCarousel = format?.startsWith('carousel-');
      const minDuration = isCarousel ? 1 : 15;
      const maxDuration = isCarousel ? 14400 : 60;
      const isValidDuration = duration >= minDuration && duration <= maxDuration;
      
      // Validate dimensions based on format
      let isValidDimensions = true;
      let dimensionMessage = '';
      
      if (format) {
        switch (format) {
          case 'square':
            isValidDimensions = width >= 1080 && height >= 1080 && width === height;
            dimensionMessage = isValidDimensions 
              ? `Dimensões corretas (${width}x${height}px)` 
              : `Dimensão inválida (${width}x${height}px). Use 1080x1080px ou múltiplos superiores (1:1)`;
            break;
          case 'vertical':
            const verticalAspectRatio = 9 / 16; // 0.5625
            const videoAspectRatio = width / height;
            const aspectRatioTolerance = 0.01;
            isValidDimensions = width >= 1080 && height >= 1920 && 
                              Math.abs(videoAspectRatio - verticalAspectRatio) < aspectRatioTolerance;
            dimensionMessage = isValidDimensions 
              ? `Dimensões corretas (${width}x${height}px)` 
              : `Dimensão inválida (${width}x${height}px). Use 1080x1920px ou múltiplos superiores (9:16)`;
            break;
          case 'horizontal':
            const horizontalAspectRatio = 1.91;
            const videoHorizontalRatio = width / height;
            const horizontalTolerance = 0.05;
            isValidDimensions = width >= 1200 && height >= 628 && 
                              Math.abs(videoHorizontalRatio - horizontalAspectRatio) < horizontalTolerance;
            dimensionMessage = isValidDimensions 
              ? `Dimensões corretas (${width}x${height}px)` 
              : `Dimensão inválida (${width}x${height}px). Use 1200x628px ou múltiplos superiores (1.91:1)`;
            break;
          case 'carousel-1:1':
            isValidDimensions = width >= 1080 && height >= 1080 && width === height;
            dimensionMessage = isValidDimensions 
              ? `Dimensões corretas (${width}x${height}px)` 
              : `Dimensão inválida (${width}x${height}px). Use 1080x1080px ou múltiplos superiores (1:1)`;
            break;
          case 'carousel-4:5':
            const carousel45AspectRatio = 4 / 5; // 0.8
            const videoCarousel45Ratio = width / height;
            const carousel45Tolerance = 0.01;
            isValidDimensions = width >= 1080 && height >= 1350 && 
                              Math.abs(videoCarousel45Ratio - carousel45AspectRatio) < carousel45Tolerance;
            dimensionMessage = isValidDimensions 
              ? `Dimensões corretas (${width}x${height}px)` 
              : `Dimensão inválida (${width}x${height}px). Use 1080x1350px ou múltiplos superiores (4:5)`;
            break;
        }
      }
      
      const durationText = isCarousel ? '1s-240min' : '15-60s';
      const durationMessage = isValidDuration 
        ? `Duração válida (${duration}s)` 
        : `Duração inválida (${duration}s). Use entre ${durationText}`;
      
      const isValid = isValidDuration && isValidDimensions;
      const messages = [];
      if (!isValidDuration) messages.push(durationMessage);
      if (!isValidDimensions) messages.push(dimensionMessage);
      if (isValid) messages.push('Vídeo válido');
      
      resolve({
        valid: isValid,
        duration,
        width,
        height,
        message: messages.join(' | ')
      });
    };
    
    video.onerror = () => {
      // Revoke the object URL on error
      URL.revokeObjectURL(video.src);
      
      resolve({
        valid: false,
        duration: 0,
        message: 'Erro ao carregar vídeo'
      });
    };
    
    video.src = URL.createObjectURL(file);
  });
};

export const validateFileSize = (file: File, isVideo: boolean, isCarousel?: boolean): { valid: boolean; message: string } => {
  // Supabase Pro supports up to 5GB, but we'll limit to 1GB for performance
  const maxImageSize = 1024 * 1024 * 1024; // 1GB for images
  const maxVideoSize = 1024 * 1024 * 1024; // 1GB for videos
  
  const maxSize = isVideo ? maxVideoSize : maxImageSize;
  const sizeInMB = file.size / (1024 * 1024);
  const maxSizeInMB = maxSize / (1024 * 1024);
  
  return {
    valid: file.size <= maxSize,
    message: file.size <= maxSize 
      ? `Tamanho válido (${sizeInMB.toFixed(1)}MB)` 
      : `Arquivo muito grande (${sizeInMB.toFixed(1)}MB). Máximo: ${maxSizeInMB >= 1024 ? (maxSizeInMB/1024).toFixed(1) + 'GB' : maxSizeInMB + 'MB'}`
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

export const validateFile = async (file: File, format?: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5'): Promise<ValidatedFile> => {
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
  const isCarousel = format?.startsWith('carousel-');
  console.log('validateFile - File type detection:', { isVideo, isImage, isCarousel });

  // Validate file size
  const sizeValidation = validateFileSize(file, isVideo, isCarousel);
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

  // Validate duration and dimensions for videos
  if (isVideo && typeValidation.valid) {
    console.log('validateFile - Validating video duration and dimensions');
    const videoValidation = await validateVideo(file, format);
    duration = videoValidation.duration;
    if (videoValidation.width && videoValidation.height) {
      dimensions = { width: videoValidation.width, height: videoValidation.height };
    }
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
    
    // Schedule revocation after a delay to ensure the preview is used
    setTimeout(() => {
      if (preview) {
        URL.revokeObjectURL(preview);
        console.log('validateFile - Revoked preview URL after timeout');
      }
    }, 30000); // 30 seconds timeout
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
