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
  
  return { 
    width, 
    height 
  };
};

// Import gradient images - Gradientes Orgânicos Jumper Studio
import gradientSquare from '../assets/gradients/organic-01.png';
import gradientVertical from '../assets/gradients/organic-02.png';
import gradientHorizontal from '../assets/gradients/organic-03.png';
import { createGradientThumbnail } from './gradientCropper';
import { getCachedThumbnail, setCachedThumbnail } from './thumbnailCache';

const GRADIENT_MAPPING = {
  square: gradientSquare,
  vertical: gradientVertical, 
  horizontal: gradientHorizontal
};

export const getGradientImage = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5'): string => {
  // Gradientes específicos para carrossel e formatos normais
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      return gradientVertical; // Vertical para 4:5
    } else {
      // 1:1 usa gradiente quadrado
      return gradientSquare;
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
  
  // Determinar qual gradiente usar baseado no formato e modo carrossel
  let gradientFormat: 'square' | 'vertical' | 'horizontal' = format;
  
  if (carouselMode) {
    gradientFormat = carouselAspectRatio === '4:5' ? 'vertical' : 'square';
  }
  
  // Usar gradientes orgânicos locais com crop inteligente
  const gradientPath = GRADIENT_MAPPING[gradientFormat];
  
  const result = await createGradientThumbnail(gradientPath, gradientFormat, { width, height });
  
  // Salvar no cache
  setCachedThumbnail(format, carouselMode, carouselAspectRatio, result);
  
  return result;
};

export const createMockupFile = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5') => {
  const canvas = document.createElement('canvas');
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);
  
  // Usar dimensões calculadas para o canvas com escala 2x para qualidade
  canvas.width = width * 2;
  canvas.height = height * 2;
  
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Usar gradiente CSS como fallback para compatibilidade
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    // Gradientes baseados no formato
    if (carouselMode) {
      if (carouselAspectRatio === '4:5') {
        gradient.addColorStop(0, '#6366f1');
        gradient.addColorStop(1, '#8b5cf6');
      } else {
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
      }
    } else {
      switch (format) {
        case 'square':
          gradient.addColorStop(0, '#3b82f6');
          gradient.addColorStop(1, '#1d4ed8');
          break;
        case 'vertical':
          gradient.addColorStop(0, '#6366f1');
          gradient.addColorStop(1, '#8b5cf6');
          break;
        case 'horizontal':
          gradient.addColorStop(0, '#059669');
          gradient.addColorStop(1, '#047857');
          break;
        default:
          gradient.addColorStop(0, '#6B7280');
          gradient.addColorStop(1, '#4B5563');
      }
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Continuar com borda e texto
    drawBorderAndText(ctx, canvas, format, carouselMode, carouselAspectRatio);
  }
  
  return canvas.toDataURL('image/png');
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

// Função auxiliar para desenhar borda e texto (fallback)
const drawBorderAndText = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, format: 'square' | 'vertical' | 'horizontal', carouselMode: boolean, carouselAspectRatio?: '1:1' | '4:5') => {
  // Borda externa sólida
  ctx.strokeStyle = '#e5e7eb';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
  
  // Texto central
  ctx.fillStyle = '#374151';
  ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const displayText = getDisplayText(format, carouselMode, carouselAspectRatio);
  
  ctx.fillText(
    displayText,
    canvas.width / 2,
    canvas.height / 2
  );
};
