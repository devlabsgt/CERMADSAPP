import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().trim().min(3, "El nombre es requerido"),
  nit: z.string().trim().min(1, "El NIT es requerido"),
  direccion: z.string().trim().min(1, "La dirección es requerida"),
  telefono: z.string().trim().min(7, "El teléfono es requerido"),
  email: z
    .string()
    .transform((v) => v.trim())
    .pipe(z.string().email("Email inválido").or(z.literal("")))
    .optional()
    .or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
