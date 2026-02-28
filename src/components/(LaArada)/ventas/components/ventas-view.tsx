import {
  Calendar,
  Edit,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";

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

      return matchEstado && (estadoActual === "pendiente" || matchFecha);
    });
  }, [data, filtroEstado, filtroAnio, filtroMes, filtroSemana]);

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
  }, [filtroEstado, filtroAnio, filtroMes, filtroSemana, itemsPerPage]);

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
    <div className="flex flex-col md:flex-row gap-6 items-start animate-in fade-in duration-300">
      <aside className="w-full md:w-[15%] shrink-0 flex flex-col gap-6 sticky md:top-6 text-xs">
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
      </aside>

      <div className="flex-1 w-full flex flex-col gap-3">
        {filteredItems.length > 0 && (
          <div className="flex flex-row items-center justify-between p-3 md:p-4 bg-card border rounded-xl mt-2 gap-2 mb-4">
            <div className="flex items-center gap-2">
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="bg-background border rounded-lg px-2 py-1.5 text-xs font-bold outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={100}>Todos</option>
              </select>
              <span className="text-xs font-bold text-muted-foreground uppercase hidden md:inline">
                | Total: {filteredItems.length}
              </span>
            </div>

            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xs font-bold text-muted-foreground uppercase">
                {currentPage} / {totalPages}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronLeft className="size-4" />
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border rounded-md hover:bg-muted disabled:opacity-50 cursor-pointer transition-colors"
                >
                  <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        )}

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
                    return (
                      <div
                        key={venta.id}
                        className="bg-card border border-border rounded-xl flex flex-col md:flex-row overflow-hidden relative shadow-sm"
                      >
                        <div
                          onClick={() => onEditClick(venta)}
                          className="grow flex flex-col md:flex-row cursor-pointer hover:ring-inset hover:ring-2 hover:ring-primary/40 transition-all p-4 rounded-l-xl"
                        >
                          <div className="flex flex-col gap-2 grow">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-orange-500 text-sm">
                                #
                                {String(venta.numero_recibo || 0).padStart(
                                  5,
                                  "0",
                                )}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] uppercase font-bold bg-muted text-muted-foreground">
                                {venta.tipo_venta}
                              </span>
                            </div>
                            <h3 className="font-bold text-foreground text-base uppercase">
                              {venta.ven_clientes?.nombre}
                            </h3>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="size-3" />
                              <span>
                                {formatDate
                                  ? formatDate(venta.fecha_entrega)
                                  : venta.fecha_entrega}
                              </span>
                            </div>
                          </div>
                          <div className="flex flex-col items-start md:items-end justify-center shrink-0 mt-3 md:mt-0">
                            <span className="text-[10px] uppercase font-bold text-muted-foreground">
                              Total
                            </span>
                            <span className="font-mono font-bold text-lg text-foreground">
                              Q{venta.total?.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-stretch border-t md:border-t-0 md:border-l border-border bg-card">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (estadoNormal === "pendiente")
                                onStatusClick(venta);
                            }}
                            disabled={estadoNormal !== "pendiente"}
                            className={`w-1/2 md:w-36 shrink-0 py-3 md:py-0 md:h-full flex items-center justify-center gap-1.5 text-xs uppercase font-bold transition-all border-r md:border-r-0 border-border/50 ${
                              estadoNormal === "pendiente"
                                ? "bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 cursor-pointer"
                                : estadoNormal === "entregado"
                                  ? "bg-green-500/10 text-green-600 opacity-80 cursor-default"
                                  : "bg-red-500/10 text-red-600 opacity-80 cursor-default"
                            }`}
                          >
                            {venta.estado || "Pendiente"}{" "}
                            <Edit className="size-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (estadoNormal === "entregado")
                                onPrintClick(venta.id);
                            }}
                            disabled={estadoNormal !== "entregado"}
                            className={`w-1/2 md:w-16 shrink-0 py-3 md:py-0 md:h-full flex items-center justify-center transition-all ${estadoNormal === "entregado" ? "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                          >
                            <Printer className="size-5" />
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
      </div>
    </div>
  );
}
