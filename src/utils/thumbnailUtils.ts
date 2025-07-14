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
    // Different solid colors based on type  
    let solidColor: string;
    
    // Cores específicas para carrossel e formatos normais
    if (carouselMode) {
      if (carouselAspectRatio === '4:5') {
        solidColor = '#f59e0b'; // Laranja/amarelo sólido
      } else {
        // 1:1 mantém cor azul
        solidColor = '#3b82f6';
      }
    } else {
      // Cores originais para formatos normais
      switch (format) {
        case 'square':
          solidColor = '#3b82f6'; // Azul
          break;
        case 'vertical':
          solidColor = '#8b5cf6'; // Roxo
          break;
        case 'horizontal':
          solidColor = '#22c55e'; // Verde
          break;
        default:
          solidColor = '#3b82f6';
      }
    }
    
    // Preencher o fundo com cor sólida
    ctx.fillStyle = solidColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Borda externa sólida
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    // REMOVIDO: Área de proteção com linha tracejada pontilhada
    // A linha tracejada foi completamente removida
    
    // Texto central
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Texto correto baseado no modo
    let displayText = '';
    if (carouselMode) {
      displayText = carouselAspectRatio === '4:5' ? '4:5' : '1:1';
    } else {
      if (format === 'square') {
        displayText = '1:1';
      } else if (format === 'vertical') {
        displayText = '9:16';
      } else {
        displayText = '1.91:1';
      }
    }
    
    ctx.fillText(
      displayText,
      canvas.width / 2,
      canvas.height / 2
    );
  }
  
  return canvas.toDataURL('image/png');
};
