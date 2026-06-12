// Extrae el mensaje de error exacto de una respuesta de la API de forma robusta.
// Algunos endpoints responden con res.status(4xx).json({ message }) directamente
// (no via validateSchema), y otros usan { error }. Cubrimos ambos.
export async function getApiError(
  res,
  fallback = "No se pudo completar la operación. Revisa los datos e intenta de nuevo.",
) {
  try {
    const data = await res.json();
    return data?.message || data?.error || fallback;
  } catch {
    return fallback;
  }
}

export const CONNECTION_ERROR =
  "No se pudo conectar. Revisa tu conexión e intenta de nuevo.";
