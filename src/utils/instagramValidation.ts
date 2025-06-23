
import { ExistingPostData } from '@/types/creative';

export const validateInstagramUrl = (url: string): ExistingPostData => {
  const errors: string[] = [];
  let valid = false;
  let postId: string | undefined;

  console.log('Validating Instagram URL:', url);

  if (!url.trim()) {
    errors.push('URL é obrigatória');
    return {
      instagramUrl: url,
      valid: false,
      errors
    };
  }

  // Instagram URL patterns - simplified to just validate basic Instagram URLs
  const patterns = [
    /^https?:\/\/(www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/,
    /^https?:\/\/(www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)\/?/,
    /^https?:\/\/(www\.)?instagram\.com\/tv\/([A-Za-z0-9_-]+)\/?/
  ];

  let matchFound = false;
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      postId = match[2];
      matchFound = true;
      valid = true;
      break;
    }
  }

  if (!matchFound) {
    errors.push('URL do Instagram inválida. Use URLs de posts, reels ou IGTV.');
  }

  console.log('Instagram URL validation result:', { valid, postId, errors });

  return {
    instagramUrl: url,
    postId,
    valid,
    errors
  };
};
