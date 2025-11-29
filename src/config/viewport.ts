/**
 * Viewport Requirements for Deck Presentations
 *
 * Decks support multiple aspect ratios (4:3, 16:10, 16:9, 21:9) but block:
 * - Portrait orientation (height > width)
 * - Screens smaller than 768px in smallest dimension
 * - Super ultra-wide displays (32:9) that have excessive margins
 */

export const VIEWPORT_REQUIREMENTS = {
  /**
   * Minimum smallest dimension (width or height)
   * Reduced from 768 to 600 to support:
   * - MacBook Air 13" with non-maximized windows
   * - Tablets in landscape mode
   * - Browser with DevTools open
   * @default 600 - Balance between readability and accessibility
   */
  minSmallestDimension: 600,

  /**
   * Minimum aspect ratio (4:3 format = 1.333...)
   * Blocks portrait and overly tall displays
   */
  minAspectRatio: 4 / 3,

  /**
   * Maximum aspect ratio (21:9 ultra-wide format = 2.4:1)
   * Blocks super ultra-wide displays (32:9) that have excessive margins
   */
  maxAspectRatio: 2.4,

  /**
   * Recommended resolution for optimal quality
   * @default 1920x1080 (Full HD, 16:9)
   */
  recommendedWidth: 1920,
  recommendedHeight: 1080,

  /**
   * Legacy properties (deprecated, kept for backwards compatibility)
   * @deprecated Use aspect ratio validation instead
   */
  minWidth: 1024,
  minHeight: 768,
} as const;

/**
 * Common supported resolutions (examples)
 */
export const SUPPORTED_RESOLUTIONS = {
  '4:3': ['1024x768', '1280x960', '1600x1200'],
  '16:10': ['1280x800', '1440x900', '1920x1200'],
  '16:9': ['1280x720', '1920x1080', '2560x1440', '3840x2160'],
  '21:9': ['2560x1080', '3440x1440', '3840x1600'],
} as const;

/**
 * Blocked super ultra-wide formats
 */
export const BLOCKED_FORMATS = {
  '32:9': 'Super ultra-wide (margens excessivas)',
} as const;

/**
 * Validation result with optional rejection reason
 */
export interface ViewportValidationResult {
  valid: boolean;
  reason?: 'portrait' | 'too_small' | 'too_narrow' | 'too_wide';
  aspectRatio?: number;
}

/**
 * Check if current viewport meets requirements with detailed validation
 *
 * Rules:
 * 1. Block portrait orientation (height > width)
 * 2. Smallest dimension must be ≥ 768px
 * 3. Aspect ratio must be between 4:3 (1.33) and 21:9 (2.40)
 *
 * @param width - Current viewport width
 * @param height - Current viewport height
 * @returns Validation result with valid flag and optional reason
 */
export function isViewportValid(
  width: number,
  height: number
): ViewportValidationResult {
  const aspectRatio = width / height;

  // 1. Block portrait orientation (height > width)
  if (height > width) {
    return {
      valid: false,
      reason: 'portrait',
      aspectRatio,
    };
  }

  // 2. Check minimum smallest dimension (768px)
  const smallestDimension = Math.min(width, height);
  if (smallestDimension < VIEWPORT_REQUIREMENTS.minSmallestDimension) {
    return {
      valid: false,
      reason: 'too_small',
      aspectRatio,
    };
  }

  // 3. Check aspect ratio is within valid range (4:3 to 16:9)
  if (aspectRatio < VIEWPORT_REQUIREMENTS.minAspectRatio) {
    return {
      valid: false,
      reason: 'too_narrow',
      aspectRatio,
    };
  }

  if (aspectRatio > VIEWPORT_REQUIREMENTS.maxAspectRatio) {
    return {
      valid: false,
      reason: 'too_wide',
      aspectRatio,
    };
  }

  // All checks passed
  return {
    valid: true,
    aspectRatio,
  };
}

/**
 * Check if current viewport meets recommended size
 */
export function isViewportOptimal(width: number, height: number): boolean {
  return (
    width >= VIEWPORT_REQUIREMENTS.recommendedWidth &&
    height >= VIEWPORT_REQUIREMENTS.recommendedHeight
  );
}

/**
 * Get aspect ratio as formatted string (e.g., "16:9" or "21:9")
 */
export function getAspectRatioLabel(width: number, height: number): string {
  const ratio = width / height;

  // Common aspect ratios
  if (Math.abs(ratio - 4 / 3) < 0.01) return '4:3';
  if (Math.abs(ratio - 16 / 10) < 0.01) return '16:10';
  if (Math.abs(ratio - 16 / 9) < 0.01) return '16:9';
  if (Math.abs(ratio - 21 / 9) < 0.01) return '21:9';
  if (Math.abs(ratio - 32 / 9) < 0.01) return '32:9';

  // Custom ratio
  return `${ratio.toFixed(2)}:1`;
}

/**
 * LocalStorage key for admin override
 */
export const FORCE_VIEWPORT_KEY = 'jumper-force-viewport';
