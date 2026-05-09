"use client";
import { useEffect, useRef, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

/**
 * Descarga una imagen protegida (Authorization Bearer) y devuelve un objectURL para <img src>.
 * Si `lazyRef` es un ref de un elemento DOM, espera a que entre en viewport antes de fetch.
 * Si `enabled` es false, no descarga nada (útil cuando aún no se sabe la URL).
 */
export function useAuthImage(url, { lazyRef = null, enabled = true } = {}) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const objectUrlRef = useRef(null);

  useEffect(() => {
    if (!url || !enabled) return;

    let cancelled = false;
    let observer = null;

    const load = async () => {
      setLoading(true);
      try {
        const res = await fetchWithAuth(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const blob = await res.blob();
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        objectUrlRef.current = objectUrl;
        setSrc(objectUrl);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    if (lazyRef?.current && typeof IntersectionObserver !== "undefined") {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            observer.disconnect();
            load();
          }
        },
        { rootMargin: "200px" },
      );
      observer.observe(lazyRef.current);
    } else {
      load();
    }

    return () => {
      cancelled = true;
      if (observer) observer.disconnect();
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [url, enabled, lazyRef]);

  return { src, loading, error };
}
