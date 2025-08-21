export const getThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5') => {
  // Container é 160x160px com margem de 16px (total área disponível: 128x128px)
  const maxWidth = 128;
  const maxHeight = 128;
  
  let aspectRatio: number;
  
  // Para modo carrossel, usar as proporções específicas
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      aspectRatio = 4 / 5; // 0.8 - Carrossel 4:5 (mais alto que largo)
    } else {
      aspectRatio = 1; // 1:1 - Carrossel quadrado
    }
  } else {
    // Formatos normais (não carrossel)
    switch (format) {
      case 'square':
        aspectRatio = 1; // 1:1
        break;
      case 'vertical':
        aspectRatio = 9 / 16; // 0.5625 - Stories/Reels
        break;
      case 'horizontal':
        aspectRatio = 1.91; // 1.91:1 - Feed horizontal
        break;
      default:
        aspectRatio = 1;
    }
  }
  
  // Calcular dimensões que cabem na área disponível mantendo a proporção
  let width: number;
  let height: number;
  
  if (aspectRatio >= 1) {
    // Formato horizontal ou quadrado - limitar pela largura
    width = maxWidth;
    height = Math.round(width / aspectRatio);
    
    // Se altura exceder o máximo, ajustar pela altura
    if (height > maxHeight) {
      height = maxHeight;
      width = Math.round(height * aspectRatio);
    }
  } else {
    // Formato vertical - limitar pela altura
    height = maxHeight;
    width = Math.round(height * aspectRatio);
    
    // Se largura exceder o máximo, ajustar pela largura
    if (width > maxWidth) {
      width = maxWidth;
      height = Math.round(width / aspectRatio);
    }
  }
  
  // Remove debug logging for performance
  
  return { 
    width, 
    height 
  };
};

// CSS-based gradients instead of missing image files
import { createCSSGradientThumbnail } from './gradientCropper';
import { getCachedThumbnail, setCachedThumbnail } from './thumbnailCache';

const GRADIENT_STYLES = {
  square: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  vertical: 'linear-gradient(180deg, #ffecd2 0%, #fcb69f 100%)', 
  horizontal: 'linear-gradient(90deg, #a8edea 0%, #fed6e3 100%)',
  'carousel-1:1': 'linear-gradient(45deg, #d299c2 0%, #fef9d7 100%)',
  'carousel-4:5': 'linear-gradient(225deg, #ff9a9e 0%, #fecfef 50%, #fecfef 100%)'
};

export const getGradientStyle = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5'): string => {
  // CSS gradients específicos para carrossel e formatos normais
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      return GRADIENT_STYLES['carousel-4:5'];
    } else {
      return GRADIENT_STYLES['carousel-1:1'];
    }
  } else {
    switch (format) {
      case 'square':
        return GRADIENT_STYLES.square;
      case 'vertical':
        return GRADIENT_STYLES.vertical;
      case 'horizontal':
        return GRADIENT_STYLES.horizontal;
      default:
        return GRADIENT_STYLES.square;
    }
  }
};

export const generateThumbnailPreview = async (
  format: 'square' | 'vertical' | 'horizontal',
  carouselMode: boolean = false,
  carouselAspectRatio: '1:1' | '4:5' = '1:1'
): Promise<string> => {
  // Verificar cache primeiro
  const cached = getCachedThumbnail(format, carouselMode, carouselAspectRatio);
  if (cached) {
    return cached;
  }
  
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);
  
  // Determinar qual gradiente usar baseado no formato e modo carrossel
  let gradientKey: string;
  let gradientFormat: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5';
  
  if (carouselMode) {
    gradientKey = carouselAspectRatio === '4:5' ? 'carousel-4:5' : 'carousel-1:1';
    gradientFormat = carouselAspectRatio === '4:5' ? 'carousel-4:5' : 'carousel-1:1';
  } else {
    gradientKey = format;
    gradientFormat = format;
  }
  
  // Usar gradientes CSS em vez de imagens ausentes
  const gradientStyle = GRADIENT_STYLES[gradientKey as keyof typeof GRADIENT_STYLES];
  
  const result = await createCSSGradientThumbnail(gradientStyle, gradientFormat as 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5', { width, height });
  
  // Salvar no cache
  setCachedThumbnail(format, carouselMode, carouselAspectRatio, result);
  
  return result;
};

// Função auxiliar para obter texto de exibição
export const getDisplayText = (format: 'square' | 'vertical' | 'horizontal', carouselMode: boolean, carouselAspectRatio?: '1:1' | '4:5'): string => {
  if (carouselMode) {
    return carouselAspectRatio === '4:5' ? '4:5' : '1:1';
  } else {
    if (format === 'square') {
      return '1:1';
    } else if (format === 'vertical') {
      return '9:16';
    } else {
      return '1.91:1';
    }
  }
};
