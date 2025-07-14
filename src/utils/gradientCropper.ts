interface CropRegion {
  x: number;
  y: number; 
  width: number;
  height: number;
}

interface ThumbnailSize {
  width: number;
  height: number;
}

const CROP_REGIONS: Record<'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5', CropRegion> = {
  // Formato quadrado - região central interessante
  square: { 
    x: 0.25,      // 25% da esquerda
    y: 0.25,      // 25% do topo  
    width: 0.5,   // 50% da largura
    height: 0.5   // 50% da altura
  },
  
  // Formato vertical - faixa vertical interessante
  vertical: { 
    x: 0.3,       // 30% da esquerda
    y: 0.1,       // 10% do topo
    width: 0.4,   // 40% da largura
    height: 0.8   // 80% da altura
  },
  
  // Formato horizontal - faixa horizontal interessante  
  horizontal: { 
    x: 0.1,       // 10% da esquerda
    y: 0.3,       // 30% do topo
    width: 0.8,   // 80% da largura
    height: 0.4   // 40% da altura
  },
  
  // Carrossel 1:1 - região superior esquerda para diferenciação
  'carousel-1:1': { 
    x: 0.15,      // 15% da esquerda
    y: 0.15,      // 15% do topo
    width: 0.7,   // 70% da largura
    height: 0.7   // 70% da altura
  },
  
  // Carrossel 4:5 - faixa vertical superior para diferenciação
  'carousel-4:5': { 
    x: 0.2,       // 20% da esquerda
    y: 0.05,      // 5% do topo
    width: 0.6,   // 60% da largura
    height: 0.9   // 90% da altura
  }
};

export const createGradientThumbnail = async (
  gradientPath: string,
  format: 'square' | 'vertical' | 'horizontal' | 'carousel-1:1' | 'carousel-4:5',
  thumbnailSize: ThumbnailSize
): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;
      
      // Configurar tamanho do thumbnail (2x para qualidade)
      canvas.width = thumbnailSize.width * 2;
      canvas.height = thumbnailSize.height * 2;
      
      // Obter região de crop
      const crop = CROP_REGIONS[format];
      const sourceX = img.width * crop.x;
      const sourceY = img.height * crop.y;
      const sourceWidth = img.width * crop.width;
      const sourceHeight = img.height * crop.height;
      
      // Extrair pedaço específico do gradiente
      ctx.drawImage(
        img,
        sourceX, sourceY, sourceWidth, sourceHeight,    // Source (crop)
        0, 0, canvas.width, canvas.height               // Destination (thumbnail)
      );
      
      // Adicionar overlay sutil para melhor contraste
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
      gradient.addColorStop(1, 'rgba(0,0,0,0.3)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // DEBUG: Confirmação e informações do thumbnail
      console.log('🎨 THUMBNAIL CRIADO:', { 
        format, 
        canvasSize: { width: canvas.width, height: canvas.height },
        thumbnailSize,
        cropRegion: crop,
        sourceSize: { width: img.width, height: img.height }
      });
      
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    
    img.src = gradientPath;
  });
};