"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

const TreatmentCategoriesContext = createContext([]);

export function TreatmentCategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchWithAuth(`${API}/treatment-categories`)
      .then((r) => r.json())
      .then((json) => {
        // El controller devuelve { status, data } pero también aceptamos array directo
        const raw = Array.isArray(json) ? json : json?.data;
        if (Array.isArray(raw) && raw.length > 0) {
          setCategories(
            raw.map((c) => {
              const dotCls = c.dotClass ?? "";
              const derivedBorder = dotCls.replace(
                /^bg-(\w+)-(\d+)$/,
                (_, color, shade) =>
                  `border-${color}-${Math.min(Number(shade) + 100, 900)}`,
              );
              return {
                id: c.slug,
                label: c.name,
                keywords: c.keywords ?? [],
                colorClass: c.colorClass ?? "bg-slate-600 text-white shadow-slate-200",
                unselectedClass: c.unselectedClass ?? "bg-slate-100 text-slate-500 hover:bg-slate-200",
                gridBg: (c.gridBg ?? dotCls) || "bg-slate-500",
                gridBorder: (c.gridBorder ?? derivedBorder) || "border-slate-600",
                dot: dotCls || "bg-slate-500",
              };
            }),
          );
        } else {
          console.warn("[TreatmentCategories] Respuesta inesperada:", json);
        }
      })
      .catch((err) => console.error("[TreatmentCategories] Error al cargar:", err));
  }, []);

  return (
    <TreatmentCategoriesContext.Provider value={categories}>
      {children}
    </TreatmentCategoriesContext.Provider>
  );
}

export function useTreatmentCategories() {
  return useContext(TreatmentCategoriesContext);
}
