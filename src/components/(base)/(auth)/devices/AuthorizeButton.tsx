"use client";

import { authorizeDevice, denyDevice } from "./actions";
import { useState } from "react";
import { Check, X, Loader2 } from "lucide-react";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

export function AuthorizeButton({
  id,
  isAuthorized,
  deviceName,
}: {
  id: string;
  isAuthorized: boolean;
  deviceName?: string;
}) {
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();

  const handleAction = async (action: "authorize" | "deny") => {
    const isDark = theme === "dark";

    if (action === "authorize") {
      // Ask for a friendly name when authorizing
      const { value: friendlyName, isConfirmed } = await Swal.fire({
        title: "¿Autorizar acceso?",
        html: `<p style="font-size:13px;margin-bottom:12px;color:${isDark ? "#a1a1aa" : "#71717a"}">El usuario podrá ingresar con este dispositivo.</p>
               <input id="swal-friendly-name" class="swal2-input" placeholder="Nombre del dispositivo (ej: PC Oscar)" style="font-size:13px;" />`,
        icon: "question",
        showCancelButton: true,
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        confirmButtonColor: "#059669",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Autorizar",
        cancelButtonText: "Cancelar",
        preConfirm: () => {
          return (document.getElementById("swal-friendly-name") as HTMLInputElement)?.value.trim() || undefined;
        },
      });

      if (!isConfirmed) return;

      setLoading(true);
      try {
        const res = await authorizeDevice(id, friendlyName || undefined);
        if (res.success) {
          Swal.fire({
            icon: "success",
            title: "Autorizado",
            timer: 1500,
            showConfirmButton: false,
            background: isDark ? "#09090b" : "#ffffff",
            color: isDark ? "#ffffff" : "#000000",
          });
        } else {
          throw new Error(res.error);
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Error desconocido";
        Swal.fire({ icon: "error", title: "Error", text: errorMessage, background: isDark ? "#09090b" : "#ffffff", color: isDark ? "#ffffff" : "#000000", confirmButtonColor: "#ea580c" });
      } finally {
        setLoading(false);
      }
      return;
    }

    // Deny / revoke
    const result = await Swal.fire({
      title: isAuthorized ? "¿Revocar acceso?" : "¿Rechazar solicitud?",
      text: isAuthorized
        ? "Se eliminará el acceso y el dispositivo de la base de datos."
        : "Se eliminará la solicitud permanentemente.",
      icon: "warning",
      showCancelButton: true,
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Sí, confirmar",
      cancelButtonText: "Cancelar",
    });

    if (!result.isConfirmed) return;

    setLoading(true);
    try {
      const res = await denyDevice(id);
      if (res.success) {
        Swal.fire({
          icon: "success",
          title: isAuthorized ? "Revocado" : "Rechazado",
          timer: 1500,
          showConfirmButton: false,
          background: isDark ? "#09090b" : "#ffffff",
          color: isDark ? "#ffffff" : "#000000",
        });
      } else {
        throw new Error(res.error);
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      Swal.fire({ icon: "error", title: "Error", text: errorMessage, background: isDark ? "#09090b" : "#ffffff", color: isDark ? "#ffffff" : "#000000", confirmButtonColor: "#ea580c" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-end gap-3">
      <button
        onClick={() => handleAction("deny")}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 dark:text-red-400 dark:bg-red-500/10 dark:border-red-500/20 dark:hover:bg-red-500/20 shadow-sm"
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <X className="size-4 stroke-3" />
        )}
        {isAuthorized ? "Revocar" : "Rechazar"}
      </button>
      {!isAuthorized && (
        <button
          onClick={() => handleAction("authorize")}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 cursor-pointer active:scale-95 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-500/10 dark:border-emerald-500/20 dark:hover:bg-emerald-500/20 shadow-sm"
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4 stroke-3" />
          )}
          Autorizar
        </button>
      )}
    </div>
  );
}
