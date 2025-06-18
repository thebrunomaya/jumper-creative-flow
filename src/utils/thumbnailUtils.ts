
export const getThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal', carouselMode = false, carouselAspectRatio?: '1:1' | '4:5') => {
  // Largura fixa para todos os formatos para favorecer o posicionamento vertical
  const fixedWidth = 120;
  
  let aspectRatio: number;
  
  // Para modo carrossel, usar as proporções específicas
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      aspectRatio = 4 / 5; // 0.8 - Carrossel 4:5 (mais alto que largo)
    } else {
      aspectRatio = 1; // 1:1 - Carrossel quadrado
    }
  } else {
    // Formatos normais (não carrossel) - ajustar vertical para caber no container
    switch (format) {
      case 'square':
        aspectRatio = 1; // 1:1
        break;
      case 'vertical':
        // Limitar altura para caber no container de 160px - ajustar para proporção mais adequada
        aspectRatio = 9 / 14; // Aproximadamente 0.64 - mais compacto que 9:16 original
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
  
  // Usar dimensões reais do carrossel para o canvas
  if (carouselMode) {
    if (carouselAspectRatio === '4:5') {
      // Canvas 4:5 - 1080x1350 scaled down
      canvas.width = width * 3; // 360px
      canvas.height = Math.round((width * 3) * (5/4)); // 450px (360 * 1.25)
    } else {
      // Canvas 1:1 - 1080x1080 scaled down
      canvas.width = width * 3; // 360px
      canvas.height = width * 3; // 360px
    }
  } else {
    canvas.width = width * 3;
    canvas.height = height * 3;
  }
  
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    
    // Cores específicas para carrossel e formatos normais
    if (carouselMode) {
      if (carouselAspectRatio === '4:5') {
        gradient.addColorStop(0, '#fef3c7'); // Amarelo claro
        gradient.addColorStop(1, '#f59e0b'); // Laranja/amarelo
      } else {
        // 1:1 mantém cor azul
        gradient.addColorStop(0, '#dbeafe');
        gradient.addColorStop(1, '#3b82f6');
      }
    } else {
      // Cores originais para formatos normais
      switch (format) {
        case 'square':
          gradient.addColorStop(0, '#dbeafe'); // Azul claro
          gradient.addColorStop(1, '#3b82f6'); // Azul
          break;
        case 'vertical':
          gradient.addColorStop(0, '#faf5ff'); // Roxo claro
          gradient.addColorStop(1, '#8b5cf6'); // Roxo
          break;
        case 'horizontal':
          gradient.addColorStop(0, '#f0fdf4'); // Verde claro
          gradient.addColorStop(1, '#22c55e'); // Verde
          break;
      }
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    ctx.fillStyle = '#374151';
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
