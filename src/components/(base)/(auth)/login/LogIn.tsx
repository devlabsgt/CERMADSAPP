"use client";

import { useState, useEffect, useActionState } from "react";
import { login, type ActionState } from "./actions";
import { getPasskeyOptions, verifyPasskey } from "./passkeys/passkeys-actions";
import { startAuthentication } from "@simplewebauthn/browser";
import { MagicCard } from "@/components/ui/magic-card";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";
import { DotPattern } from "@/components/ui/dot-pattern";
import { useTheme } from "next-themes";
import Swal from "sweetalert2";

export default function LogIn() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [isPasskeyPending, setIsPasskeyPending] = useState<boolean>(false);
  const { theme } = useTheme();

  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    login,
    null,
  );

  const showError = (message: string) => {
    const isDark = theme === "dark";
    Swal.fire({
      icon: "error",
      title: "Error de Acceso",
      text: message,
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#09090b",
      confirmButtonColor: "#ea580c",
      customClass: {
        popup: cn(
          "rounded-3xl border backdrop-blur-xl transition-colors duration-300",
          isDark ? "border-white/10 shadow-2xl" : "border-black/10 shadow-lg",
        ),
      },
    });
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (state?.success) {
      window.location.href = "/cermadsa";
    } else if (state?.message === "DEVICE_PENDING") {
      window.location.href = "/esperando-acceso";
    } else if (state?.message) {
      showError(state.message);
    }
  }, [state, theme]);

  const handlePasskeyLogin = async () => {
    setIsPasskeyPending(true);
    try {
      const options = await getPasskeyOptions();
      const asseResp = await startAuthentication({ optionsJSON: options });
      const verification = await verifyPasskey(asseResp);

      if (verification.success) {
        window.location.href = "/cermadsa";
      } else if (verification.error === "DEVICE_PENDING") {
        window.location.href = "/esperando-acceso";
      } else if (verification.error) {
        showError(verification.error);
      }
    } catch (error: any) {
      const msg = error.message || "";
      if (
        error.name === "NotAllowedError" ||
        error.name === "AbortError" ||
        msg.includes("timed out") ||
        msg.includes("not allowed")
      ) {
        return;
      }
      showError("Fallo en la biometría o tiempo excedido.");
    } finally {
      setIsPasskeyPending(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="relative flex-1 flex flex-col items-center justify-center w-full bg-background z-0 overflow-hidden">
      <div className="absolute inset-0 z-0 pointer-events-none">
        <DotPattern className="mask-[radial-gradient(1000px_circle_at_center,white,transparent)] opacity-80" />
      </div>

      <div className="relative w-full max-w-md p-12 z-10">
        <MagicCard className="rounded-3xl border border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl overflow-visible!">
          <div className="flex flex-col items-center space-y-6 p-10 border-b border-border/50 text-center">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold tracking-tight">
                <AuroraText>Bienvenido de nuevo</AuroraText>
              </h3>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                KORE AUTHENTICATION SYSTEM
              </p>
            </div>
          </div>

          <form action={formAction} className="p-10 space-y-6">
            <div className="grid gap-2">
              <label className="text-sm font-semibold text-foreground/70">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                placeholder="Tu usuario"
                required
                value={username}
                className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ring"
                onChange={(e) =>
                  setUsername(e.target.value.toLowerCase().trim())
                }
              />
              <input
                type="hidden"
                name="email"
                value={username ? `${username}@app.com` : ""}
              />
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-semibold text-foreground/70">
                Contraseña
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                className="w-full h-12 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 cursor-pointer active:scale-95 disabled:opacity-50"
                disabled={isPending || isPasskeyPending}
              >
                {isPending ? "Verificando..." : "Iniciar Sesión"}
              </button>

              <button
                type="button"
                onClick={handlePasskeyLogin}
                className="w-full h-12 inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border cursor-pointer active:scale-95 disabled:opacity-50"
                disabled={isPending || isPasskeyPending}
              >
                {isPasskeyPending ? "Esperando biometría..." : "Usar Passkey"}
              </button>
            </div>
          </form>
        </MagicCard>
      </div>
    </div>
  );
}
