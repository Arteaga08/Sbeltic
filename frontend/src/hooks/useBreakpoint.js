// src/hooks/useBreakpoint.js
import { useState, useEffect } from "react";

const breakpoints = {
  sm: 640,
  md: 768, // Tablet Portrait
  lg: 1024, // Tablet Landscape / Desktop
  xl: 1280,
};

export function useBreakpoint() {
  const [size, setSize] = useState("sm");

  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width >= breakpoints.xl) setSize("xl");
      else if (width >= breakpoints.lg) setSize("lg");
      else if (width >= breakpoints.md) setSize("md");
      else setSize("sm");
    };

    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  return {
    size,
    isTablet: size === "md" || size === "lg",
    isMobile: size === "sm",
    isDesktop: size === "xl",
  };
}
