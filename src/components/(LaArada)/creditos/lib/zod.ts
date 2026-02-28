import { z } from "zod";

export const PagoCreditoSchema = z.object({
  venta_id: z.string().min(1, "El ID de la venta es requerido"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  metodo_pago: z.string().min(1, "El método de pago es obligatorio"),
  observaciones: z.string().optional(),
});

export type PagoCreditoValues = z.infer<typeof PagoCreditoSchema>;

export interface ClienteCredito {
  cliente_id: string;
  nombre: string;
  nit: string;
  telefono: string;
  totalDeuda: number;
  cantidadPedidos: number;
}
export interface VentaCredito {
  id: string;
  cliente_id: string;
  tipo_venta: string;
  estado: string;
  total: number;
  fecha_entrega: string;
  numero_recibo?: number;
  created_at?: string;
  tipo_comprobante?: string;
  placa_camion?: string;
  descripcion_camion?: string;
  ven_clientes?: {
    nombre: string;
    nit: string;
    telefono: string;
  };
  ven_detalle?: Array<{
    id: string;
    cantidad: number;
    precio_aplicado: number;
    subtotal: number;
    inv_productos?: {
      nombre: string;
    };
  }>;
}
