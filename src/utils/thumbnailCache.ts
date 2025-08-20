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

// Limpeza automática do cache apenas (removido preload agressivo)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of THUMBNAIL_CACHE.entries()) {
    if (now - entry.timestamp > CACHE_DURATION) {
      THUMBNAIL_CACHE.delete(key);
    }
  }
}, CACHE_DURATION);