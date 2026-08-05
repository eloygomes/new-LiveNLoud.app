import { useEffect, useState } from "react";

export const COMPACT_PORTRAIT_MAX_WIDTH = 1279;

export function getIsCompactAppLayout(windowRef) {
  if (!windowRef) return false;

  const width = Number(windowRef.innerWidth || 0);
  const height = Number(windowRef.innerHeight || 0);

  return width < 768 || (width <= COMPACT_PORTRAIT_MAX_WIDTH && height > width);
}

export function useCompactAppLayout() {
  const [layout, setLayout] = useState(() => ({
    isCompact: getIsCompactAppLayout(
      typeof window === "undefined" ? null : window,
    ),
    width: typeof window === "undefined" ? 0 : window.innerWidth,
    height: typeof window === "undefined" ? 0 : window.innerHeight,
  }));

  useEffect(() => {
    const updateLayout = () => {
      setLayout({
        isCompact: getIsCompactAppLayout(window),
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateLayout();
    window.addEventListener("resize", updateLayout);
    window.addEventListener("orientationchange", updateLayout);

    return () => {
      window.removeEventListener("resize", updateLayout);
      window.removeEventListener("orientationchange", updateLayout);
    };
  }, []);

  return layout.isCompact;
}
