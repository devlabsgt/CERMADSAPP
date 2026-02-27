"use server";

import { createClient } from "@/utils/supabase/server";
import { VentaSchema, VentaFormValues } from "./zod";
import { revalidatePath } from "next/cache";

export async function getCatalogos() {
  const supabase = await createClient();
  const [clientes, productos] = await Promise.all([
    supabase.from("ven_clientes").select("id, nombre, nit").order("nombre"),
    supabase
      .from("inv_productos")
      .select("id, nombre, codigo, precio_base, stock_actual, medida")
      .order("nombre"),
  ]);

  return {
    clientes: clientes.data || [],
    productos: productos.data || [],
  };
}

export async function getVentas() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ven_ventas")
    .select(
      `
      *,
      ven_clientes (nombre, nit),
      ven_detalle (
        id,
        producto_id,
        cantidad,
        precio_aplicado,
        subtotal,
        inv_productos (nombre, medida)
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}
export async function createVenta(data: VentaFormValues) {
  const result = VentaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { detalles, ...cabecera } = result.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sesión expirada" };

  const { data: venta, error: errVenta } = await supabase
    .from("ven_ventas")
    .insert({
      cliente_id: cabecera.cliente_id,
      tipo_venta: cabecera.tipo_venta,
      tipo_comprobante: cabecera.tipo_comprobante,
      total: cabecera.total,
      fecha_entrega: cabecera.fecha_entrega || new Date().toISOString(),
      placa_camion: cabecera.placa_camion,
      descripcion_camion: cabecera.descripcion_camion,
      observaciones: cabecera.observaciones,
      usuario_id: user.id,
      estado: "Pendiente",
    })
    .select()
    .single();

  if (errVenta || !venta)
    return { error: errVenta?.message || "Error al crear cabecera" };

  const detallesFinal = detalles.map((d) => ({
    venta_id: venta.id,
    producto_id: d.producto_id,
    cantidad: d.cantidad,
    precio_aplicado: d.precio_unitario,
    subtotal: d.subtotal,
  }));

  const { error: errDetalle } = await supabase
    .from("ven_detalle")
    .insert(detallesFinal);

  if (errDetalle) return { error: "Error al guardar productos" };

  for (const item of detalles) {
    const { data: prodData } = await supabase
      .from("inv_productos")
      .select("stock_actual")
      .eq("id", item.producto_id)
      .single();

    if (prodData) {
      const nuevoStock = prodData.stock_actual - item.cantidad;

      const { error: errStock } = await supabase
        .from("inv_productos")
        .update({ stock_actual: nuevoStock })
        .eq("id", item.producto_id);

      if (errStock)
        console.error(
          `Error descontando stock del producto ${item.producto_id}`,
        );
    }
  }

  revalidatePath("/cermadsa/laarada/pedidos");
  return { success: true };
}

export async function updateVenta(id: string, data: VentaFormValues) {
  const result = VentaSchema.safeParse(data);
  if (!result.success) return { error: "Datos inválidos" };

  const supabase = await createClient();
  const { detalles, ...cabecera } = result.data;

  const { error: errVenta } = await supabase
    .from("ven_ventas")
    .update({
      cliente_id: cabecera.cliente_id,
      tipo_venta: cabecera.tipo_venta,
      tipo_comprobante: cabecera.tipo_comprobante,
      placa_camion: cabecera.placa_camion,
      descripcion_camion: cabecera.descripcion_camion,
      observaciones: cabecera.observaciones,
      total: cabecera.total,
      fecha_entrega: cabecera.fecha_entrega || new Date().toISOString(),
    })
    .eq("id", id);

  if (errVenta) return { error: errVenta.message };

  await supabase.from("ven_detalle").delete().eq("venta_id", id);

  const detallesFinal = detalles.map((d) => ({
    venta_id: id,
    producto_id: d.producto_id,
    cantidad: d.cantidad,
    precio_aplicado: d.precio_unitario,
    subtotal: d.subtotal,
  }));

  const { error: errDetalle } = await supabase
    .from("ven_detalle")
    .insert(detallesFinal);

  if (errDetalle) return { error: "Error al actualizar productos" };

  revalidatePath("/cermadsa/laarada/pedidos");
  return { success: true };
}

export async function getVentaById(id: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ven_ventas")
    .select(
      `
      *,
      ven_clientes (*),
      ven_detalle (
        *,
        inv_productos (nombre, codigo, medida)
      )
    `,
    )
    .eq("id", id)
    .single();

  if (error) return null;
  return data;
}

export async function updateEstadoVenta(
  id: string,
  estado: string,
  observaciones: string,
) {
  const supabase = await createClient();

  if (estado.toLowerCase().trim() === "anulado") {
    const { data: detalles } = await supabase
      .from("ven_detalle")
      .select("producto_id, cantidad")
      .eq("venta_id", id);

    if (detalles) {
      for (const item of detalles) {
        const { data: prodData } = await supabase
          .from("inv_productos")
          .select("stock_actual")
          .eq("id", item.producto_id)
          .single();

        if (prodData) {
          const nuevoStock = prodData.stock_actual + item.cantidad;

          await supabase
            .from("inv_productos")
            .update({ stock_actual: nuevoStock })
            .eq("id", item.producto_id);
        }
      }
    }
  }

  const { error } = await supabase
    .from("ven_ventas")
    .update({ estado, observaciones })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/cermadsa/laarada/pedidos");
  return { success: true };
}

export async function getPendingOrdersCount() {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("ven_ventas")
    .select("*", { count: "exact", head: true })
    .ilike("estado", "Pendiente");

  if (error) return 0;
  return count || 0;
}
