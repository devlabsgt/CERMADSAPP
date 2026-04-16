"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ProductSchema, ProductFormValues } from "../lib/zod";
import {
  useCreateProduct,
  useUpdateProduct,
} from "../lib/hooks";
import { getNextProductCode } from "../lib/actions";
import { useEffect } from "react";
import { X, Trash2, Save, Package, AlertTriangle } from "lucide-react";
import { MagicCard } from "@/components/ui/magic-card";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";
import { useUser } from "@/components/(base)/providers/UserProvider";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: ProductFormValues & { id: string };
}

export default function ProductModal({
  isOpen,
  onClose,
  productToEdit,
}: ProductModalProps) {
  const { theme } = useTheme();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const canEditRestricted = ["super", "admin"].includes(realRole);
  const canEditEstado = ["super", "admin", "ventas"].includes(realRole);

  const {
    register,
    handleSubmit,
    reset,
    setError,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(ProductSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      medida: "m³",
      precio_base: 90,
      stock_actual: 0,
      stock_minimo: 10,
      activo: true,
    },
  });

  const isActive = watch("activo");

  useEffect(() => {
    const prepareModal = async () => {
      if (!isOpen) return;
      if (productToEdit) {
        reset(productToEdit);
      } else {
        reset({
          codigo: "",
          nombre: "",
          medida: "m³",
          precio_base: 90,
          stock_actual: 0,
          stock_minimo: 10,
          activo: true,
        });
        const code = await getNextProductCode();
        setValue("codigo", code);
      }
    };
    prepareModal();
  }, [productToEdit, reset, isOpen, setValue]);


  const onSubmit = async (data: any) => {
    const res = productToEdit?.id
      ? await updateMutation.mutateAsync({ id: productToEdit.id, data })
      : await createMutation.mutateAsync(data);

    if (res?.error) {
      const msg = res.error.toLowerCase();
      if (msg.includes("código"))
        setError("codigo", { type: "manual", message: res.error });
      else if (msg.includes("nombre"))
        setError("nombre", { type: "manual", message: res.error });
      return;
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <MagicCard className="w-full max-w-lg p-6 shadow-2xl rounded-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Package
              className={`size-6 ${productToEdit ? "text-blue-500" : "text-green-500"}`}
            />
            <h2
              className={`text-xl font-bold ${productToEdit ? "text-blue-500" : "text-green-500"}`}
            >
              {productToEdit ? "Editar Producto" : "Nuevo Producto"}
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Código
              </label>
              <input
                {...register("codigo")}
                disabled={!canEditRestricted}
                className={`w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none transition-all ${!canEditRestricted ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-primary/20"} ${errors.codigo ? "border-red-500" : "border-input"}`}
              />
              {errors.codigo && (
                <span className="text-[10px] text-red-500 font-bold uppercase">
                  {errors.codigo.message as string}
                </span>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Nombre
              </label>
              <input
                {...register("nombre")}
                placeholder="Ej. Arena de Río"
                className={`w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all ${errors.nombre ? "border-red-500" : "border-input"}`}
              />
              {errors.nombre && (
                <span className="text-[10px] text-red-500 font-bold uppercase">
                  {errors.nombre.message as string}
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Precio Base (Q)
              </label>
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                {...register("precio_base")}
                disabled={!canEditRestricted}
                className={`w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input transition-all ${!canEditRestricted ? "opacity-60 cursor-not-allowed" : "focus:ring-2 focus:ring-primary/20"}`}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Medida
              </label>
              <input
                {...register("medida")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 p-3 rounded-lg bg-muted/20 border border-dashed border-border/50">
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase flex items-center gap-1">
                Stock Mínimo{" "}
                <AlertTriangle className="size-3 text-orange-500" />
              </label>
              <input
                type="number"
                step="0.01"
                {...register("stock_minimo")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-foreground/50 uppercase">
                Stock Actual
              </label>
              <input
                type="number"
                step="0.01"
                {...register("stock_actual")}
                className="w-full h-10 px-3 border rounded-lg bg-background/50 text-sm outline-none border-input focus:ring-2 focus:ring-primary/20 font-mono"
              />
            </div>
          </div>

          {productToEdit && (
            <div className={`flex items-center justify-between p-3 rounded-xl border border-border/50 bg-muted/5 ${!canEditEstado ? "opacity-70" : ""}`}>
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-foreground/70 uppercase">
                  Estado del Producto
                </label>
                <p className="text-[10px] text-muted-foreground italic">
                  {isActive
                    ? "Disponible para la venta"
                    : "No disponible en el catálogo"}
                </p>
              </div>
              <label className={`relative inline-flex items-center ${canEditEstado ? "cursor-pointer" : "cursor-not-allowed"}`}>
                <input
                  type="checkbox"
                  {...register("activo")}
                  disabled={!canEditEstado}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-red-500/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>
          )}

          <div className="flex justify-between items-center pt-6">
            <div></div>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-8 py-2 text-xs font-bold border transition-all cursor-pointer active:scale-95 uppercase tracking-wider rounded-lg
                ${
                  productToEdit
                    ? "text-blue-500 border-blue-500/50 hover:bg-blue-500/10"
                    : "text-green-500 border-green-500/50 hover:bg-green-500/10"
                } ${isSubmitting ? "opacity-40" : ""}`}
            >
              <Save className="size-4" />
              {isSubmitting
                ? "Procesando..."
                : productToEdit
                  ? "Actualizar"
                  : "Crear"}
            </button>
          </div>
        </form>
      </MagicCard>
    </div>
  );
}
