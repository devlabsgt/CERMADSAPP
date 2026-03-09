import { createClient as createAdminClient } from "@supabase/supabase-js";
import { AuthorizeButton } from "./AuthorizeButton";
import {
  Monitor,
  Smartphone,
  Calendar,
  AlertCircle,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  is_authorized: boolean;
  created_at: string;
}

export async function Dispositivos() {
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  );

  const { data: devicesData, error: devicesError } = await supabaseAdmin
    .from("authorized_devices")
    .select("*")
    .order("created_at", { ascending: false });

  if (devicesError) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive text-xs font-bold flex items-center gap-2">
        <AlertCircle className="size-4" /> Error: {devicesError.message}
      </div>
    );
  }

  const devices = (devicesData as Device[]) || [];

  const userIds = devices.map((d) => d.user_id);
  let profiles: Record<string, string> = {};

  if (userIds.length > 0) {
    const { data: profilesData } = await supabaseAdmin
      .from("profiles")
      .select("id, nombre")
      .in("id", userIds);

    if (profilesData) {
      profilesData.forEach((p) => {
        profiles[p.id] = p.nombre || "Sin nombre";
      });
    }
  }

  return (
    <div className="w-full lg:w-4/5 mx-auto relative overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-left text-[9px] lg:text-xs">
        <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border uppercase tracking-widest">
          <tr>
            <th className="px-4 lg:px-6 py-4">Usuario</th>
            <th className="px-4 lg:px-6 py-4">Dispositivo</th>
            <th className="px-4 lg:px-6 py-4">Fecha Solicitud</th>
            <th className="px-4 lg:px-6 py-4">Estado</th>
            <th className="px-4 lg:px-6 py-4 text-right">Gestión</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {devices.map((dev) => (
            <tr
              key={dev.id}
              className="hover:bg-muted/20 transition-colors font-medium"
            >
              <td className="px-4 lg:px-6 py-4 text-foreground">
                {profiles[dev.user_id] || "Sin nombre"}
              </td>
              <td className="px-4 lg:px-6 py-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  {dev.device_name.toLowerCase().includes("mac") ||
                  dev.device_name.toLowerCase().includes("windows") ? (
                    <Monitor className="size-3 lg:size-3.5 shrink-0" />
                  ) : (
                    <Smartphone className="size-3 lg:size-3.5 shrink-0" />
                  )}
                  <span className="truncate max-w-25 lg:max-w-37.5">
                    {dev.device_name}
                  </span>
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3 shrink-0" />
                  {format(new Date(dev.created_at), "dd/MM/yyyy HH:mm", {
                    locale: es,
                  })}
                </div>
              </td>
              <td className="px-4 lg:px-6 py-4">
                {dev.is_authorized ? (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1 rounded-full font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="size-3" />
                    Autorizado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2 py-1 lg:px-2.5 lg:py-1 rounded-full font-bold uppercase bg-red-500/10 text-red-600 dark:text-red-400">
                    <ShieldAlert className="size-3" />
                    Desautorizado
                  </span>
                )}
              </td>
              <td className="px-4 lg:px-6 py-4 text-right">
                <AuthorizeButton id={dev.id} isAuthorized={dev.is_authorized} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {devices.length === 0 && (
        <div className="p-12 text-center text-muted-foreground italic text-[9px] lg:text-xs">
          No hay registros de dispositivos.
        </div>
      )}
    </div>
  );
}
