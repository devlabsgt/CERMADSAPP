"use server";

import { createClient } from "@/utils/supabase/server";
import { headers } from "next/headers";

export async function checkDeviceRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return true;

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Desconocido";

  const { data } = await supabase
    .from("authorized_devices")
    .select("id")
    .eq("user_id", user.id)
    .eq("browser_fingerprint", userAgent)
    .limit(1)
    .maybeSingle();

  return !!data;
}

export async function createDeviceRequest() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "No autenticado" };

  const headersList = await headers();
  const userAgent = headersList.get("user-agent") || "Desconocido";

  const { error } = await supabase.from("authorized_devices").insert({
    user_id: user.id,
    device_name: userAgent,
    browser_fingerprint: userAgent,
    is_authorized: false,
  });

  if (error) return { success: false, error: error.message };

  return { success: true };
}
