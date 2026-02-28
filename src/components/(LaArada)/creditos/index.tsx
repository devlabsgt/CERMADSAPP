"use client";

import { useState, useMemo } from "react";
import { Search, CreditCard, Loader2 } from "lucide-react";
import { useCreditos } from "./lib/hooks";
import { ClienteCredito } from "./lib/zod";
import CreditosList from "./components/creditos-list";
import DetalleCreditoModal from "./modals/detalle-credito-modal";

export default function Creditos() {
  const { clientesConCredito, creditosTotales, isLoading } = useCreditos();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCliente, setSelectedCliente] = useState<ClienteCredito | null>(
    null,
  );

  const filtrados = clientesConCredito.filter(
    (c) =>
      c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.nit.includes(searchTerm),
  );

  const deudaGlobal = filtrados.reduce((sum, c) => sum + c.totalDeuda, 0);

  const ventasDelCliente = useMemo(() => {
    if (!selectedCliente) return [];
    return creditosTotales.filter(
      (v) => v.cliente_id === selectedCliente.cliente_id,
    );
  }, [selectedCliente, creditosTotales]);

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex flex-col items-center justify-center text-muted-foreground gap-4">
        <Loader2 className="size-8 animate-spin text-red-500" />
        <p className="font-bold uppercase tracking-widest text-sm">
          Cargando créditos...
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-4 md:p-6 rounded-2xl md:rounded-4xl border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 md:p-4 bg-red-500/10 text-red-500 rounded-xl md:rounded-2xl">
            <CreditCard className="size-6 md:size-8" />
          </div>
          <div>
            <h1 className="text-xl md:text-3xl font-black uppercase tracking-tight">
              Cuentas por Cobrar
            </h1>
            <p className="text-sm font-bold text-muted-foreground mt-1">
              Deuda Total:{" "}
              <span className="text-foreground">
                Q
                {deudaGlobal.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </p>
          </div>
        </div>

        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por cliente o NIT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-11 pl-11 pr-4 border rounded-xl bg-background text-sm font-medium outline-none focus:ring-2 focus:ring-red-500/20 transition-all"
          />
        </div>
      </div>

      <CreditosList clientes={filtrados} onSelectCliente={setSelectedCliente} />

      <DetalleCreditoModal
        isOpen={!!selectedCliente}
        onClose={() => setSelectedCliente(null)}
        cliente={selectedCliente}
        ventasCliente={ventasDelCliente}
      />
    </div>
  );
}
