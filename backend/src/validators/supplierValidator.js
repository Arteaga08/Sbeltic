import { z } from "zod";

const createSupplierSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, "El nombre del proveedor debe tener al menos 2 caracteres"),
    contactPerson: z.string().trim().optional(), // 👈 Ahora coincide con el modelo
    email: z
      .string()
      .trim()
      .email("Correo electrónico inválido")
      .optional()
      .or(z.literal("")), 
    phone: z
      .string()
      .trim()
      .min(10, "El teléfono debe tener al menos 10 dígitos")
      .optional(),
    address: z.string().trim().optional(),
    isActive: z.boolean().default(true),
  })
  .strict();

const updateSupplierSchema = createSupplierSchema.partial().strict();

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export { createSupplierSchema, updateSupplierSchema };
