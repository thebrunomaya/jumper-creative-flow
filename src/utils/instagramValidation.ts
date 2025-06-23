
import { ExistingPostData } from '@/types/creative';

export const validateInstagramUrl = (url: string): ExistingPostData => {
  const errors: string[] = [];
  let valid = false;
  let postId: string | undefined;
  let postType: 'post' | 'reel' | 'igtv' | undefined;
  let detectedAspectRatio: '1:1' | '4:5' | '9:16' | '16:9' | undefined;

  console.log('Validating Instagram URL:', url);

  if (!url.trim()) {
    errors.push('URL é obrigatória');
    return {
      instagramUrl: url,
      valid: false,
      errors
    };
  }

  // Instagram URL patterns with type detection
  const patterns = [
    { regex: /^https?:\/\/(www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)\/?/, type: 'post' as const },
    { regex: /^https?:\/\/(www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)\/?/, type: 'reel' as const },
    { regex: /^https?:\/\/(www\.)?instagram\.com\/tv\/([A-Za-z0-9_-]+)\/?/, type: 'igtv' as const }
  ];

  let matchFound = false;
  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      postId = match[2];
      postType = pattern.type;
      matchFound = true;
      valid = true;

      // Determine likely aspect ratio based on post type
      switch (postType) {
        case 'post':
          // Posts can be 1:1 or 4:5, default to 1:1
          detectedAspectRatio = '1:1';
          break;
        case 'reel':
          // Reels are typically vertical
          detectedAspectRatio = '9:16';
          break;
        case 'igtv':
          // IGTV can be vertical or horizontal, default to vertical
          detectedAspectRatio = '9:16';
          break;
      }
      break;
    }
  }

  if (!matchFound) {
    errors.push('URL do Instagram inválida. Use URLs de posts, reels ou IGTV.');
  }

  console.log('Instagram URL validation result:', { valid, postId, postType, detectedAspectRatio, errors });

  return {
    instagramUrl: url,
    postId,
    postType,
    detectedAspectRatio,
    valid,
    errors
  };
};
