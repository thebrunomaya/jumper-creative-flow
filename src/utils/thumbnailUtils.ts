
export const getThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5') => {
  // Largura fixa para todos os formatos para favorecer o posicionamento vertical
  const fixedWidth = 120;
  
  let aspectRatio: number;
  
  // Para modo carrossel, usar as proporções específicas
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      aspectRatio = 4 / 5; // 0.8 - Carrossel 4:5
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
        aspectRatio = 9 / 16; // 9:16 - Stories/Reels
        break;
      case 'horizontal':
        aspectRatio = 1.91; // 1.91:1
        break;
      default:
        aspectRatio = 1;
    }
  }
  
  // Calcular altura baseada na largura fixa e aspect ratio
  const height = Math.round(fixedWidth / aspectRatio);
  
  return { 
    width: fixedWidth, 
    height 
  };
};

export const createMockupFile = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5') => {
  const canvas = document.createElement('canvas');
  const { width, height } = getThumbnailDimensions(format, carouselMode, carouselAspectRatio);
  canvas.width = width * 3;
  canvas.height = height * 3;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    // Cores específicas para carrossel
    if (carouselMode) {
      if (carouselAspectRatio === '4:5') {
        gradient.addColorStop(0, '#fef3c7');
        gradient.addColorStop(1, '#f59e0b');
      } else {
        gradient.addColorStop(0, '#dbeafe');
        gradient.addColorStop(1, '#3b82f6');
      }
    } else {
      // Cores originais para formatos normais
      switch (format) {
        case 'square':
          gradient.addColorStop(0, '#f8fafc');
          gradient.addColorStop(1, '#e2e8f0');
          break;
        case 'vertical':
          gradient.addColorStop(0, '#faf5ff');
          gradient.addColorStop(1, '#e9d5ff');
          break;
        case 'horizontal':
          gradient.addColorStop(0, '#f0fdf4');
          gradient.addColorStop(1, '#dcfce7');
          break;
      }
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
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
