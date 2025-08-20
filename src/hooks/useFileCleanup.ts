import { useEffect, useRef } from 'react';

/**
 * Hook para limpar URLs de objeto criadas com createObjectURL
 * Evita vazamentos de memória revogando URLs automaticamente
 */
export const useFileCleanup = () => {
  const urlsRef = useRef<Set<string>>(new Set());

  const trackUrl = (url: string) => {
    urlsRef.current.add(url);
  };

  const revokeUrl = (url: string) => {
    if (urlsRef.current.has(url)) {
      URL.revokeObjectURL(url);
      urlsRef.current.delete(url);
      console.log('🧹 Revoked object URL:', url.substring(0, 50) + '...');
    }
  };

  const revokeAllUrls = () => {
    urlsRef.current.forEach(url => {
      URL.revokeObjectURL(url);
    });
    urlsRef.current.clear();
    console.log('🧹 Revoked all tracked URLs');
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      revokeAllUrls();
    };
  }, []);

  return {
    trackUrl,
    revokeUrl,
    revokeAllUrls
  };
};