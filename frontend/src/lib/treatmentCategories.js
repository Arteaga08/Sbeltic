// ─────────────────────────────────────────────────────────────
//  FUENTE ÚNICA DE VERDAD — Categorías de tratamientos Sbeltic
//  Edita solo este archivo para agregar, quitar o renombrar.
// ─────────────────────────────────────────────────────────────

export const TREATMENT_CATEGORIES = [
  {
    id: "CIRUGIA",
    label: "Cirugía",
    keywords: [
      "LIPOESCULTURA", "LIPOSCULTURA", "RINOPLASTIA", "BICHECTOMIA",
      "MAMARIO", "QUIRURGICO", "CIRUGIA", "BLEFAROPLASTIA", "ABDOMINOPLASTIA",
    ],
    colorClass: "bg-rose-500 text-white shadow-rose-200",
    unselectedClass: "bg-rose-50 text-rose-400 hover:bg-rose-100",
    gridBg: "bg-rose-500",
    gridBorder: "border-rose-600",
    dot: "bg-rose-500",
  },
  {
    id: "CONSULTA",
    label: "Consulta Dr.",
    keywords: [
      "VALORACION", "REVISION", "TOXINA", "FILLERS",
      "RELLENO", "BOTOX", "CONSULTA", "COTIZACION",
    ],
    colorClass: "bg-amber-400 text-white shadow-amber-200",
    unselectedClass: "bg-amber-50 text-amber-500 hover:bg-amber-100",
    gridBg: "bg-amber-400",
    gridBorder: "border-amber-500",
    dot: "bg-amber-400",
  },
  {
    id: "SPA",
    label: "Spa",
    keywords: ["SPA", "MASAJE", "RADIOFRECUENCIA", "HIDRATACION", "REDUCTIVO"],
    colorClass: "bg-purple-500 text-white shadow-purple-200",
    unselectedClass: "bg-purple-50 text-purple-400 hover:bg-purple-100",
    gridBg: "bg-purple-500",
    gridBorder: "border-purple-600",
    dot: "bg-purple-500",
  },
  {
    id: "FACIAL",
    label: "Faciales",
    keywords: ["FACIAL", "HYDRAFACIAL", "PEELING", "LIMPIEZA"],
    colorClass: "bg-blue-500 text-white shadow-blue-200",
    unselectedClass: "bg-blue-50 text-blue-400 hover:bg-blue-100",
    gridBg: "bg-blue-500",
    gridBorder: "border-blue-600",
    dot: "bg-blue-500",
  },
  {
    id: "DEPILACION",
    label: "Depilación",
    keywords: ["DEPILACION", "LASER"],
    colorClass: "bg-pink-500 text-white shadow-pink-200",
    unselectedClass: "bg-pink-50 text-pink-400 hover:bg-pink-100",
    gridBg: "bg-pink-500",
    gridBorder: "border-pink-600",
    dot: "bg-pink-500",
  },
  {
    id: "OTROS",
    label: "Otros",
    keywords: [],
    colorClass: "bg-slate-600 text-white shadow-slate-200",
    unselectedClass: "bg-slate-100 text-slate-500 hover:bg-slate-200",
    gridBg: "bg-emerald-500",
    gridBorder: "border-emerald-600",
    dot: "bg-slate-500",
  },
];

/**
 * Dado el nombre de un tratamiento, devuelve el ID de su categoría.
 * Usa keyword matching contra la lista de cada categoría.
 */
export function getCategoryFromTreatment(treatmentName) {
  const name = (treatmentName || "").toUpperCase();
  for (const cat of TREATMENT_CATEGORIES) {
    if (cat.keywords.some((k) => name.includes(k))) return cat.id;
  }
  return "OTROS";
}

/**
 * Dado un ID de categoría, devuelve el objeto completo.
 * Fallback a OTROS si no existe.
 */
export function getCategoryById(id) {
  return (
    TREATMENT_CATEGORIES.find((c) => c.id === id) ??
    TREATMENT_CATEGORIES[TREATMENT_CATEGORIES.length - 1]
  );
}
