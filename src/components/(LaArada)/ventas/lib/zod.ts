import { z } from "zod";

export const DetalleSchema = z.object({
  producto_id: z.string().uuid("ID de producto inválido"),
  nombre_producto: z.string().optional(),
  cantidad: z.coerce
    .number()
    .min(0.5, "La cantidad mínima es 0.5")
    .refine(
      (val) => Math.abs(val * 2 - Math.round(val * 2)) < 1e-9,
      "La cantidad debe ser en incrementos de 0.5",
    ),
  precio_unitario: z.coerce.number().min(0.01, "El precio debe ser mayor a 0"),
  subtotal: z.coerce.number().min(0, "El subtotal no puede ser negativo"),
});

export const VentaSchema = z.object({
  id: z.string().optional(),
  cliente_id: z.string().uuid("Seleccione un cliente válido"),
  usuario_id: z.string().uuid().optional(),
  fecha_entrega: z.string().optional().or(z.literal("")),
  tipo_venta: z.enum(["Contado", "Crédito"]),
  tipo_comprobante: z.enum(["Recibo", "NIT", "C/F"]).default("Recibo"),
  observaciones: z.string().optional(),
  total: z.coerce.number().min(0, "El total no puede ser negativo"),
  detalles: z.array(DetalleSchema).min(1, "Debe agregar al menos un producto"),
});

export type VentaFormValues = z.infer<typeof VentaSchema>;
export type DetalleVentaValues = z.infer<typeof DetalleSchema>;

export type ProductoCatalogo = {
  id: string;
  nombre: string;
  codigo?: string;
  precio_base: number;
  stock_actual: number;
  medida: string;
  activo?: boolean;
};

export type ClienteCatalogo = {
  id: string;
  nombre: string;
  nit: string;
};

export type CatalogosData = {
  clientes: ClienteCatalogo[];
  productos: ProductoCatalogo[];
};
