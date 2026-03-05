import { z } from "zod";

// Regex para E.164 (Ej. +526181234567)
const phoneRegex = /^\+?[1-9]\d{7,14}$/;

// 1. Esquema para Login
const loginSchema = z
  .object({
    email: z
      .string()
      .email("El formato del correo no es válido")
      .trim()
      .toLowerCase(),
    password: z.string().min(1, "La contraseña es obligatoria"),
  })
  .strict();

// 2. Esquema para Crear Usuario
const createUserSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(3, "El nombre debe tener al menos 3 caracteres"),
    email: z
      .string()
      .email("El formato del correo no es válido")
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, "La contraseña debe tener al menos 8 caracteres")
      .regex(/(?=.*[A-Z])/, "Debe contener al menos una mayúscula")
      .regex(/(?=.*[0-9])/, "Debe contener al menos un número"),
    role: z.enum(["ADMIN", "RECEPTIONIST", "DOCTOR"]).default("RECEPTIONIST"),
    phone: z
      .string()
      .regex(phoneRegex, "Formato de teléfono inválido (E.164)")
      .optional(),
  })
  .strict();

// 3. Esquema para Actualizar Usuario
// Nota: Usamos omit({ password: true }) porque la contraseña se suele cambiar en otra ruta
const updateUserSchema = createUserSchema
  .partial()
  .extend({
    isActive: z.boolean().optional(),
  })
  .strict();

// 4. Esquema para Cambio de Contraseña
const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "La contraseña actual es requerida"),
    newPassword: z
      .string()
      .min(8, "La nueva contraseña debe tener al menos 8 caracteres")
      .regex(/(?=.*[A-Z])/, "Debe contener una mayúscula")
      .regex(/(?=.*[0-9])/, "Debe contener un número"),
  })
  .strict();

// --- EXPORTACIÓN AGRUPADA AL FINAL ---
export {
  loginSchema,
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
};
