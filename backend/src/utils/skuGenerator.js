/**
 * Genera un SKU único para Sbeltic si el producto no tiene código de barras.
 * Ejemplo de salida: SBL-INS-8492
 */
export const generateSbelticSKU = (category) => {
  const prefix = "SBL";
  const catCode = category ? category.substring(0, 3).toUpperCase() : "GEN";
  const random = Math.floor(1000 + Math.random() * 9000);

  return `${prefix}-${catCode}-${random}`;
};
