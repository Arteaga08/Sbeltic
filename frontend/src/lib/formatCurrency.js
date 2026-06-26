/**
 * Formatea un número como moneda mexicana (MXN).
 * @param {number} n - Cantidad a formatear.
 * @returns {string} Ej. "$ 2,500"
 */
export function formatMXN(n) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 0,
  }).format(n ?? 0);
}
