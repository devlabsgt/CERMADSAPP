"use client";

import { useState, useMemo } from "react";
import {
  Download,
  Search,
  FileSpreadsheet,
  Ban,
  Calculator,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContabilidadView({ orders }: { orders: any[] }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const filteredOrders = useMemo(() => {
    return (orders || [])
      .filter((order) => {
        const dateStr = String(
          order.fecha_entrega || order.created_at,
        ).substring(0, 10);
        const matchStart = startDate ? dateStr >= startDate : true;
        const matchEnd = endDate ? dateStr <= endDate : true;

        const term = searchTerm.toLowerCase();
        const matchSearch =
          !term ||
          (order.ven_clientes?.nombre || "").toLowerCase().includes(term) ||
          (order.ven_clientes?.nit || "").toLowerCase().includes(term) ||
          String(order.numero_recibo || "").includes(term);

        return matchStart && matchEnd && matchSearch;
      })
      .sort((a, b) => {
        const dateA = new Date(a.fecha_entrega || a.created_at).getTime();
        const dateB = new Date(b.fecha_entrega || b.created_at).getTime();
        return dateB - dateA;
      });
  }, [orders, startDate, endDate, searchTerm]);

  const stats = useMemo(() => {
    let totalEntregado = 0;
    let countAnulados = 0;
    let totalAnulados = 0;

    filteredOrders.forEach((o) => {
      const total = Number(o.total || 0);
      const estado = String(o.estado || "Pendiente")
        .trim()
        .toLowerCase();

      if (estado === "entregado") {
        totalEntregado += total;
      } else if (estado === "anulado") {
        countAnulados++;
        totalAnulados += total;
      }
    });

    const baseImponible = totalEntregado / 1.12;
    const iva = totalEntregado - baseImponible;

    return { totalEntregado, baseImponible, iva, countAnulados, totalAnulados };
  }, [filteredOrders]);

  const exportToCSV = () => {
    const headers = [
      "Fecha",
      "Tipo Doc",
      "NIT",
      "Cliente",
      "No. Recibo",
      "Tipo",
      "Estado",
      "Total (Q)",
    ];
    const rows = filteredOrders.map((o) => {
      const date = new Date(o.fecha_entrega || o.created_at).toLocaleDateString(
        "es-GT",
      );
      const tipoComprobante = o.tipo_comprobante || "Recibo";
      const nit = ["NIT", "C/F"].includes(tipoComprobante)
        ? o.ven_clientes?.nit || "C/F"
        : "---";
      const name = `"${o.ven_clientes?.nombre || ""}"`;
      const doc = String(o.numero_recibo || 0).padStart(5, "0");
      const type = o.tipo_venta || "Contado";
      const status = o.estado || "Pendiente";
      const total = Number(o.total || 0).toFixed(2);
      return [date, tipoComprobante, nit, name, doc, type, status, total].join(
        ",",
      );
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Reporte_Contable_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Desde
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Hasta
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Buscar Cliente / NIT
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-9 pr-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        <button
          onClick={exportToCSV}
          disabled={filteredOrders.length === 0}
          className="flex items-center justify-center gap-2 px-6 py-2 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm transition-colors disabled:opacity-50 w-full md:w-auto"
        >
          <Download className="size-4" /> EXPORTAR CSV
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Facturado (Entregados)"
          value={`Q${stats.totalEntregado.toFixed(2)}`}
          icon={<FileSpreadsheet className="size-4 text-blue-500" />}
        />
        <StatCard
          label="Base Imponible"
          value={`Q${stats.baseImponible.toFixed(2)}`}
          icon={<Calculator className="size-4 text-emerald-500" />}
        />
        <StatCard
          label="IVA Débito (12%)"
          value={`Q${stats.iva.toFixed(2)}`}
          icon={<Calculator className="size-4 text-orange-500" />}
        />
        <StatCard
          label={`Anulados (${stats.countAnulados})`}
          value={`Q${stats.totalAnulados.toFixed(2)}`}
          icon={<Ban className="size-4 text-red-500" />}
          isAlert
        />
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/50 border-b">
              <tr className="text-[10px] uppercase text-muted-foreground font-black tracking-wider">
                <th className="p-4">Fecha</th>
                <th className="p-4">No. Doc</th>
                <th className="p-4">Tipo Doc</th>
                <th className="p-4">NIT</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="p-8 text-center text-muted-foreground font-bold uppercase text-xs"
                  >
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <td className="p-4">
                      {new Date(
                        order.fecha_entrega || order.created_at,
                      ).toLocaleDateString("es-GT")}
                    </td>
                    <td className="p-4 font-mono font-bold text-orange-500">
                      #{String(order.numero_recibo || 0).padStart(5, "0")}
                    </td>
                    <td className="p-4 text-[11px] font-bold text-muted-foreground uppercase">
                      {order.tipo_comprobante || "Recibo"}
                    </td>
                    <td className="p-4 font-mono">
                      {["NIT", "C/F"].includes(order.tipo_comprobante)
                        ? order.ven_clientes?.nit || "C/F"
                        : "---"}
                    </td>
                    <td className="p-4 font-bold truncate max-w-50">
                      {order.ven_clientes?.nombre}
                    </td>
                    <td className="p-4">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-black uppercase",
                          String(order.estado).toLowerCase() === "entregado"
                            ? "bg-green-500/10 text-green-600"
                            : String(order.estado).toLowerCase() === "anulado"
                              ? "bg-red-500/10 text-red-600"
                              : "bg-amber-500/10 text-amber-600",
                        )}
                      >
                        {order.estado || "Pendiente"}
                      </span>
                    </td>
                    <td className="p-4 text-right font-black">
                      Q{Number(order.total || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, isAlert }: any) {
  return (
    <div
      className={cn(
        "bg-card border p-4 rounded-xl flex flex-col gap-2 shadow-sm",
        isAlert && "border-red-500/30 bg-red-500/5",
      )}
    >
      <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
        {icon} {label}
      </div>
      <div
        className={cn(
          "text-xl md:text-2xl font-black tracking-tighter truncate",
          isAlert && "text-red-500",
        )}
      >
        {value}
      </div>
    </div>
  );
}
