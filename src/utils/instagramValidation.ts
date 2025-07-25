
import { ExistingPostData } from '@/types/creative';

export const validateInstagramUrl = (url: string): ExistingPostData => {
  const errors: string[] = [];
  let valid = false;
  let postId: string | undefined;
  let username: string | undefined;
  let contentType: 'post' | 'reel' | 'igtv' | undefined;

  console.log('Validating Instagram URL:', url);

  if (!url.trim()) {
    errors.push('URL é obrigatória');
    return {
      instagramUrl: url,
      valid: false,
      errors
    };
  }

  // Enhanced Instagram URL patterns to capture username, content type, and post ID
  const patterns = [
    // URLs with username: instagram.com/username/p/postId
    {
      regex: /^https?:\/\/(www\.)?instagram\.com\/([a-zA-Z0-9_.]+)\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?/,
      hasUsername: true
    },
    // URLs without username: instagram.com/p/postId
    {
      regex: /^https?:\/\/(www\.)?instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?/,
      hasUsername: false
    }
  ];

  let matchFound = false;
  for (const pattern of patterns) {
    const match = url.match(pattern.regex);
    if (match) {
      if (pattern.hasUsername) {
        username = match[2];
        const rawContentType = match[3];
        postId = match[4];
        
        // Convert raw content type to our interface type
        if (rawContentType === 'p') {
          contentType = 'post';
        } else if (rawContentType === 'reel') {
          contentType = 'reel';
        } else if (rawContentType === 'tv') {
          contentType = 'igtv';
        }
      } else {
        const rawContentType = match[2];
        postId = match[3];
        
        // Convert raw content type to our interface type
        if (rawContentType === 'p') {
          contentType = 'post';
        } else if (rawContentType === 'reel') {
          contentType = 'reel';
        } else if (rawContentType === 'tv') {
          contentType = 'igtv';
        }
      }
      
      matchFound = true;
      valid = true;
      break;
    }
  }

  if (!matchFound) {
    errors.push('URL do Instagram inválida. Use URLs de posts, reels ou IGTV.');
  }

  // Validate username format if present
  if (username && !/^[a-zA-Z0-9_.]+$/.test(username)) {
    errors.push('Username do Instagram inválido detectado na URL.');
    valid = false;
  }

  console.log('Instagram URL validation result:', { 
    valid, 
    postId, 
    username, 
    contentType, 
    errors 
  });

  return {
    instagramUrl: url,
    postId,
    username,
    contentType,
    valid,
    errors
  };
};
