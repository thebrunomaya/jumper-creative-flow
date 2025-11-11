import { useState, useEffect } from "react";
import { isViewportValid, type ViewportValidationResult } from "@/config/viewport";

interface ViewportSize {
  width: number;
  height: number;
  isValid: boolean;
  reason?: 'portrait' | 'too_small' | 'too_narrow' | 'too_wide';
  aspectRatio?: number;
}

/**
 * Hook to track viewport dimensions and validate against requirements
 *
 * Returns reactive viewport size that updates on window resize
 * Includes validation result with optional rejection reason
 *
 * @example
 * const { width, height, isValid, reason, aspectRatio } = useViewportSize();
 * if (!isValid) return <ViewportWarning reason={reason} />;
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => {
    // Initialize with current window size (SSR-safe)
    if (typeof window === "undefined") {
      return { width: 1920, height: 1080, isValid: true, aspectRatio: 16 / 9 };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const validation = isViewportValid(width, height);

    return {
      width,
      height,
      isValid: validation.valid,
      reason: validation.reason,
      aspectRatio: validation.aspectRatio,
    };
  });

  useEffect(() => {
    // Update size on window resize
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const validation = isViewportValid(width, height);

      setSize({
        width,
        height,
        isValid: validation.valid,
        reason: validation.reason,
        aspectRatio: validation.aspectRatio,
      });
    };

    // Listen to resize events
    window.addEventListener("resize", updateSize);

    // Listen to orientation change (mobile/tablet)
    window.addEventListener("orientationchange", updateSize);

    // Cleanup listeners
    return () => {
      window.removeEventListener("resize", updateSize);
      window.removeEventListener("orientationchange", updateSize);
    };
  }, []);

  return size;
}
