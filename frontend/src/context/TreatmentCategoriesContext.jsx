"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const API = process.env.NEXT_PUBLIC_API_URL;

const TreatmentCategoriesContext = createContext([]);

export function TreatmentCategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchWithAuth(`${API}/api/treatment-categories`)
      .then((r) => r.json())
      .then(({ data }) => {
        if (Array.isArray(data) && data.length > 0) {
          setCategories(
            data.map((c) => ({
              id: c.slug,
              label: c.name,
              keywords: c.keywords ?? [],
              colorClass: c.colorClass ?? "bg-slate-600 text-white shadow-slate-200",
              unselectedClass: c.unselectedClass ?? "bg-slate-100 text-slate-500 hover:bg-slate-200",
              gridBg: c.gridBg ?? "bg-slate-500",
              gridBorder: c.gridBorder ?? "border-slate-600",
              dot: c.dotClass ?? "bg-slate-500",
            })),
          );
        }
      })
      .catch(() => {});
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
