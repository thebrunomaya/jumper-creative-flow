
export const getThumbnailDimensions = (format: 'square' | 'vertical' | 'horizontal') => {
  // Container disponível: 150px de largura e 150px de altura
  // Garantindo margem mínima exata de 4px para TODOS os formatos
  const containerWidth = 150;
  const containerHeight = 150;
  const minMargin = 4;
  
  let aspectRatio: number;
  
  switch (format) {
    case 'square':
      aspectRatio = 1; // 1:1
      break;
    case 'vertical':
      aspectRatio = 9 / 16; // 9:16
      break;
    case 'horizontal':
      aspectRatio = 1.91; // 1.91:1
      break;
    default:
      aspectRatio = 1;
  }
  
  // Calcular dimensões garantindo 4px de margem para todos os formatos
  let width: number;
  let height: number;
  
  // Primeiro, calcular o tamanho máximo disponível (container menos margem)
  const maxWidth = containerWidth - minMargin;
  const maxHeight = containerHeight - minMargin;
  
  // Calcular dimensões baseadas no aspect ratio
  if (aspectRatio >= 1) {
    // Formato horizontal ou quadrado - limitar pela largura
    width = maxWidth;
    height = width / aspectRatio;
    
    // Se a altura exceder o limite, ajustar pela altura
    if (height > maxHeight) {
      height = maxHeight;
      width = height * aspectRatio;
    }
  } else {
    // Formato vertical - limitar pela altura
    height = maxHeight;
    width = height * aspectRatio;
    
    // Se a largura exceder o limite, ajustar pela largura
    if (width > maxWidth) {
      width = maxWidth;
      height = width / aspectRatio;
    }
  }
  
  return { 
    width: Math.round(width), 
    height: Math.round(height) 
  };
};

export const createMockupFile = (format: 'square' | 'vertical' | 'horizontal') => {
  const canvas = document.createElement('canvas');
  const { width, height } = getThumbnailDimensions(format);
  canvas.width = width * 3;
  canvas.height = height * 3;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
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
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);
    
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      format === 'square' ? '1:1' : format === 'vertical' ? '9:16' : '1.91:1',
      canvas.width / 2,
      canvas.height / 2
    );
  }
  
  return canvas.toDataURL('image/png');
};
