"use server";

import { createClient } from "@/utils/supabase/server";
import { PagoCreditoSchema, PagoCreditoValues } from "./zod";
import { revalidatePath } from "next/cache";

export async function procesarPagoCredito(data: PagoCreditoValues) {
  const result = PagoCreditoSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos de pago inválidos." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("ven_ventas")
    .update({ estado: "Pagado" })
    .eq("id", result.data.venta_id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/cermadsa/laarada/creditos");
  revalidatePath("/cermadsa/laarada/pedidos");

  return { success: true };
}
