"use client";

import { useState, useEffect, useActionState } from "react";
import { login, type ActionState } from "./actions";
import { getPasskeyOptions, verifyPasskey } from "./passkeys/passkeys-actions";
import { startAuthentication } from "@simplewebauthn/browser";
import { MagicCard } from "@/components/ui/magic-card";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuroraText } from "@/components/ui/aurora-text";
import { DotPattern } from "@/components/ui/dot-pattern";

const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label
    {...props}
    className={cn(
      "text-sm font-semibold leading-none text-foreground/70",
      className,
    )}
  />
);

const Input = ({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...props}
    className={cn(
      "flex h-10 w-full rounded-lg border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 transition-all",
      className,
    )}
  />
);

const Button = ({
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    {...props}
    className={cn(
      "inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all bg-primary text-primary-foreground hover:opacity-90 h-11 px-8 cursor-pointer active:scale-[0.98] disabled:opacity-50",
      className,
    )}
  />
);

export default function LogIn() {
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState("");
  const [isPasskeyPending, setIsPasskeyPending] = useState<boolean>(false);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    login,
    null,
  );

  const handlePasskeyLogin = async () => {
    setIsPasskeyPending(true);
    try {
      const options = await getPasskeyOptions();
      const asseResp = await startAuthentication({ optionsJSON: options });
      const verification = await verifyPasskey(asseResp);

      if (verification.success) {
        window.location.href = "/cermadsa";
      } else {
        alert(`Fallo en Passkey: ${verification.error}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error desconocido";
      alert(`Error inesperado: ${errorMessage}`);
    } finally {
      setIsPasskeyPending(false);
    }
  };

  useEffect(() => {
    setMounted(true);
  }, []);

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
              <Label htmlFor="username">Usuario</Label>
              <Input
                id="username"
                type="text"
                placeholder="Tu usuario"
                required
                value={username}
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
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  className="pr-10"
                  defaultValue={state?.fields?.password}
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
              <Button
                type="submit"
                className="w-full h-12 text-base"
                disabled={isPending || isPasskeyPending}
              >
                {isPending ? "Verificando..." : "Iniciar Sesión"}
              </Button>

              <Button
                type="button"
                onClick={handlePasskeyLogin}
                className="w-full h-12 text-base bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-border"
                disabled={isPending || isPasskeyPending}
              >
                {isPasskeyPending ? "Esperando biometría..." : "Usar Passkey"}
              </Button>

              {state?.message && (
                <div
                  className={cn(
                    "mt-4 flex items-center gap-2 rounded-lg border p-3 text-[11px] animate-in fade-in slide-in-from-top-1",
                    state.errorType === "invalid"
                      ? "border-destructive/20 bg-destructive/10 text-destructive"
                      : "border-orange-500/20 bg-orange-500/10 text-orange-600",
                  )}
                >
                  <AlertCircle className="size-4 shrink-0" />
                  <p>{state.message}</p>
                </div>
              )}
            </div>
          </form>
        </MagicCard>
      </div>
    </div>
  );
}
