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

export const createMockupFile = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5') => {
  const canvas = document.createElement('canvas');
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);
  
  // Usar dimensões calculadas para o canvas com escala 2x para qualidade
  canvas.width = width * 2;
  canvas.height = height * 2;
  
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Gradientes oficiais da Jumper Studio
    let gradientUrl: string;
    
    // Gradientes específicos para carrossel e formatos normais
    if (carouselMode) {
      if (carouselAspectRatio === '4:5') {
        gradientUrl = 'https://jumper.studio/wp-content/uploads/2025/07/JMP-GR02.png'; // Vertical para 4:5
      } else {
        // 1:1 usa gradiente quadrado
        gradientUrl = 'https://jumper.studio/wp-content/uploads/2025/07/JMP-GR01.png';
      }
    } else {
      // Gradientes oficiais para formatos normais
      switch (format) {
        case 'square':
          gradientUrl = 'https://jumper.studio/wp-content/uploads/2025/07/JMP-GR01.png';
          break;
        case 'vertical':
          gradientUrl = 'https://jumper.studio/wp-content/uploads/2025/07/JMP-GR02.png';
          break;
        case 'horizontal':
          gradientUrl = 'https://jumper.studio/wp-content/uploads/2025/07/JMP-GR03.png';
          break;
        default:
          gradientUrl = 'https://jumper.studio/wp-content/uploads/2025/07/JMP-GR01.png';
      }
    }
    
    // Carregar e desenhar imagem de gradiente
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      // Borda externa sutil
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
      
      // Texto central com fundo semi-transparente
      const textBackgroundAlpha = 0.8;
      ctx.fillStyle = `rgba(255, 255, 255, ${textBackgroundAlpha})`;
      
      // Calcular tamanho do fundo do texto
      ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
      const textToShow = getDisplayText(format, carouselMode, carouselAspectRatio);
      const textMetrics = ctx.measureText(textToShow);
      const textWidth = textMetrics.width;
      const textHeight = 20;
      
      // Desenhar fundo do texto
      const bgPadding = 8;
      const bgX = (canvas.width - textWidth) / 2 - bgPadding;
      const bgY = (canvas.height - textHeight) / 2 - bgPadding;
      const bgWidth = textWidth + (bgPadding * 2);
      const bgHeight = textHeight + (bgPadding * 2);
      
      ctx.fillRect(bgX, bgY, bgWidth, bgHeight);
      
      // Texto central
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      ctx.fillText(
        textToShow,
        canvas.width / 2,
        canvas.height / 2
      );
    };
    
    img.onerror = () => {
      // Fallback para cor sólida se imagem não carregar
      let fallbackColor: string;
      if (carouselMode) {
        fallbackColor = carouselAspectRatio === '4:5' ? '#6B7280' : '#6B7280';
      } else {
        fallbackColor = '#6B7280'; // Cinza neutro
      }
      
      ctx.fillStyle = fallbackColor;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Continuar com borda e texto
      drawBorderAndText(ctx, canvas, format, carouselMode, carouselAspectRatio);
    };
    
    img.src = gradientUrl;
    
    // Se a imagem já estiver em cache, o onload pode ser chamado sincronamente
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawBorderAndText(ctx, canvas, format, carouselMode, carouselAspectRatio);
    }
  }
  
  return canvas.toDataURL('image/png');
};

// Função auxiliar para obter texto de exibição
const getDisplayText = (format: 'square' | 'vertical' | 'horizontal', carouselMode: boolean, carouselAspectRatio?: '1:1' | '4:5'): string => {
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
