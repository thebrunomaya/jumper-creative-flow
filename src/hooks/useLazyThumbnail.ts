import { useState, useEffect, useRef } from 'react';
import { generateThumbnailPreview } from '@/utils/thumbnailUtils';

interface UseLazyThumbnailProps {
  format: 'square' | 'vertical' | 'horizontal';
  carouselMode: boolean;
  carouselAspectRatio: '1:1' | '4:5';
  enabled: boolean;
}

export const useLazyThumbnail = ({
  format,
  carouselMode,
  carouselAspectRatio,
  enabled
}: UseLazyThumbnailProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnailSrc, setThumbnailSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Intersection Observer para detectar quando elemento está visível
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { 
        threshold: 0.1,
        rootMargin: '50px' // Carregar com 50px de antecedência
      }
    );
    
    if (ref.current) {
      observer.observe(ref.current);
    }
    
    return () => observer.disconnect();
  }, []);

  // Gerar thumbnail apenas quando visível e habilitado
  useEffect(() => {
    if (isVisible && enabled && !thumbnailSrc && !isLoading) {
      setIsLoading(true);
      setError(null);
      
      generateThumbnailPreview(format, carouselMode, carouselAspectRatio)
        .then(setThumbnailSrc)
        .catch((err) => {
          console.error('Erro ao gerar thumbnail:', err);
          setError('Falha ao carregar thumbnail');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isVisible, enabled, format, carouselMode, carouselAspectRatio, thumbnailSrc, isLoading]);

  return {
    ref,
    thumbnailSrc,
    isLoading,
    error,
    isVisible
  };
};