"use client";

import { useState, useEffect } from "react";
import {
  getRegistrationOptions,
  verifyRegistration,
} from "../passkeys/passkeys-actions";
import { startRegistration } from "@simplewebauthn/browser";
import { browserSupportsWebAuthn } from "@simplewebauthn/browser";
import { AlertCircle, Fingerprint, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function PasskeyPrompt() {
  const [isVisible, setIsVisible] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      const dismissed = localStorage.getItem("passkey-prompt-dismissed");
      if (dismissed === "true") return;

      const supports = browserSupportsWebAuthn();
      if (supports) {
        setIsVisible(true);
      }
    };
    checkStatus();
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem("passkey-prompt-dismissed", "true");
    }
    setIsVisible(false);
  };

  const handleRegister = async () => {
    setIsPending(true);
    try {
      const options = await getRegistrationOptions();
      const regResp = await startRegistration({ optionsJSON: options });
      const verification = await verifyRegistration(regResp);

      if (verification.success) {
        localStorage.setItem("passkey-prompt-dismissed", "true");
        setIsVisible(false);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <button
          onClick={() => setIsVisible(false)}
          className="absolute right-4 top-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="size-5" />
        </button>

        <div className="p-8 flex flex-col items-center text-center space-y-6">
          <div className="size-16 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Fingerprint className="size-10 text-primary" />
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-bold tracking-tight text-foreground">
              ¿Activar Passkey?
            </h3>
            <p className="text-sm text-muted-foreground">
              Use su huella o rostro para iniciar sesión de forma segura sin
              contraseñas la próxima vez.
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              onClick={handleRegister}
              disabled={isPending}
              className="w-full h-11 bg-primary text-primary-foreground font-medium rounded-xl hover:opacity-90 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {isPending ? "Configurando..." : "Configurar ahora"}
            </button>

            <button
              onClick={handleDismiss}
              className="w-full h-11 bg-secondary text-secondary-foreground font-medium rounded-xl hover:bg-secondary/80 transition-all"
            >
              Omitir por ahora
            </button>
          </div>

          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="size-4 rounded border-input bg-background"
            />
            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
              No volver a preguntar en este dispositivo
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
