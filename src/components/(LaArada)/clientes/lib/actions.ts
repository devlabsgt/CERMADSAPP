"use server";

import { createClient } from "@/utils/supabase/server";
import { ClientSchema, ClientFormValues } from "./zod";
import { revalidatePath } from "next/cache";

export async function getClients() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("ven_clientes")
    .select("*")
    .order("nombre", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createClientAction(data: ClientFormValues) {
  const result = ClientSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("ven_clientes")
    .select("nit")
    .eq("nit", result.data.nit)
    .maybeSingle();

  if (existing && result.data.nit.toLowerCase() !== "c/f") {
    return { error: "El NIT ya está registrado." };
  }

  const { error } = await supabase.from("ven_clientes").insert(result.data);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/clientes");
  return { success: true };
}

export async function updateClientAction(id: string, data: ClientFormValues) {
  const result = ClientSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("ven_clientes")
    .select("id, nit")
    .eq("nit", result.data.nit)
    .neq("id", id)
    .maybeSingle();

  if (existing && result.data.nit.toLowerCase() !== "c/f") {
    return { error: "El NIT ya está registrado por otro cliente." };
  }

  const { error } = await supabase
    .from("ven_clientes")
    .update(result.data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/clientes");
  return { success: true };
}

export async function deleteClientAction(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("ven_clientes").delete().eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/cermadsa/laarada/clientes");
  return { success: true };
}
