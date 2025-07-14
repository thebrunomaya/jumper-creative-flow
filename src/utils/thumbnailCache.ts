interface ThumbnailCacheEntry {
  dataUrl: string;
  timestamp: number;
}

const THUMBNAIL_CACHE = new Map<string, ThumbnailCacheEntry>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const generateCacheKey = (
  format: string, 
  carouselMode: boolean, 
  carouselAspectRatio: string
): string => {
  return `${format}-${carouselMode}-${carouselAspectRatio}`;
};

export const getCachedThumbnail = (
  format: string, 
  carouselMode: boolean, 
  carouselAspectRatio: string
): string | null => {
  const key = generateCacheKey(format, carouselMode, carouselAspectRatio);
  const entry = THUMBNAIL_CACHE.get(key);
  
  if (!entry) return null;
  
  // Verificar se cache não expirou
  if (Date.now() - entry.timestamp > CACHE_DURATION) {
    THUMBNAIL_CACHE.delete(key);
    return null;
  }
  
  return entry.dataUrl;
};

export const setCachedThumbnail = (
  format: string, 
  carouselMode: boolean, 
  carouselAspectRatio: string,
  dataUrl: string
): void => {
  const key = generateCacheKey(format, carouselMode, carouselAspectRatio);
  THUMBNAIL_CACHE.set(key, {
    dataUrl,
    timestamp: Date.now()
  });
};

export const clearThumbnailCache = (): void => {
  THUMBNAIL_CACHE.clear();
  console.log('🧹 CACHE LIMPO - Forçando regeneração de thumbnails');
};

// Limpeza automática do cache
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of THUMBNAIL_CACHE.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      THUMBNAIL_CACHE.delete(key);
    }
  }
}, CACHE_DURATION);

// Função para pré-carregar thumbnails comuns
export const preloadCommonThumbnails = async (): Promise<void> => {
  const { generateThumbnailPreview } = await import('./thumbnailUtils');
  
  const commonFormats = [
    { format: 'square' as const, carouselMode: false, carouselAspectRatio: '1:1' as const },
    { format: 'vertical' as const, carouselMode: false, carouselAspectRatio: '1:1' as const },
    { format: 'horizontal' as const, carouselMode: false, carouselAspectRatio: '1:1' as const },
    { format: 'square' as const, carouselMode: true, carouselAspectRatio: '1:1' as const },
    { format: 'square' as const, carouselMode: true, carouselAspectRatio: '4:5' as const },
  ];
  
  // Pré-carregar em background sem bloquear a UI
  Promise.all(
    commonFormats.map(({ format, carouselMode, carouselAspectRatio }) =>
      generateThumbnailPreview(format, carouselMode, carouselAspectRatio)
        .catch(() => {
          // Silenciar erros de pré-carregamento
        })
    )
  );
};