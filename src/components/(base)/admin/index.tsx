import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  SmartphoneNfc,
  Users,
  ShieldAlert,
  ChevronRight,
  Clock,
} from "lucide-react";
import { getPendingDevicesCount } from "@/components/(LaArada)/admin/lib/actions";

export async function AdminPanel() {
  // Auth check — only super, admin, rrhh
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const metadata = user.user_metadata || {};
  const role = metadata.rol || user.role || "user";

  if (!["super", "admin", "rrhh"].includes(role)) {
    redirect("/cermadsa");
  }

  const pendingDevices = (await getPendingDevicesCount()) ?? 0;

  const adminOptions = [
    {
      href: "/cermadsa/admin/dispositivos",
      title: "Dispositivos",
      description: "Autorizar o rechazar solicitudes de acceso por dispositivo.",
      icon: SmartphoneNfc,
      badge: pendingDevices > 0 ? pendingDevices : null,
      badgeColor: "bg-amber-500",
      iconColor: "text-amber-500",
      borderColor: "border-amber-500/20",
      bgColor: "bg-amber-500/5 dark:bg-amber-500/5",
    },
    {
      href: "/cermadsa/usuarios",
      title: "Usuarios",
      description: "Gestionar cuentas de usuario, roles y permisos.",
      icon: Users,
      badge: null,
      badgeColor: "",
      iconColor: "text-purple-500",
      borderColor: "border-purple-500/20",
      bgColor: "bg-purple-500/5 dark:bg-purple-500/5",
    },
  ];

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col gap-2 px-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10">
            <ShieldAlert className="size-5 text-amber-500" />
          </div>
          <h1 className="text-3xl font-bold tracking-tighter text-foreground">
            Administración
          </h1>
        </div>
        <p className="text-sm text-muted-foreground ml-0.5">
          Panel de control administrativo — acceso restringido.
        </p>
      </div>

      {/* Pending summary */}
      {pendingDevices > 0 && (
        <div className="mx-4 flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
          <Clock className="size-5 text-amber-500 shrink-0 animate-pulse" />
          <p className="text-sm font-semibold text-amber-700 dark:text-amber-400">
            Hay{" "}
            <span className="font-bold">{pendingDevices}</span>{" "}
            solicitud{pendingDevices !== 1 && "es"} de dispositivo
            {pendingDevices !== 1 && "s"} pendiente
            {pendingDevices !== 1 && "s"} de aprobación.
          </p>
        </div>
      )}

      {/* Option cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 px-4">
        {adminOptions.map((opt) => (
          <Link
            key={opt.href}
            href={opt.href}
            className={`group relative flex flex-col justify-between gap-4 p-6 rounded-2xl border ${opt.borderColor} ${opt.bgColor} hover:shadow-md transition-all duration-300 hover:-translate-y-1`}
          >
            <div className="flex items-start justify-between">
              <div className={`p-3 rounded-xl bg-background border border-border/50 group-hover:scale-110 transition-transform duration-300`}>
                <opt.icon className={`size-5 ${opt.iconColor}`} />
              </div>
              {opt.badge !== null && (
                <span className={`flex items-center justify-center min-w-[26px] h-[26px] px-1.5 rounded-full ${opt.badgeColor} text-xs font-bold text-white animate-pulse`}>
                  {opt.badge}
                </span>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold tracking-tight">{opt.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{opt.description}</p>
            </div>

            <div className="flex items-center gap-1 text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
              Ir al módulo
              <ChevronRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
