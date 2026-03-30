import {
  Calendar,
  Edit,
  ChevronLeft,
  ChevronRight,
  Search,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import Swal from "sweetalert2";
import StatsModal from "../modals/stats-modal";
import { TrendingUp, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const getGuatemalaDateParts = (dateInput?: string | Date) => {
  if (!dateInput || dateInput === "Sin Fecha")
    return getGuatemalaDateParts(new Date());

  let date = new Date(dateInput);
  if (typeof dateInput === "string" && dateInput.length === 10) {
    date = new Date(`${dateInput}T12:00:00`);
  }

  if (isNaN(date.getTime())) return getGuatemalaDateParts(new Date());

  const guatemalaTime = new Date(
    date.toLocaleString("en-US", { timeZone: "America/Guatemala" }),
  );
  const year = guatemalaTime.getFullYear();
  const month = guatemalaTime.getMonth() + 1;
  const day = guatemalaTime.getDate();

  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const week = Math.ceil((day + firstDayIso) / 7);

  return { year, month, week };
};

const getOrderDateString = (order: any) => {
  if (order.fecha_entrega) return String(order.fecha_entrega).substring(0, 10);
  if (order.created_at) return String(order.created_at).substring(0, 10);
  return "Sin Fecha";
};

const getWeeksLabels = (year: number, month: number) => {
  const labels = [];
  const lastDay = new Date(year, month, 0).getDate();
  const firstDayJS = new Date(year, month - 1, 1).getDay();
  const firstDayIso = firstDayJS === 0 ? 6 : firstDayJS - 1;
  const daysStr = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

  let startDay = 1;
  while (startDay <= lastDay) {
    const weekNum = Math.ceil((startDay + firstDayIso) / 7);
    let endDay = startDay;
    while ((endDay + firstDayIso) % 7 !== 0 && endDay < lastDay) {
      endDay++;
    }
    const startJS = new Date(year, month - 1, startDay).getDay();
    const endJS = new Date(year, month - 1, endDay).getDay();
    labels.push({
      week: weekNum,
      label: `${daysStr[startJS === 0 ? 6 : startJS - 1]} ${startDay} - ${daysStr[endJS === 0 ? 6 : endJS - 1]} ${endDay}`,
    });
    startDay = endDay + 1;
  }
  return labels;
};

export default function ListView({
  items,
  orders,
  isLoading,
  formatDate,
  onStatusClick,
  onPrintClick,
  onEditClick,
}: any) {
  const data = useMemo(() => orders || items || [], [orders, items]);
  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroAnio, setFiltroAnio] = useState<number>(current.year);
  const [filtroMes, setFiltroMes] = useState<number>(current.month);
  const [filtroSemana, setFiltroSemana] = useState<number | "Todas">("Todas");
  const [searchTerm, setSearchTerm] = useState("");

  const [isStatsAccordionOpen, setIsStatsAccordionOpen] = useState(false);
  const [selectedStatsSeller, setSelectedStatsSeller] = useState<{id: string, name: string} | null>(null);

  const sellerStats = useMemo(() => {
    const stats: Record<string, { total: number; count: number; id: string }> = {};
    
    data.filter((v: any) => {
        const orderDate = getGuatemalaDateParts(getOrderDateString(v));
        return orderDate.year === filtroAnio && 
               orderDate.month === filtroMes && 
               v.estado?.toLowerCase() !== "anulado";
    }).forEach((order: any) => {
      const name = order.vendedor?.nombre || "Vendedor Gral";
      const sellerId = order.usuario_id || "unknown";
      if (!stats[name]) stats[name] = { total: 0, count: 0, id: sellerId };
      stats[name].total += order.total || 0;
      stats[name].count += 1;
    });

    return Object.entries(stats).sort((a, b) => b[1].total - a[1].total);
  }, [data, filtroAnio, filtroMes]);

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const semanasDelMes = useMemo(
    () => getWeeksLabels(filtroAnio, filtroMes),
    [filtroAnio, filtroMes],
  );

  const filteredItems = useMemo(() => {
    return data.filter((order: any) => {
      const estadoActual = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();
      const matchEstado =
        filtroEstado === "" || estadoActual === filtroEstado.toLowerCase();

      const orderDate = getGuatemalaDateParts(getOrderDateString(order));
      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      const matchFecha = matchAnio && matchMes && matchSemana;

      let matchSearch = true;
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const clienteNombre = (order.ven_clientes?.nombre || "").toLowerCase();
        const clienteNit = (order.ven_clientes?.nit || "").toLowerCase();
        const numRecibo = String(order.numero_recibo || "").toLowerCase();
        const shortId = String(order.id || "").substring(0, 6).toLowerCase();

        matchSearch =
          clienteNombre.includes(term) ||
          clienteNit.includes(term) ||
          numRecibo.includes(term) ||
          shortId.includes(term);
      }

      return (
        matchEstado &&
        matchSearch &&
        (estadoActual === "pendiente" || matchFecha)
      );
    });
  }, [data, filtroEstado, filtroAnio, filtroMes, filtroSemana, searchTerm]);

  const counts = useMemo(() => {
    const c = { Pendiente: 0, Entregado: 0, Anulado: 0 };
    data.forEach((order: any) => {
      const estado = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();
      const orderDate = getGuatemalaDateParts(getOrderDateString(order));
      const matchFecha =
        orderDate.year === filtroAnio &&
        orderDate.month === filtroMes &&
        (filtroSemana === "Todas" || orderDate.week === filtroSemana);

      if (estado === "pendiente" || matchFecha) {
        if (estado === "pendiente") c.Pendiente++;
        else if (estado === "entregado") c.Entregado++;
        else if (estado === "anulado") c.Anulado++;
      }
    });
    return c;
  }, [data, filtroAnio, filtroMes, filtroSemana]);

  useEffect(() => {
    if (
      filtroEstado !== "" &&
      counts[filtroEstado as keyof typeof counts] === 0
    ) {
      setFiltroEstado("");
    }
  }, [counts, filtroEstado]);

  useEffect(() => {
    setCurrentPage(1);
  }, [
    filtroEstado,
    filtroAnio,
    filtroMes,
    filtroSemana,
    itemsPerPage,
    searchTerm,
  ]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage) || 1;
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const groupedOrders = useMemo(() => {
    const groups: Record<string, any[]> = {};
    paginatedItems.forEach((order: any) => {
      const date = getOrderDateString(order);
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });

    return Object.keys(groups)
      .sort((a, b) => {
        if (a === "Sin Fecha") return 1;
        if (b === "Sin Fecha") return -1;
        return new Date(b).getTime() - new Date(a).getTime();
      })
      .map((date) => ({
        date,
        orders: groups[date],
      }));
  }, [paginatedItems]);

  if (isLoading)
    return (
      <div className="p-8 text-center border rounded-xl bg-card italic">
        Cargando...
      </div>
    );

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in duration-300">
      <aside className="w-full lg:w-[20%] shrink-0 flex flex-col gap-8 sticky lg:top-6 text-xs">
        <div className="flex flex-col gap-2">
          <h3 className="font-bold text-muted-foreground uppercase text-xs">
            Buscar
          </h3>

          {data.length > 0 && (
            <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full focus-within:ring-2 focus-within:ring-orange-500/20 transition-all h-10">
              <Search className="size-4 text-muted-foreground shrink-0" />
              <input
                type="text"
                placeholder="Cliente, recibo o NIT"
                className="bg-transparent outline-none text-xs w-full font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-muted-foreground uppercase text-xs">
            Fecha de entrega
          </h3>
          <div className="flex gap-2">
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(Number(e.target.value))}
              className="w-1/2 p-3 border rounded-xl bg-background font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[2025, 2026, 2027].map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              value={filtroMes}
              onChange={(e) => {
                setFiltroMes(Number(e.target.value));
                setFiltroSemana("Todas");
              }}
              className="w-1/2 p-3 border rounded-xl bg-background font-bold capitalize outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("es-GT", {
                    month: "long",
                  })}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filtroSemana}
            onChange={(e) =>
              setFiltroSemana(
                e.target.value === "Todas" ? "Todas" : Number(e.target.value),
              )
            }
            className="w-full p-3 border rounded-xl bg-background font-bold outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="Todas">Todas las semanas</option>
            {semanasDelMes.map((s) => (
              <option key={s.week} value={s.week}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-muted-foreground uppercase text-xs">
            Filtrar por estado
          </h3>
          <div className="grid grid-cols-2 md:flex md:flex-col gap-3">
            {[
              { v: "Pendiente", c: "amber" },
              { v: "Entregado", c: "green" },
              { v: "Anulado", c: "red" },
            ]
              .filter((item) => counts[item.v as keyof typeof counts] > 0)
              .map((item) => (
                <button
                  key={item.v}
                  onClick={() =>
                    setFiltroEstado(filtroEstado === item.v ? "" : item.v)
                  }
                  className={`flex items-center justify-center p-3 border-[3px] rounded-xl cursor-pointer transition-all bg-${item.c}-500/10 text-${item.c}-600 ${
                    filtroEstado === item.v
                      ? `border-${item.c}-500`
                      : "border-transparent hover:opacity-70"
                  }`}
                >
                  <span className="font-bold text-xs truncate">
                    {item.v} ({counts[item.v as keyof typeof counts]})
                  </span>
                </button>
              ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button 
            onClick={() => setIsStatsAccordionOpen(!isStatsAccordionOpen)}
            className="flex items-center justify-between w-full group cursor-pointer mb-1 transition-all"
          >
            <h3 className="font-bold text-orange-600 uppercase text-[10px] tracking-tight group-hover:text-orange-700 transition-colors">
                Ventas del Mes por Vendedor
            </h3>
            <ChevronDown className={`size-3 text-orange-500 transition-transform duration-300 ${isStatsAccordionOpen ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {isStatsAccordionOpen && (
                <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                >
                    <div className="flex flex-col gap-2 pt-1">
                        {sellerStats.length === 0 ? (
                        <p className="text-[10px] italic text-muted-foreground">Sin ventas este mes</p>
                        ) : (
                            sellerStats.map(([name, stat]) => (
                            <button 
                                key={stat.id}
                                onClick={() => setSelectedStatsSeller({ id: stat.id, name })}
                                className="p-3 bg-card border rounded-xl flex flex-col gap-1 group relative overflow-hidden cursor-pointer hover:bg-orange-500/5 hover:border-orange-500/30 transition-all active:scale-95 text-left w-full"
                            >
                                <div className="flex justify-between items-start">
                                    <span className="font-bold text-[10px] line-clamp-1 grow pr-2">{name}</span>
                                    <TrendingUp className="size-3 text-orange-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                                <div className="flex justify-between items-baseline mt-1">
                                    <span className="font-black text-xs text-orange-600">Q{stat.total.toLocaleString()}</span>
                                    <span className="text-[9px] font-bold text-muted-foreground">({stat.count})</span>
                                </div>
                                <div className="absolute left-0 bottom-0 h-0.5 bg-orange-500/20 group-hover:bg-orange-500 transition-all w-full" />
                            </button>
                        ))
                        )}
                    </div>
                </motion.div>
            )}
          </AnimatePresence>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col gap-3">
        {groupedOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card font-bold uppercase">
            Sin pedidos registrados
          </div>
        ) : (
          groupedOrders.map((group) => {
            const rawDate =
              group.date !== "Sin Fecha"
                ? new Date(`${group.date}T12:00:00`).toLocaleDateString(
                    "es-GT",
                    { weekday: "long", day: "2-digit", month: "long" },
                  )
                : "Sin Fecha de Entrega";
            const formattedDate =
              group.date !== "Sin Fecha"
                ? rawDate.charAt(0).toUpperCase() +
                  rawDate.slice(1).replace(".", "")
                : rawDate;

            return (
              <div key={group.date} className="flex flex-col gap-4 mb-2">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                    <Calendar className="size-4" />
                    <span className="font-black uppercase text-sm tracking-wider">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="h-0.5 grow bg-border/50"></div>
                </div>

                <div className="flex flex-col gap-3">
                  {group.orders.map((venta: any) => {
                    const estadoNormal = String(venta.estado || "Pendiente")
                      .trim()
                      .toLowerCase();
                    const tieneFacturaCertificada = venta.dte_documentos?.some(
                      (d: any) => d.estado === "certificado"
                    );
                    const isEntregada = estadoNormal === "entregado";
                    const isAnulada = estadoNormal === "anulado";

                    let borderColor = "border-border";
                    if (isAnulada) {
                      borderColor = "border-red-400/50 ring-1 ring-red-400/5";
                    } else if (isEntregada) {
                      if (tieneFacturaCertificada) {
                        borderColor = "border-sky-400/50 ring-1 ring-sky-400/10";
                      } else {
                        borderColor = "border-emerald-400/50 ring-1 ring-emerald-400/10";
                      }
                    }

                    return (
                      <div
                        key={venta.id}
                        className={`bg-card border rounded-xl flex flex-col md:flex-row overflow-hidden relative shadow-sm transition-all ${borderColor}`}
                      >
                        <div
                          onClick={() => {
                            if (tieneFacturaCertificada) {
                              Swal.fire({
                                title: "⚠️ Venta Bloqueada",
                                text: "Esta venta ya tiene una factura electrónica generada. Para poder modificarla, primero debe anular la factura correspondiente.",
                                icon: "info",
                                confirmButtonColor: "#10b981",
                              });
                              return;
                            }
                            onEditClick(venta);
                          }}
                          className={`grow flex flex-col md:flex-row transition-all p-4 rounded-t-xl md:rounded-l-xl md:rounded-tr-none cursor-pointer ${
                            tieneFacturaCertificada
                              ? "opacity-90"
                              : "hover:ring-inset hover:ring-2 hover:ring-primary/40"
                          }`}
                        >
                          <div className="flex pr-5 flex-col gap-1 w-full md:w-112.5 shrink-0">
                            <span className="font-mono font-bold text-blue-500 text-sm">
                              Venta #{venta.id ? `${venta.id.substring(0, 3).toUpperCase()}-${venta.id.substring(3, 6).toUpperCase()}` : '---'}
                              <span className="px-2 ml-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-muted text-muted-foreground">
                                {venta.tipo_venta}
                              </span>
                              {tieneFacturaCertificada && (
                                <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                                  DTE ✓
                                </span>
                              )}
                            </span>

                            <h3 className="font-bold text-foreground text-base uppercase mt-1">
                              {venta.ven_clientes?.nombre}
                            </h3>

                            {venta.ven_detalle &&
                              venta.ven_detalle.length > 0 && (
                                <div className="flex flex-col gap-1 my-2 py-2 border-y border-border/50">
                                  {venta.ven_detalle.map((det: any) => (
                                    <div
                                      key={det.id}
                                      className="flex justify-between items-center text-xs text-muted-foreground"
                                    >
                                      <span className="truncate pr-2">
                                        {det.cantidad}{" "}
                                        {det.inv_productos?.medida || ""}
                                        {" de "}
                                        {det.inv_productos?.nombre ||
                                          "Producto"}
                                      </span>
                                      <span className="font-mono font-bold">
                                        Q{Number(det.subtotal || 0).toFixed(2)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              )}

                            <div className="flex items-center gap-3 mt-1">
                              <div className="flex items-baseline gap-1">
                                <span className="text-[10px] uppercase font-bold text-muted-foreground">
                                  Total:
                                </span>
                                <span className="font-mono font-bold text-lg text-foreground leading-none">
                                  Q{venta.total?.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col flex-1 justify-between md:pl-4 md:border-l border-border/50 min-h-25 mt-4 md:mt-0">
                            <div className="flex flex-col gap-1">
                              {venta.observaciones && (
                                <div className="flex flex-col">
                                  <span className="text-sm uppercase font-bold text-blue-600">
                                    Observaciones:
                                  </span>
                                  <span className="text-sm italic text-foreground/90">
                                    {venta.observaciones}
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-baseline gap-1.5 border-t border-border/30 pt-2">
                              <span className="text-[10px] uppercase font-bold text-blue-600 shrink-0">
                                Vendedor:
                              </span>
                              <span className="text-xs italic text-muted-foreground">
                                {venta.vendedor?.nombre || "-"}, a las {venta.created_at ? new Date(venta.created_at).toLocaleTimeString("es-GT", { timeZone: "America/Guatemala", hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--"} hrs
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-row items-stretch justify-end border-t md:border-t-0 md:border-l border-border bg-card">
                          {estadoNormal === "entregado" && (
                            <button
                              id={`print-btn-${venta.id}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onPrintClick(venta.id);
                              }}
                              className="w-1/2 md:w-20 shrink-0 py-5 md:py-0 flex items-center justify-center transition-all bg-transparent border-r border-border/50 hover:ring-inset hover:ring-2 hover:ring-blue-500/40 cursor-pointer"
                            >
                              <div className="flex items-center justify-center text-blue-600 dark:text-blue-500">
                                <AnimatedIcon
                                  iconKey="qjtwiolr"
                                  target={`#print-btn-${venta.id}`}
                                  className="w-8 h-8 md:w-10 md:h-10"
                                />
                              </div>
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (estadoNormal === "pendiente")
                                onStatusClick(venta);
                            }}
                            disabled={estadoNormal !== "pendiente"}
                            className={`${
                              estadoNormal === "entregado" ? "w-1/2" : "w-full"
                            } md:w-40 shrink-0 py-5 md:py-0 flex items-center justify-center gap-1.5 text-xs uppercase font-bold transition-all ${
                              estadoNormal === "pendiente"
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 cursor-pointer"
                                : estadoNormal === "entregado"
                                  ? "bg-green-500/10 text-green-600 opacity-90 cursor-default"
                                  : "bg-red-500/10 text-red-600 opacity-80 cursor-default"
                            }`}
                          >
                            {venta.estado || "Pendiente"}{" "}
                            <Edit className="size-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}

        {filteredItems.length > 0 && (
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-4">
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-background border rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer h-9"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={100}>Todos</option>
              </select>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                {currentPage} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 md:p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-1.5 md:p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <StatsModal 
        isOpen={!!selectedStatsSeller}
        onClose={() => setSelectedStatsSeller(null)}
        sellerId={selectedStatsSeller?.id || null}
        sellerName={selectedStatsSeller?.name || null}
        allVentas={data}
      />
    </div>
  );
}
