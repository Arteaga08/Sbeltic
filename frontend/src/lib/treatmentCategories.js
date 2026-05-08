/**
 * Dado el nombre de un tratamiento, devuelve el ID de su categoría.
 * Usa keyword matching contra la lista dinámica de categorías.
 */
export function getCategoryFromTreatment(treatmentName, cats = []) {
  const name = (treatmentName || "").toUpperCase();
  for (const cat of cats) {
    if (cat.keywords.some((k) => name.includes(k))) return cat.id;
  }
  return cats[cats.length - 1]?.id ?? null;
}

/**
 * Dado un ID de categoría, devuelve el objeto completo.
 * Fallback al último elemento si no existe.
 */
export function getCategoryById(id, cats = []) {
  return cats.find((c) => c.id === id) ?? cats[cats.length - 1] ?? null;
}
