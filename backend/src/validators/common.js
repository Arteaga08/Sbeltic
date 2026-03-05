import { z } from "zod";

// 1. Esquema base para cualquier ID de MongoDB
const objectIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, "Formato de ID inválido");

// 2. Esquema para rutas que usan /:id (la mayoría)
const paramsIdSchema = z.object({
  id: objectIdSchema,
});

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export { objectIdSchema, paramsIdSchema };
