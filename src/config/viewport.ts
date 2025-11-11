/**
 * Viewport Requirements for Deck Presentations
 *
 * Decks are designed for desktop/laptop displays with fixed layouts.
 * Small screens cause elements to overlap and become unreadable.
 */

export const VIEWPORT_REQUIREMENTS = {
  /**
   * Minimum width required to display presentations correctly
   * @default 1280 - HD Ready standard, covers 98% of laptops/desktops
   */
  minWidth: 1280,

  /**
   * Minimum height required to display presentations correctly
   * @default 720 - HD Ready standard, 16:9 aspect ratio
   */
  minHeight: 720,

  /**
   * Recommended width for optimal presentation quality
   * @default 1920 - Full HD standard
   */
  recommendedWidth: 1920,

  /**
   * Recommended height for optimal presentation quality
   * @default 1080 - Full HD standard
   */
  recommendedHeight: 1080,
} as const;

/**
 * Check if current viewport meets minimum requirements
 */
export function isViewportValid(width: number, height: number): boolean {
  return width >= VIEWPORT_REQUIREMENTS.minWidth && height >= VIEWPORT_REQUIREMENTS.minHeight;
}

/**
 * Check if current viewport meets recommended size
 */
export function isViewportOptimal(width: number, height: number): boolean {
  return width >= VIEWPORT_REQUIREMENTS.recommendedWidth && height >= VIEWPORT_REQUIREMENTS.recommendedHeight;
}

/**
 * LocalStorage key for admin override
 */
export const FORCE_VIEWPORT_KEY = 'jumper-force-viewport';
