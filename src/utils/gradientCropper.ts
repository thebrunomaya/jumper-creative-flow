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

const CROP_REGIONS: Record<'square' | 'vertical' | 'horizontal', CropRegion> = {
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
  }
};

export const createGradientThumbnail = async (
  gradientPath: string,
  format: 'square' | 'vertical' | 'horizontal',
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
      
      // Adicionar texto do formato
      ctx.fillStyle = 'white';
      ctx.font = 'bold 16px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.lineWidth = 3;
      
      const text = format === 'square' ? '1:1' : 
                   format === 'vertical' ? '9:16' : '1.91:1';
      
      ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
      
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    
    img.src = gradientPath;
  });
};