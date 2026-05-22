import { z } from "zod";

export const ClientSchema = z.object({
  id: z.string().uuid().optional(),
  nombre: z.string().min(3, "El nombre es requerido"),
  nit: z.string().min(1, "El NIT es requerido"),
  direccion: z.string().min(1, "La dirección es requerida"),
  telefono: z
    .string()
    .min(7, "El teléfono debe tener al menos 7 dígitos")
    .optional()
    .or(z.literal("")),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
});

export type ClientFormValues = z.infer<typeof ClientSchema>;
