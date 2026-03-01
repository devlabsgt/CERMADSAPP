"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Receipt,
  CheckCircle2,
  Calendar,
  CreditCard,
  Loader2,
  Truck,
} from "lucide-react";
import { ClienteCredito, VentaCredito } from "../lib/zod";
import { useProcesarPago } from "../lib/hooks";
import { cn } from "@/lib/utils";

interface DetalleCreditoModalProps {
  isOpen: boolean;
  onClose: () => void;
  cliente: ClienteCredito | null;
  ventasCliente: VentaCredito[];
}

export default function DetalleCreditoModal({
  isOpen,
  onClose,
  cliente,
  ventasCliente,
}: DetalleCreditoModalProps) {
  const [selectedPagos, setSelectedPagos] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { mutateAsync: procesarPago } = useProcesarPago();

  useEffect(() => {
    if (isOpen) {
      setSelectedPagos([]);
    }
  }, [isOpen]);

  if (!cliente) return null;

  const togglePago = (id: string) => {
    setSelectedPagos((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id],
    );
  };

  const seleccionarTodos = () => {
    if (selectedPagos.length === ventasCliente.length) {
      setSelectedPagos([]);
    } else {
      setSelectedPagos(ventasCliente.map((v) => v.id));
    }
  };

  const totalSeleccionado = ventasCliente
    .filter((v) => selectedPagos.includes(v.id))
    .reduce((sum, v) => sum + Number(v.total), 0);

  const handlePagarSeleccionados = async () => {
    if (selectedPagos.length === 0) return;
    setIsProcessing(true);

    try {
      for (const id of selectedPagos) {
        const venta = ventasCliente.find((v) => v.id === id);
        if (venta) {
          await procesarPago({
            venta_id: id,
            monto: Number(venta.total),
            metodo_pago: "Efectivo",
            observaciones: "Abono a cuenta por cobrar",
          });
        }
      }
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl bg-background rounded-2xl md:rounded-4xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh] border"
          >
            <div className="flex items-center justify-between p-4 md:p-6 border-b bg-muted/30 shrink-0">
              <div className="flex items-center gap-4">
                <div className="bg-red-500/10 p-3 rounded-xl text-red-500">
                  <CreditCard className="size-6 md:size-8" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-foreground uppercase tracking-tight">
                    Detalle de Cuenta
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground font-bold uppercase tracking-widest">
                    {cliente.nombre} | NIT: {cliente.nit}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer"
                disabled={isProcessing}
              >
                <X className="size-6 text-muted-foreground hover:text-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-muted/5">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold uppercase tracking-widest text-sm text-muted-foreground">
                  Documentos Pendientes
                </h3>
                <button
                  onClick={seleccionarTodos}
                  className="text-xs font-bold text-red-500 hover:text-red-400 uppercase transition-colors cursor-pointer"
                >
                  {selectedPagos.length === ventasCliente.length
                    ? "Desmarcar Todos"
                    : "Seleccionar Todos"}
                </button>
              </div>

              <div className="space-y-4">
                {ventasCliente.map((venta) => {
                  const isSelected = selectedPagos.includes(venta.id);
                  return (
                    <div
                      key={venta.id}
                      className={cn(
                        "relative overflow-hidden rounded-2xl border-2 transition-all",
                        isSelected
                          ? "border-red-500 ring-4 ring-red-500/10"
                          : "border-border/60 hover:border-red-500/40",
                      )}
                    >
                      <div
                        onClick={() => togglePago(venta.id)}
                        className="p-4 bg-card cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "size-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                              isSelected
                                ? "border-red-500 bg-red-500 text-white"
                                : "border-muted-foreground/30 bg-background",
                            )}
                          >
                            {isSelected && <CheckCircle2 className="size-4" />}
                          </div>
                          <div>
                            <p className="font-bold text-base md:text-lg flex items-center gap-2 text-foreground">
                              <Receipt className="size-4 md:size-5 text-muted-foreground" />
                              Venta #
                              {venta.numero_recibo
                                ? String(venta.numero_recibo).padStart(5, "0")
                                : venta.id.slice(0, 6).toUpperCase()}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1 font-medium">
                              <Calendar className="size-3" />
                              {venta.created_at
                                ? new Date(venta.created_at).toLocaleDateString(
                                    "es-GT",
                                  )
                                : venta.fecha_entrega
                                  ? new Date(
                                      venta.fecha_entrega,
                                    ).toLocaleDateString("es-GT")
                                  : "Sin fecha"}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-10 sm:pl-0">
                          <p className="font-black text-xl text-foreground">
                            Q
                            {Number(venta.total).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                      </div>

                      {venta.ven_detalle && venta.ven_detalle.length > 0 && (
                        <div className="bg-muted/30 border-t p-4 flex flex-col gap-3">
                          {venta.ven_detalle.map((item) => (
                            <div
                              key={item.id}
                              className="flex justify-between items-center text-sm"
                            >
                              <div className="flex gap-3 items-start">
                                <span className="font-mono bg-background px-2 py-0.5 rounded-md text-xs font-bold border text-muted-foreground shrink-0">
                                  {item.cantidad}
                                </span>
                                <div>
                                  <p className="font-semibold text-foreground leading-none">
                                    {item.inv_productos?.nombre || "Producto"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground mt-1 font-medium">
                                    Q
                                    {Number(item.precio_aplicado || 0).toFixed(
                                      2,
                                    )}{" "}
                                    c/u
                                  </p>
                                </div>
                              </div>
                              <span className="font-bold text-foreground">
                                Q{Number(item.subtotal || 0).toFixed(2)}
                              </span>
                            </div>
                          ))}

                          {(venta.placa_camion || venta.descripcion_camion) && (
                            <div className="mt-2 pt-3 border-t border-dashed border-border/60 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                              <Truck className="size-3.5" />
                              <span>
                                {venta.placa_camion}{" "}
                                {venta.descripcion_camion
                                  ? `- ${venta.descripcion_camion}`
                                  : ""}
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-4 md:p-6 border-t bg-card shrink-0 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">
                  Total a Pagar
                </p>
                <p className="text-3xl font-black text-foreground tracking-tighter">
                  Q
                  {totalSeleccionado.toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </p>
              </div>
              <div className="flex w-full sm:w-auto gap-3">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl border font-bold hover:bg-muted transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePagarSeleccionados}
                  disabled={selectedPagos.length === 0 || isProcessing}
                  className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="size-5 animate-spin" />
                      Procesando
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-5" />
                      Pagar Seleccionados
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
