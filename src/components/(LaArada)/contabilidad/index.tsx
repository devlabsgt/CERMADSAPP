"use client";

import { useState, useMemo } from "react";
import {
  Download,
  Search,
  FileSpreadsheet,
  Ban,
  Calculator,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useVentas } from "@/components/(LaArada)/ventas/lib/hooks";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

function getFileName(ext: string) {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const year = now.getFullYear();
  return `laarada-${month}-${year}.${ext}`;
}

export default function ContabilidadView() {
  const { data: ventas = [], isLoading } = useVentas();

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const orders = useMemo(() => {
    return [...ventas].sort(
      (a: any, b: any) =>
        new Date(b.fecha_entrega || 0).getTime() -
        new Date(a.fecha_entrega || 0).getTime(),
    );
  }, [ventas]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order: any) => {
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
    });
  }, [orders, startDate, endDate, searchTerm]);

  const stats = useMemo(() => {
    let totalEntregado = 0;
    let countAnulados = 0;
    let totalAnulados = 0;

    filteredOrders.forEach((o: any) => {
      const total = Number(o.total || 0);
      const estado = String(o.estado || "Pendiente").trim().toLowerCase();
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

  // ─── Helpers ────────────────────────────────────────────────────────────────
  const buildRows = () =>
    filteredOrders.map((o: any) => {
      const date = new Date(o.fecha_entrega || o.created_at).toLocaleDateString("es-GT");
      const tipoComprobante = o.tipo_comprobante || "Recibo";
      const nit = ["NIT", "C/F"].includes(tipoComprobante)
        ? o.ven_clientes?.nit || "C/F"
        : "---";
      return {
        Fecha: date,
        "Tipo Doc": tipoComprobante,
        NIT: nit,
        Cliente: o.ven_clientes?.nombre || "",
        "No. Recibo": String(o.numero_recibo || 0).padStart(5, "0"),
        Tipo: o.tipo_venta || "Contado",
        Estado: o.estado || "Pendiente",
        "Total (Q)": Number(o.total || 0).toFixed(2),
      };
    });

  // ─── CSV ────────────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = ["Fecha", "Tipo Doc", "NIT", "Cliente", "No. Recibo", "Tipo", "Estado", "Total (Q)"];
    const rows = buildRows().map((r) => headers.map((h) => `"${r[h as keyof typeof r]}"`).join(","));
    const csvContent = [headers.join(","), ...rows].join("\n");
    const dataUri = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const a = document.createElement("a");
    a.href = dataUri;
    a.download = getFileName("csv");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── Excel ───────────────────────────────────────────────────────────────────
  const exportExcel = () => {
    const rows = buildRows();
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Contabilidad");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = getFileName("xlsx");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  // ─── PDF ─────────────────────────────────────────────────────────────────────
  const exportPDF = () => {
    const doc = new jsPDF({ orientation: "landscape" });
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`La Arada \u2013 Reporte Contable ${month}/${year}`, 14, 15);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Total Facturado: Q${stats.totalEntregado.toFixed(2)}   Base Imponible: Q${stats.baseImponible.toFixed(2)}   IVA (12%): Q${stats.iva.toFixed(2)}   Anulados: Q${stats.totalAnulados.toFixed(2)}`,
      14, 22,
    );

    autoTable(doc, {
      startY: 28,
      head: [["Fecha", "No. Doc", "Tipo Doc", "NIT", "Cliente", "Tipo", "Estado", "Total (Q)"]],
      body: filteredOrders.map((o: any) => {
        const tipo = o.tipo_comprobante || "Recibo";
        return [
          new Date(o.fecha_entrega || o.created_at).toLocaleDateString("es-GT"),
          `#${String(o.numero_recibo || 0).padStart(5, "0")}`,
          tipo,
          ["NIT", "C/F"].includes(tipo) ? o.ven_clientes?.nit || "C/F" : "---",
          o.ven_clientes?.nombre || "",
          o.tipo_venta || "Contado",
          o.estado || "Pendiente",
          `Q${Number(o.total || 0).toFixed(2)}`,
        ];
      }),
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [16, 185, 129], fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    const pdfBlob = doc.output("blob");
    const pdfUrl = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = getFileName("pdf");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center text-muted-foreground font-bold uppercase text-xs animate-pulse">
        Cargando datos contables...
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 w-full mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Calculator className="size-5 md:size-6 text-emerald-500" />
          Módulo Contable
        </h1>
        <p className="text-muted-foreground text-xs md:text-sm">
          Exportación y cálculo de impuestos (IVA/ISR).
        </p>
      </div>

      {/* Filters + Export Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Desde</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Hasta</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full h-10 px-3 border rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">Buscar Cliente / NIT</label>
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

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <button
            onClick={exportCSV}
            disabled={filteredOrders.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 bg-zinc-600 text-white rounded-lg hover:bg-zinc-700 font-bold text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            <Download className="size-4" /> CSV
          </button>
          <button
            onClick={exportExcel}
            disabled={filteredOrders.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            <FileSpreadsheet className="size-4" /> EXCEL
          </button>
          <button
            onClick={exportPDF}
            disabled={filteredOrders.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 h-10 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold text-sm transition-colors disabled:opacity-50 w-full sm:w-auto"
          >
            <FileText className="size-4" /> PDF
          </button>
        </div>
      </div>

      {/* Stats Cards */}
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

      {/* Table */}
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
                  <td colSpan={7} className="p-8 text-center text-muted-foreground font-bold uppercase text-xs">
                    No se encontraron registros
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      {new Date(order.fecha_entrega || order.created_at).toLocaleDateString("es-GT")}
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
                    <td className="p-4 font-bold truncate max-w-50">{order.ven_clientes?.nombre}</td>
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
