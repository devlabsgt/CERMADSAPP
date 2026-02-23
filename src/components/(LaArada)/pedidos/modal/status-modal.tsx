import { useState, useEffect } from "react";
import { X, Save, AlertCircle } from "lucide-react";
import { updateEstadoVenta } from "../lib/actions";
import { MagicCard } from "@/components/ui/magic-card";

export default function StatusModal({ isOpen, onClose, venta }: any) {
  const [estado, setEstado] = useState("Entregado");
  const [observaciones, setObservaciones] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (venta) {
      setEstado(venta.estado === "Pendiente" ? "Entregado" : venta.estado);
      setObservaciones(venta.observaciones || "");
    }
  }, [venta]);

  if (!isOpen || !venta) return null;

  const esAnulado = estado === "Anulado";
  const comentarioValido = observaciones.trim().length >= 10;

  // El botón se deshabilita si está cargando o si es anulado y el comentario es muy corto
  const botonDeshabilitado = loading || (esAnulado && !comentarioValido);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (esAnulado && !comentarioValido) return;

    setLoading(true);
    const res = await updateEstadoVenta(venta.id, estado, observaciones);
    setLoading(false);
    if (res?.success) {
      window.location.reload();
    }
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <MagicCard className="w-full max-w-md p-6 shadow-2xl rounded-xl relative animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Actualizar Estado
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer text-muted-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="text-sm font-bold text-muted-foreground uppercase">
              Seleccione el nuevo estado
            </label>
            <div className="flex gap-3">
              {[
                {
                  valor: "Entregado",
                  clasesActivas:
                    "border-green-500 bg-green-500/10 text-green-600 dark:text-green-400",
                },
                {
                  valor: "Anulado",
                  clasesActivas:
                    "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400",
                },
              ].map(({ valor, clasesActivas }) => (
                <label
                  key={valor}
                  className={`flex flex-1 flex-col items-center justify-center gap-2 p-6 border-2 rounded-xl cursor-pointer transition-all h-28 ${
                    estado === valor
                      ? clasesActivas
                      : "bg-background text-muted-foreground border-border hover:bg-muted"
                  }`}
                >
                  <input
                    type="radio"
                    name="estado"
                    value={valor}
                    checked={estado === valor}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEstado(e.target.value)
                    }
                    className="sr-only"
                  />
                  <span className="font-black text-lg uppercase tracking-wide">
                    {valor}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-muted-foreground uppercase">
                Observaciones{" "}
                {esAnulado && <span className="text-red-500">*</span>}
              </label>
              {esAnulado && (
                <span
                  className={`text-[10px] font-bold flex items-center gap-1 ${comentarioValido ? "text-green-500" : "text-red-500 animate-pulse"}`}
                >
                  <AlertCircle className="size-3" />
                  {comentarioValido ? "MOTIVO VÁLIDO" : "MÍNIMO 10 CARACTERES"}
                </span>
              )}
            </div>
            <textarea
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={
                esAnulado
                  ? "Describa detalladamente el motivo de la anulación..."
                  : "Notas adicionales del pedido..."
              }
              className={`w-full min-h-24 p-4 bg-background border-2 rounded-xl outline-none transition-all focus:ring-2 focus:ring-primary/20 resize-none text-base text-foreground ${
                esAnulado && !comentarioValido
                  ? "border-red-500/50 bg-red-500/5"
                  : "border-border"
              }`}
            />
          </div>

          <div className="flex flex-col gap-3 pt-2">
            <button
              type="submit"
              disabled={botonDeshabilitado}
              className="flex items-center justify-center gap-2 bg-primary text-primary-foreground h-12 rounded-xl font-black uppercase tracking-widest hover:opacity-90 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-primary/20"
            >
              <Save className="size-5" />
              {loading ? "Procesando..." : "Confirmar Cambio"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="h-12 rounded-xl font-bold hover:bg-muted transition-colors cursor-pointer text-muted-foreground border-2"
            >
              Cancelar
            </button>
          </div>
        </form>
      </MagicCard>
    </div>
  );
}
