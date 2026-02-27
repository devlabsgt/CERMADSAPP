import { Calendar, Edit, Lock } from "lucide-react";
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

    const startStr = daysStr[startJS === 0 ? 6 : startJS - 1];
    const endStr = daysStr[endJS === 0 ? 6 : endJS - 1];

    labels.push({
      week: weekNum,
      label: `${startStr} ${startDay} - ${endStr} ${endDay}`,
    });

    startDay = endDay + 1;
  }
  return labels;
};

export default function MonitorView({ items, orders, onStatusClick }: any) {
  const data = items || orders || [];
  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroEstado, setFiltroEstado] = useState("Pendiente");
  const [filtroAnio, setFiltroAnio] = useState<number>(current.year);
  const [filtroMes, setFiltroMes] = useState<number>(current.month);
  const [filtroSemana, setFiltroSemana] = useState<number | "Todas">(
    current.week,
  );

  const semanasDelMes = useMemo(
    () => getWeeksLabels(filtroAnio, filtroMes),
    [filtroAnio, filtroMes],
  );

  const counts = useMemo(() => {
    const c = { Pendiente: 0, Entregado: 0 };
    data.forEach((order: any) => {
      const estado = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();
      if (estado === "anulado") return;

      const orderDate = getGuatemalaDateParts(getOrderDateString(order));
      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      if (matchAnio && matchMes && matchSemana) {
        if (estado === "pendiente") c.Pendiente++;
        else if (estado === "entregado") c.Entregado++;
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

  const groupedOrders = useMemo(() => {
    const priority: Record<string, number> = { pendiente: 1, entregado: 2 };

    const filtered = data.filter((order: any) => {
      const estado = String(order.estado || "Pendiente")
        .trim()
        .toLowerCase();
      if (estado === "anulado") return false;

      const matchEstado =
        filtroEstado === "" || estado === filtroEstado.trim().toLowerCase();
      const orderDate = getGuatemalaDateParts(getOrderDateString(order));

      return (
        matchEstado &&
        orderDate.year === filtroAnio &&
        orderDate.month === filtroMes &&
        (filtroSemana === "Todas" || orderDate.week === filtroSemana)
      );
    });

    const groups: Record<string, any[]> = {};
    filtered.forEach((order: any) => {
      const date = getOrderDateString(order);
      if (!groups[date]) groups[date] = [];
      groups[date].push(order);
    });

    Object.keys(groups).forEach((date) => {
      groups[date].sort((a, b) => {
        const pA =
          priority[
            String(a.estado || "Pendiente")
              .toLowerCase()
              .trim()
          ] || 3;
        const pB =
          priority[
            String(b.estado || "Pendiente")
              .toLowerCase()
              .trim()
          ] || 3;
        return pA - pB;
      });
    });

    return Object.keys(groups)
      .sort()
      .reverse()
      .map((date) => ({
        date,
        orders: groups[date],
      }));
  }, [data, filtroEstado, filtroAnio, filtroMes, filtroSemana]);

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start animate-in fade-in duration-300">
      <aside className="w-full md:w-[15%] shrink-0 flex flex-col gap-6 sticky md:top-6 text-xs">
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-muted-foreground uppercase text-xs">
            Filtrar por fecha
          </h3>
          <div className="flex gap-2">
            <select
              value={filtroAnio}
              onChange={(e) => setFiltroAnio(Number(e.target.value))}
              className="w-1/2 p-3 border rounded-xl bg-background font-bold outline-none focus:ring-2 focus:ring-primary/20"
            >
              {[2025, 2026, 2027].map((anio) => (
                <option key={anio} value={anio}>
                  {anio}
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
            {semanasDelMes.map(({ week, label }) => (
              <option key={week} value={week}>
                {label}
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
              {
                v: "Pendiente",
                c: "amber",
              },
              {
                v: "Entregado",
                c: "green",
              },
            ]
              .filter(({ v }) => counts[v as keyof typeof counts] > 0)
              .map(({ v, c }) => (
                <button
                  key={v}
                  onClick={() => setFiltroEstado(filtroEstado === v ? "" : v)}
                  className={`flex items-center justify-center p-3 border-[3px] rounded-xl cursor-pointer transition-all bg-${c}-500/10 text-${c}-600 ${
                    filtroEstado === v
                      ? `border-${c}-500`
                      : "border-transparent hover:opacity-70"
                  }`}
                >
                  <span className="font-bold text-xs truncate">
                    {v} ({counts[v as keyof typeof counts]})
                  </span>
                </button>
              ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col gap-8">
        {groupedOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border-2 border-border rounded-xl bg-card font-bold uppercase">
            No hay pedidos para mostrar.
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
              <div key={group.date} className="flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                    <Calendar className="size-4" />
                    <span className="font-black uppercase text-sm tracking-wider">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="h-0.5 grow bg-border/50"></div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {group.orders.map((order: any) => {
                    const estadoNormalizado = String(
                      order.estado || "Pendiente",
                    )
                      .trim()
                      .toLowerCase();
                    const isPendiente = estadoNormalizado === "pendiente";

                    const bgClass = isPendiente
                      ? "bg-amber-500/10 border-amber-500/50 hover:border-amber-500 dark:bg-amber-500/5"
                      : "bg-green-500/10 border-green-500/50 hover:border-green-500 dark:bg-green-500/5";
                    const headerClass = isPendiente
                      ? "bg-amber-500/20 border-b-2 border-amber-500/30 text-amber-700 dark:text-amber-400"
                      : "bg-green-500/20 border-b-2 border-green-500/30 text-green-700 dark:text-green-400";
                    const badgeClass = isPendiente
                      ? "bg-amber-500 text-white"
                      : "bg-green-500 text-white";

                    return (
                      <div
                        key={order.id}
                        onClick={() => isPendiente && onStatusClick(order)}
                        className={`border-[3px] rounded-2xl flex flex-col overflow-hidden relative transition-all shadow-sm h-full ${bgClass} ${isPendiente ? "cursor-pointer active:scale-[0.98]" : "opacity-80 grayscale-[0.2]"}`}
                      >
                        <div
                          className={`flex items-center gap-3 p-3 md:px-5 md:py-4 ${headerClass}`}
                        >
                          <span className="font-mono font-black text-xl md:text-2xl shrink-0">
                            #{String(order.numero_recibo || 0).padStart(5, "0")}
                          </span>
                          <h3 className="font-black text-lg md:text-xl uppercase truncate grow text-foreground">
                            {order.ven_clientes?.nombre}
                          </h3>
                          <span
                            className={`px-3 py-1 text-[10px] md:text-xs font-black uppercase tracking-widest rounded-full shrink-0 ${badgeClass}`}
                          >
                            {order.estado || "Pendiente"}
                          </span>
                        </div>

                        <div className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start grow text-foreground">
                          {order.ven_detalle?.map((det: any) => (
                            <div
                              key={det.id}
                              className="bg-background/80 backdrop-blur-sm p-3 rounded-xl border border-border/50 flex items-center gap-4 shadow-sm"
                            >
                              <span className="bg-foreground text-background text-lg font-black px-3 py-1.5 rounded-lg shrink-0 text-center">
                                {`${det.cantidad} ${det.inv_productos?.medida}`}
                              </span>
                              <span className="text-xs font-bold truncate uppercase">
                                {det.inv_productos?.nombre}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.observaciones &&
                          order.observaciones.trim() !== "" && (
                            <div className="flex flex-col gap-1 p-3 md:px-5 md:py-3 border-t-2 border-border/30 bg-background/40">
                              <span className="font-bold text-[10px] uppercase tracking-wider opacity-70">
                                Observaciones
                              </span>
                              <p className="text-sm font-medium italic wrap-break-word">
                                {order.observaciones}
                              </p>
                            </div>
                          )}
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
