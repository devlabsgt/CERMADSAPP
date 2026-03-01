"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  LayoutGrid,
  List,
  Truck,
  ShieldAlert,
  BarChart3,
} from "lucide-react";
import { useVentas } from "./lib/hooks";
import SaleModal from "./modals/sale-modal";
import ReceiptModal from "./modals/receipt-modal";
import StatusModal from "./modals/status-modal";
import ListView from "./components/ventas-view";
import MonitorView from "./components/monitor-view";
import Stats from "./components/stats";
import ContabilidadView from "./components/contabilidad-view";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { Calculator } from "lucide-react";

export default function ListadoVentas() {
  const { data: ventas = [], isLoading } = useVentas();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
  }, [realRole]);

  const allowedRoles = ["ventas", "rrhh", "admin", "super"];
  const canManage = allowedRoles.includes(effectiveRole);

  const [viewMode, setViewMode] = useState<
    "ventas" | "monitor" | "estadisticas" | "contabilidad"
  >("ventas");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [statusVenta, setStatusVenta] = useState<any>(null);
  const [ventaToEdit, setVentaToEdit] = useState<any>(null);

  useEffect(() => {
    if (user && !canManage) {
      setViewMode("monitor");
    }
  }, [user, canManage, effectiveRole]);

  const filteredSearchVentas = ventas.filter((v: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (v.ven_clientes?.nombre || "").toLowerCase().includes(term) ||
      String(v.numero_recibo || "").includes(term)
    );
  });

  const sortedOrders = [...filteredSearchVentas].sort(
    (a: any, b: any) =>
      new Date(b.fecha_entrega || 0).getTime() -
      new Date(a.fecha_entrega || 0).getTime(),
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return "S/F";
    const adjustedString = dateString.includes("T")
      ? dateString
      : `${dateString}T12:00:00`;
    return new Date(adjustedString).toLocaleDateString("es-GT", {
      timeZone: "America/Guatemala",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="p-4 md:p-6 w-full mx-auto space-y-6">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            {viewMode === "ventas" ? (
              <ShoppingCart className="size-5 md:size-6 text-orange-500" />
            ) : viewMode === "monitor" ? (
              <Truck className="size-5 md:size-6 text-blue-500" />
            ) : viewMode === "estadisticas" ? (
              <BarChart3 className="size-5 md:size-6 text-purple-500" />
            ) : (
              <Calculator className="size-5 md:size-6 text-emerald-500" />
            )}
            {viewMode === "ventas"
              ? "Control de Ventas"
              : viewMode === "monitor"
                ? "Monitor de Despacho"
                : viewMode === "estadisticas"
                  ? "Estadísticas de Ventas"
                  : "Módulo Contable"}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2">
            {viewMode === "ventas"
              ? "Gestión de ventas y despachos."
              : viewMode === "monitor"
                ? "Despachos pendientes de entrega en tiempo real."
                : viewMode === "estadisticas"
                  ? "Resumen general de ventas por día y mes."
                  : "Exportación y cálculo de impuestos (IVA/ISR)."}
            {realRole === "super" && effectiveRole !== "super" && (
              <span className="text-[10px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 whitespace-nowrap">
                (Simulando: {effectiveRole})
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
          {realRole === "super" && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 backdrop-blur-md px-3 py-1.5 rounded-lg shadow-sm h-10 w-full sm:w-auto justify-center">
              <ShieldAlert className="size-4 text-yellow-600 shrink-0" />
              <span className="text-[10px] font-bold text-yellow-600 uppercase hidden sm:inline whitespace-nowrap">
                Modo Super:
              </span>
              <select
                value={effectiveRole}
                onChange={(e) => setEffectiveRole(e.target.value)}
                className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="super">SUPER (Real)</option>
                <option value="admin">Admin</option>
                <option value="ventas">Ventas</option>
                <option value="rrhh">RRHH</option>
                <option value="user">User (Sin permisos)</option>
              </select>
            </div>
          )}

          {canManage && (
            <>
              <div className="flex bg-muted rounded-lg p-1 border h-10 w-full sm:w-auto overflow-x-auto hide-scrollbar">
                <button
                  onClick={() => setViewMode("monitor")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "monitor"
                      ? "bg-background shadow-sm text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="size-4" /> Despacho
                </button>
                <button
                  onClick={() => setViewMode("ventas")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "ventas"
                      ? "bg-background shadow-sm text-orange-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="size-4" /> Ventas
                </button>
                <button
                  onClick={() => setViewMode("estadisticas")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "estadisticas"
                      ? "bg-background shadow-sm text-purple-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BarChart3 className="size-4" /> Estadísticas
                </button>
                <button
                  onClick={() => setViewMode("contabilidad")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    viewMode === "contabilidad"
                      ? "bg-background shadow-sm text-emerald-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Calculator className="size-4" /> Contabilidad
                </button>
              </div>

              <button
                onClick={() => {
                  setVentaToEdit(null);
                  setIsSaleModalOpen(true);
                }}
                className="flex items-center justify-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-600 transition-all cursor-pointer active:scale-95 text-xs md:text-sm h-10 w-full sm:w-auto"
              >
                <Plus className="size-4" />
                NUEVO
              </button>
            </>
          )}
        </div>
      </div>

      {viewMode === "ventas" && canManage && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full sm:w-64 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all h-9.5">
            <Search className="size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar despacho o recibo..."
              className="bg-transparent outline-none text-xs md:text-sm w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <ListView
            items={sortedOrders}
            isLoading={isLoading}
            formatDate={formatDate}
            onStatusClick={setStatusVenta}
            onPrintClick={setSelectedVentaId}
            onEditClick={(venta: any) => {
              setVentaToEdit(venta);
              setIsSaleModalOpen(true);
            }}
          />
        </div>
      )}

      {viewMode === "monitor" && (
        <MonitorView
          orders={sortedOrders}
          formatDate={formatDate}
          onStatusClick={setStatusVenta}
        />
      )}

      {viewMode === "estadisticas" && canManage && (
        <Stats orders={sortedOrders} />
      )}

      {viewMode === "contabilidad" && canManage && (
        <ContabilidadView orders={sortedOrders} />
      )}
      {canManage && (
        <SaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          ventaToEdit={ventaToEdit}
          effectiveRole={effectiveRole}
        />
      )}

      <ReceiptModal
        isOpen={!!selectedVentaId}
        onClose={() => setSelectedVentaId(null)}
        ventaId={selectedVentaId}
      />

      <StatusModal
        isOpen={!!statusVenta}
        onClose={() => setStatusVenta(null)}
        venta={statusVenta}
      />
    </div>
  );
}
