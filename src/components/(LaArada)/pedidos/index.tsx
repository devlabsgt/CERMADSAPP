"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List,
  Truck,
  ShieldAlert,
} from "lucide-react";
import { useVentas } from "./lib/hooks";
import SaleModal from "./modal/sale-modal";
import ReceiptModal from "./modal/receipt-modal";
import StatusModal from "./modal/status-modal";
import ListView from "./list-view";
import MonitorView from "./monitor-view";
import { useUser } from "@/components/(base)/providers/UserProvider";

export default function ListadoPedidos() {
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

  const [viewMode, setViewMode] = useState<"list" | "monitor">("monitor");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null);
  const [statusVenta, setStatusVenta] = useState<any>(null);
  const [ventaToEdit, setVentaToEdit] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
      new Date(a.fecha_entrega || 0).getTime() -
      new Date(b.fecha_entrega || 0).getTime(),
  );

  const totalItems = sortedOrders.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedOrders.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (p: number) => {
    if (p >= 1 && p <= totalPages) setCurrentPage(p);
  };

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
            {viewMode === "list" ? (
              <ShoppingCart className="size-5 md:size-6 text-orange-500" />
            ) : (
              <Truck className="size-5 md:size-6 text-blue-500" />
            )}
            {viewMode === "list" ? "Control de Pedidos" : "Monitor de Despacho"}
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm flex items-center gap-2">
            {viewMode === "list"
              ? "Gestión de ventas y despachos."
              : "Pedidos pendientes de entrega en tiempo real."}
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
              <div className="flex bg-muted rounded-lg p-1 border h-10 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode("monitor")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "monitor"
                      ? "bg-background shadow-sm text-blue-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LayoutGrid className="size-4" /> Pendientes
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                    viewMode === "list"
                      ? "bg-background shadow-sm text-orange-500"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <List className="size-4" /> Lista
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

      {viewMode === "list" && canManage ? (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full sm:w-64 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all h-9.5">
                <Search className="size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar pedido o recibo..."
                  className="bg-transparent outline-none text-xs md:text-sm w-full"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-background border rounded-lg px-2 py-2 text-xs md:text-sm outline-none cursor-pointer h-9.5 w-20 text-center"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={100}>Todos</option>
              </select>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>

          <ListView
            items={currentItems}
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
      ) : (
        <MonitorView
          orders={sortedOrders}
          formatDate={formatDate}
          onStatusClick={setStatusVenta}
        />
      )}

      {canManage && (
        <SaleModal
          isOpen={isSaleModalOpen}
          onClose={() => setIsSaleModalOpen(false)}
          ventaToEdit={ventaToEdit}
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
