"use client";

import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkDeviceRequest, createDeviceRequest } from "./actions";
import { Loader2, Lock } from "lucide-react";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

export default function EsperandoAcceso() {
  const router = useRouter();
  const [hasRequest, setHasRequest] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const { theme } = useTheme();

  useEffect(() => {
    const verifyRequest = async () => {
      const exists = await checkDeviceRequest();
      setHasRequest(exists);
    };
    verifyRequest();

    const interval = setInterval(() => {
      router.refresh();
    }, 5000);

    return () => clearInterval(interval);
  }, [router]);

  const handleCreateRequest = async () => {
    setLoading(true);
    const res = await createDeviceRequest();
    setLoading(false);

    const isDark = theme === "dark";

    if (res.success) {
      setHasRequest(true);
      Swal.fire({
        icon: "success",
        title: "Solicitud enviada",
        text: "El administrador revisará su solicitud pronto.",
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        confirmButtonColor: "#059669",
      });
    } else {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: res.error,
        background: isDark ? "#09090b" : "#ffffff",
        color: isDark ? "#ffffff" : "#000000",
        confirmButtonColor: "#ea580c",
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 text-center shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="p-4 bg-amber-500/10 rounded-full">
            <AnimatedIcon iconKey="oskfhomm" className="size-20 text-white" />
          </div>
        </div>
        <h1 className="text-2xl font-bold mb-2">Acceso en espera</h1>
        <p className="text-muted-foreground mb-6">
          Su dispositivo está registrado pero aún no ha sido autorizado por el
          administrador de <strong>CERMAD S.A.</strong>
        </p>
        <div className="bg-muted/50 p-4 rounded-xl text-sm mb-6 border border-border italic">
          Por favor, solicite su acceso al departamento de sistemas.
        </div>
        {!hasRequest && (
          <button
            onClick={handleCreateRequest}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-xl font-semibold transition-all disabled:opacity-50 active:scale-95"
          >
            {loading ? (
              <Loader2 className="size-5 animate-spin" />
            ) : (
              <Lock className="size-5" />
            )}
            Volver a enviar solicitud
          </button>
        )}
      </div>
    </div>
  );
}
