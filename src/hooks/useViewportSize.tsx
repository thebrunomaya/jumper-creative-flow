import { useState, useEffect } from "react";
import { isViewportValid } from "@/config/viewport";

interface ViewportSize {
  width: number;
  height: number;
  isValid: boolean;
}

/**
 * Hook to track viewport dimensions and validate against requirements
 *
 * Returns reactive viewport size that updates on window resize
 * Useful for showing warnings on small screens
 *
 * @example
 * const { width, height, isValid } = useViewportSize();
 * if (!isValid) return <ViewportWarning />;
 */
export function useViewportSize(): ViewportSize {
  const [size, setSize] = useState<ViewportSize>(() => {
    // Initialize with current window size (SSR-safe)
    if (typeof window === "undefined") {
      return { width: 1920, height: 1080, isValid: true };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;

    return {
      width,
      height,
      isValid: isViewportValid(width, height),
    };
  });

  useEffect(() => {
    // Update size on window resize
    const updateSize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      setSize({
        width,
        height,
        isValid: isViewportValid(width, height),
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
