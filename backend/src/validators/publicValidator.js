import { z } from "zod";

export const publicSignatureSchema = z.object({
  signature: z.string().min(100, "La firma es inválida o demasiado corta"),
});
