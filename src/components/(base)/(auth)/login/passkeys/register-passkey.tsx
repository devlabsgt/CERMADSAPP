"use client";

import { useState } from "react";
import { startRegistration } from "@simplewebauthn/browser";
import { getRegistrationOptions, verifyRegistration } from "./passkeys-actions";
import { Button } from "@/components/ui/button";

export function RegisterPasskey() {
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleRegister = async () => {
    setIsLoading(true);
    setStatus("");

    try {
      const options = await getRegistrationOptions();
      const attResp = await startRegistration({ optionsJSON: options });
      const verificationResp = await verifyRegistration(attResp);

      if (verificationResp.success) {
        setStatus("Dispositivo registrado exitosamente.");
      } else {
        setStatus(`Error al verificar: ${verificationResp.error}`);
      }
    } catch (error: any) {
      setStatus(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 border rounded-xl bg-card">
      <h3 className="text-lg font-semibold">Configurar Passkey</h3>
      <p className="text-sm text-muted-foreground">
        Añade tu huella, rostro o PIN para iniciar sesión sin contraseña.
      </p>
      <Button onClick={handleRegister} disabled={isLoading}>
        {isLoading ? "Esperando sensor..." : "Registrar dispositivo actual"}
      </Button>
      {status && <p className="text-sm font-medium text-primary">{status}</p>}
    </div>
  );
}
