
import { ValidatedFile } from '@/types/creative';

export interface MediaAnalysis {
  aspectRatio: string;
  quality: {
    sharpness: 'low' | 'medium' | 'high';
    brightness: 'dark' | 'normal' | 'bright';
    contrast: 'low' | 'medium' | 'high';
  };
  compatibility: {
    instagramFeed: boolean;
    instagramStories: boolean;
    facebookFeed: boolean;
    facebookStories: boolean;
  };
  suggestions: string[];
  technicalInfo: {
    colorDepth?: string;
    compression?: string;
    codec?: string;
    bitrate?: string;
    frameRate?: string;
    hasAudio?: boolean;
  };
}

export const calculateAspectRatio = (width: number, height: number): string => {
  const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
  const divisor = gcd(width, height);
  const ratioW = width / divisor;
  const ratioH = height / divisor;
  
  // Common ratios
  if (ratioW === ratioH) return '1:1';
  if (ratioW === 9 && ratioH === 16) return '9:16';
  if (ratioW === 16 && ratioH === 9) return '16:9';
  if (Math.abs((ratioW / ratioH) - 1.91) < 0.1) return '1.91:1';
  
  return `${ratioW}:${ratioH}`;
};

export const analyzeCompatibility = (file: ValidatedFile) => {
  if (!file.dimensions) {
    return {
      instagramFeed: false,
      instagramStories: false,
      facebookFeed: false,
      facebookStories: false,
    };
  }

  const { width, height } = file.dimensions;
  const aspectRatio = width / height;
  const isVideo = file.file.type.startsWith('video/');
  const validDuration = !isVideo || (file.duration && file.duration >= 15 && file.duration <= 60);

  return {
    instagramFeed: Math.abs(aspectRatio - 1) < 0.1 && validDuration, // Square
    instagramStories: Math.abs(aspectRatio - 0.5625) < 0.01 && validDuration, // 9:16
    facebookFeed: (Math.abs(aspectRatio - 1) < 0.1 || Math.abs(aspectRatio - 1.91) < 0.1) && validDuration,
    facebookStories: Math.abs(aspectRatio - 0.5625) < 0.01 && validDuration,
  };
};

export const generateOptimizationSuggestions = (file: ValidatedFile): string[] => {
  const suggestions: string[] = [];
  const isVideo = file.file.type.startsWith('video/');
  const sizeInMB = file.file.size / (1024 * 1024);
  
  // Size optimization
  if (isVideo && sizeInMB > 100) {
    suggestions.push('Considere compactar o vídeo para reduzir o tamanho e melhorar o carregamento');
  } else if (!isVideo && sizeInMB > 5) {
    suggestions.push('Imagem pode ser otimizada para web sem perder qualidade visual');
  }
  
  // Format suggestions
  if (file.file.type === 'image/png' && sizeInMB > 1) {
    suggestions.push('Considere usar JPEG para reduzir o tamanho do arquivo');
  }
  
  // Resolution suggestions
  if (file.dimensions) {
    const { width, height } = file.dimensions;
    if (width > 2160 || height > 2160) {
      suggestions.push('Resolução muito alta - pode reduzir para 1080p sem impacto visual');
    }
  }
  
  // Duration suggestions for videos
  if (isVideo && file.duration) {
    if (file.duration < 15) {
      suggestions.push('Vídeos de 15-30s têm melhor engajamento em Stories/Reels');
    } else if (file.duration > 45) {
      suggestions.push('Considere versões mais curtas para melhor retenção de audiência');
    }
  }
  
  // Aspect ratio suggestions
  const compatibility = analyzeCompatibility(file);
  const compatiblePlatforms = Object.values(compatibility).filter(Boolean).length;
  
  if (compatiblePlatforms === 1) {
    suggestions.push('Crie versões em outros formatos para maximizar o alcance');
  }
  
  return suggestions;
};

export const analyzeMediaQuality = (file: File): Promise<MediaAnalysis['quality']> => {
  return new Promise((resolve) => {
    if (file.type.startsWith('video/')) {
      // For videos, we'll provide general analysis
      resolve({
        sharpness: 'medium',
        brightness: 'normal',
        contrast: 'medium'
      });
      return;
    }

    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        resolve({
          sharpness: 'medium',
          brightness: 'normal',
          contrast: 'medium'
        });
        return;
      }

      // Resize to small canvas for analysis
      canvas.width = 100;
      canvas.height = 100;
      ctx.drawImage(img, 0, 0, 100, 100);
      
      try {
        const imageData = ctx.getImageData(0, 0, 100, 100);
        const data = imageData.data;
        
        let totalBrightness = 0;
        let totalContrast = 0;
        
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          const brightness = (r + g + b) / 3;
          totalBrightness += brightness;
          totalContrast += Math.abs(brightness - 128);
        }
        
        const avgBrightness = totalBrightness / (data.length / 4);
        const avgContrast = totalContrast / (data.length / 4);
        
        resolve({
          sharpness: avgContrast > 40 ? 'high' : avgContrast > 20 ? 'medium' : 'low',
          brightness: avgBrightness > 180 ? 'bright' : avgBrightness > 80 ? 'normal' : 'dark',
          contrast: avgContrast > 40 ? 'high' : avgContrast > 20 ? 'medium' : 'low'
        });
      } catch (error) {
        resolve({
          sharpness: 'medium',
          brightness: 'normal',
          contrast: 'medium'
        });
      }
    };
    
    img.onerror = () => {
      resolve({
        sharpness: 'medium',
        brightness: 'normal',
        contrast: 'medium'
      });
    };
    
    img.src = URL.createObjectURL(file);
  });
};

export const getTechnicalInfo = (file: ValidatedFile): MediaAnalysis['technicalInfo'] => {
  const isVideo = file.file.type.startsWith('video/');
  const sizeInMB = file.file.size / (1024 * 1024);
  
  if (isVideo) {
    return {
      codec: file.file.type.includes('mp4') ? 'H.264/MP4' : 'QuickTime/MOV',
      bitrate: sizeInMB > 50 ? 'Alta' : sizeInMB > 20 ? 'Média' : 'Baixa',
      hasAudio: true, // We'll assume videos have audio
    };
  } else {
    return {
      colorDepth: '8-bit',
      compression: file.file.type === 'image/jpeg' ? 'JPEG' : 'PNG sem perdas',
    };
  }
};

export const analyzeMedia = async (file: ValidatedFile): Promise<MediaAnalysis> => {
  const quality = await analyzeMediaQuality(file.file);
  const compatibility = analyzeCompatibility(file);
  const suggestions = generateOptimizationSuggestions(file);
  const technicalInfo = getTechnicalInfo(file);
  
  const aspectRatio = file.dimensions 
    ? calculateAspectRatio(file.dimensions.width, file.dimensions.height)
    : 'Desconhecido';

  return {
    aspectRatio,
    quality,
    compatibility,
    suggestions,
    technicalInfo,
  };
};
