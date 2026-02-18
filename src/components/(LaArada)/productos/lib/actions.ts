"use server";

import { createClient } from "@/utils/supabase/server";
import { ProductSchema, ProductFormValues } from "./zod";
import { revalidatePath } from "next/cache";

export async function getProducts() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inv_productos")
    .select("*")
    .eq("activo", true)
    .order("codigo", { ascending: true });

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduct(data: ProductFormValues) {
  const result = ProductSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("inv_productos")
    .select("codigo, nombre")
    .or(`codigo.eq.${result.data.codigo},nombre.eq.${result.data.nombre}`)
    .eq("activo", true)
    .maybeSingle();

  if (existing) {
    if (existing.codigo === result.data.codigo)
      return { error: "El código ya existe." };
    if (existing.nombre === result.data.nombre)
      return { error: "El nombre ya existe." };
  }

  const { error } = await supabase.from("inv_productos").insert(result.data);

  if (error) return { error: error.message };
  revalidatePath("/productos");
  return { success: true };
}

export async function updateProduct(id: string, data: ProductFormValues) {
  const result = ProductSchema.safeParse(data);

  if (!result.success) {
    return { error: "Datos inválidos" };
  }

  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("inv_productos")
    .select("id, codigo, nombre")
    .or(`codigo.eq.${result.data.codigo},nombre.eq.${result.data.nombre}`)
    .neq("id", id)
    .eq("activo", true)
    .maybeSingle();

  if (existing) {
    if (existing.codigo === result.data.codigo)
      return { error: "El código ya está en uso por otro producto." };
    if (existing.nombre === result.data.nombre)
      return { error: "El nombre ya está en uso por otro producto." };
  }

  const { error } = await supabase
    .from("inv_productos")
    .update(result.data)
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/productos");
  return { success: true };
}

export async function deleteProduct(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("inv_productos")
    .update({ activo: false })
    .eq("id", id);

  if (error) return { error: error.message };
  revalidatePath("/productos");
  return { success: true };
}
export async function getNextProductCode() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inv_productos")
    .select("codigo")
    .order("codigo", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return "001";
  if (!data) return "001";

  const lastCode = parseInt(data.codigo, 10);
  const nextCode = lastCode + 1;
  return nextCode.toString().padStart(3, "0");
}
