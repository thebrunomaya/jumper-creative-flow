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
  
  // DEBUG: Mostrar cálculos das dimensões
  console.log('📐 Dimension calc:', {
    format,
    carouselMode,
    carouselAspectRatio,
    aspectRatio,
    finalDimensions: { width, height },
    isVertical: aspectRatio < 1,
    isHorizontal: aspectRatio > 1
  });
  
  return { 
    width, 
    height 
  };
};

// Import gradient images - Gradientes Orgânicos Jumper Studio
import gradientSquare from '../assets/gradients/organic-01.png';
import gradientVertical from '../assets/gradients/organic-02.png';
import gradientHorizontal from '../assets/gradients/organic-03.png';
import gradientCarousel11 from '../assets/gradients/organic-01.png';
import gradientCarousel45 from '../assets/gradients/organic-05.png';
import { createGradientThumbnail } from './gradientCropper';
import { getCachedThumbnail, setCachedThumbnail } from './thumbnailCache';

const GRADIENT_MAPPING = {
  square: gradientSquare,
  vertical: gradientVertical, 
  horizontal: gradientHorizontal,
  'carousel-1:1': gradientCarousel11,
  'carousel-4:5': gradientCarousel45
};

export const getGradientImage = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5'): string => {
  // Gradientes específicos para carrossel e formatos normais
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      return gradientCarousel45; // Gradiente específico para 4:5
    } else {
      // 1:1 usa gradiente específico para carrossel
      return gradientCarousel11;
    }
  } else {
    // Gradientes oficiais para formatos normais
    switch (format) {
      case 'square':
        return gradientSquare;
      case 'vertical':
        return gradientVertical;
      case 'horizontal':
        return gradientHorizontal;
      default:
        return gradientSquare;
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
  console.log('🎨 Dimensions:', { format, carouselMode, carouselAspectRatio, width, height });
  
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
  
  // Usar gradientes orgânicos locais com crop inteligente
  const gradientPath = GRADIENT_MAPPING[gradientKey as keyof typeof GRADIENT_MAPPING];
  
  console.log('🎨 Gradient info:', { gradientKey, gradientFormat, gradientPath });
  
  const result = await createGradientThumbnail(gradientPath, gradientFormat as 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5', { width, height });
  
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
