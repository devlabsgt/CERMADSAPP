"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientSchema, ClientFormValues } from "../lib/zod";
import {
  useCreateClient,
  useUpdateClient,
} from "../lib/hooks";
import { useEffect } from "react";
import { X, Save, User } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";

interface ClientModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientToEdit?: ClientFormValues & { id: string };
}

export default function ClientModal({
  isOpen,
  onClose,
  clientToEdit,
}: ClientModalProps) {
  const createMutation = useCreateClient();
  const updateMutation = useUpdateClient();

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ClientFormValues>({
    resolver: zodResolver(ClientSchema),
    mode: "onSubmit",
    defaultValues: {
      nombre: "",
      nit: "C/F",
      direccion: "Ciudad",
      telefono: "",
      email: "",
    },
  });

  useEffect(() => {
    if (!isOpen) return;
    if (clientToEdit) {
      reset(clientToEdit);
    } else {
      reset({
        nombre: "",
        nit: "C/F",
        direccion: "Ciudad",
        telefono: "",
        email: "",
      });
    }
  }, [clientToEdit, reset, isOpen]);

  const onSubmit = async (data: ClientFormValues) => {
    // Trim values before sending
    const trimmed: ClientFormValues = {
      ...data,
      nombre: data.nombre.trim(),
      nit: data.nit.trim(),
      direccion: data.direccion.trim(),
      telefono: data.telefono?.trim() ?? "",
      email: data.email?.trim() ?? "",
    };

    const res = clientToEdit?.id
      ? await updateMutation.mutateAsync({ id: clientToEdit.id, data: trimmed })
      : await createMutation.mutateAsync(trimmed);

    if (res?.error) {
      if (res.error.toLowerCase().includes("nit")) {
        setError("nit", { type: "manual", message: res.error });
      }
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  const inputClass = (hasError: boolean) =>
    `w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${
      hasError ? "border-red-500" : "border-input"
    }`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 text-foreground">
      <MagicCard className="w-full max-w-lg p-6 shadow-2xl rounded-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <User
              className={`size-6 ${
                clientToEdit ? "text-blue-500" : "text-green-500"
              }`}
            />
            <h2
              className={`text-xl font-bold ${
                clientToEdit ? "text-blue-500" : "text-green-500"
              }`}
            >
              {clientToEdit ? "Editar Cliente" : "Nuevo Cliente"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Nombre Completo
            </label>
            <Controller
              name="nombre"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={inputClass(!!errors.nombre)}
                  autoComplete="off"
                />
              )}
            />
            {errors.nombre && (
              <span className="text-[10px] text-red-500 font-bold uppercase">
                {errors.nombre.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* NIT */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                NIT
              </label>
              <Controller
                name="nit"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    className={inputClass(!!errors.nit)}
                    autoComplete="off"
                  />
                )}
              />
              {errors.nit && (
                <span className="text-[10px] text-red-500 font-bold uppercase">
                  {errors.nit.message}
                </span>
              )}
            </div>
            {/* Teléfono */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground uppercase">
                Teléfono (Opcional)
              </label>
              <Controller
                name="telefono"
                control={control}
                render={({ field }) => (
                  <input
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => field.onChange(e.target.value)}
                    inputMode="numeric"
                    type="tel"
                    className={inputClass(!!errors.telefono)}
                    autoComplete="off"
                  />
                )}
              />
              {errors.telefono && (
                <span className="text-[10px] text-red-500 font-bold uppercase">
                  {errors.telefono.message}
                </span>
              )}
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Dirección
            </label>
            <Controller
              name="direccion"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  className={inputClass(!!errors.direccion)}
                  autoComplete="off"
                />
              )}
            />
            {errors.direccion && (
              <span className="text-[10px] text-red-500 font-bold uppercase">
                {errors.direccion.message}
              </span>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-muted-foreground uppercase">
              Email (Opcional)
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  value={field.value ?? ""}
                  onChange={(e) => field.onChange(e.target.value)}
                  type="email"
                  inputMode="email"
                  className={inputClass(!!errors.email)}
                  autoComplete="off"
                />
              )}
            />
            {errors.email && (
              <span className="text-[10px] text-red-500 font-bold uppercase">
                {errors.email.message}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center pt-6">
            <div></div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-8 py-2 text-xs font-bold border transition-all cursor-pointer rounded-lg uppercase
                ${
                  clientToEdit
                    ? "text-blue-500 border-blue-500/50"
                    : "text-green-500 border-green-500/50"
                }`}
            >
              <Save className="size-4" />
              {isSubmitting
                ? "Cargando..."
                : clientToEdit
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </MagicCard>
    </div>
  );
}