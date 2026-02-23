import { Calendar, Edit, Lock } from "lucide-react";
import { useState, useMemo } from "react";

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

  const [filtroEstado, setFiltroEstado] = useState("");
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
    const c = { Pendiente: 0, Entregado: 0, Anulado: 0 };
    data.forEach((order: any) => {
      const orderDate = getGuatemalaDateParts(getOrderDateString(order));

      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      if (matchAnio && matchMes && matchSemana) {
        const estado = String(order.estado || "Pendiente")
          .trim()
          .toLowerCase();
        if (estado === "pendiente") c.Pendiente++;
        else if (estado === "entregado") c.Entregado++;
        else if (estado === "anulado") c.Anulado++;
      }
    });
    return c;
  }, [data, filtroAnio, filtroMes, filtroSemana]);

  const groupedOrders = useMemo(() => {
    const priority: Record<string, number> = {
      pendiente: 1,
      entregado: 2,
      anulado: 3,
    };

    const filtered = data.filter((order: any) => {
      const matchEstado =
        !filtroEstado ||
        String(order.estado || "Pendiente")
          .trim()
          .toLowerCase() === filtroEstado.trim().toLowerCase();
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
          ] || 4;
        const pB =
          priority[
            String(b.estado || "Pendiente")
              .toLowerCase()
              .trim()
          ] || 4;
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
              className="w-1/2 p-3 border rounded-xl bg-background font-bold text-xs md:text-sm outline-none"
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
              className="w-1/2 p-1 border rounded-xl bg-background text-[9px] md:text-xs font-bold outline-none"
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
            className="w-full p-3 border rounded-xl bg-background font-bold text-[9px] md:text-base outline-none"
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
                valor: "Pendiente",
                colorBase:
                  "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
                bordeActivo: "border-amber-500 dark:border-amber-400",
              },
              {
                valor: "Entregado",
                colorBase:
                  "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400",
                bordeActivo: "border-green-500 dark:border-green-400",
              },
              {
                valor: "Anulado",
                colorBase:
                  "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
                bordeActivo: "border-red-500 dark:border-red-400",
              },
            ].map(({ valor, colorBase, bordeActivo }) => (
              <label
                key={valor}
                className={`flex items-center justify-center p-3 border-[3px] rounded-xl cursor-pointer transition-all ${colorBase} ${
                  filtroEstado === valor
                    ? bordeActivo
                    : "border-transparent hover:opacity-70"
                }`}
              >
                <input
                  type="radio"
                  name="filtroEstado"
                  value={valor}
                  checked={filtroEstado === valor}
                  onClick={() =>
                    setFiltroEstado(filtroEstado === valor ? "" : valor)
                  }
                  onChange={() => {}}
                  className="sr-only"
                />
                <span className="font-bold text-xs md:text-lg truncate">
                  {valor} ({counts[valor as keyof typeof counts]})
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col gap-8">
        {groupedOrders.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border-2 border-border rounded-xl bg-card">
            No hay pedidos para mostrar.
          </div>
        ) : (
          groupedOrders.map((group) => (
            <div key={group.date} className="flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 text-primary px-4 py-1.5 rounded-full flex items-center gap-2 border border-primary/20">
                  <Calendar className="size-4" />
                  <span className="font-black uppercase text-sm tracking-wider">
                    {group.date !== "Sin Fecha"
                      ? new Date(`${group.date}T12:00:00`)
                          .toLocaleDateString("es-GT", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          })
                          .replace(".", "")
                      : "Sin Fecha de Entrega"}
                  </span>
                </div>
                <div className="h-0.5 grow bg-border/50"></div>
              </div>

              <div className="flex flex-col gap-3">
                {group.orders.map((order: any) => {
                  const estadoNormalizado = String(order.estado || "Pendiente")
                    .trim()
                    .toLowerCase();
                  const isPendiente = estadoNormalizado === "pendiente";
                  const isEntregado = estadoNormalizado === "entregado";

                  return (
                    <div
                      key={order.id}
                      className="bg-card border-2 border-border rounded-xl flex flex-col overflow-hidden relative transition-all shadow-none h-auto"
                    >
                      <div className="flex items-center gap-3 p-3 md:px-5 md:py-3 border-b-2 border-border bg-muted/10">
                        <span className="font-mono font-black text-orange-500 dark:text-orange-400 text-xl md:text-2xl shrink-0">
                          #{String(order.numero_recibo || 0).padStart(5, "0")}
                        </span>
                        <h3 className="font-black text-foreground text-lg md:text-xl uppercase truncate">
                          {order.ven_clientes?.nombre}
                        </h3>
                      </div>

                      <div className="flex flex-col md:flex-row grow">
                        <div className="grow p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start bg-muted/5">
                          {order.ven_detalle?.map((det: any) => (
                            <div
                              key={det.id}
                              className="bg-background p-3 rounded-lg border-2 border-gray-300 dark:border-border/50 flex items-center gap-4 shadow-none"
                            >
                              <span className="bg-foreground text-background text-lg md:text-2xl font-black px-2 py-1 rounded shrink-0 min-w-15 text-center">
                                {`${det.cantidad} ${det.inv_productos?.medida}`}
                              </span>
                              <div className="flex flex-col min-w-0">
                                <span className="text-xs font-bold text-foreground truncate uppercase">
                                  {det.inv_productos?.nombre}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-stretch w-full md:w-auto h-16 md:h-auto border-t-2 md:border-t-0 md:border-l-2 border-border bg-card relative z-10 shrink-0">
                          <button
                            disabled={!isPendiente}
                            onClick={(
                              e: React.MouseEvent<HTMLButtonElement>,
                            ) => {
                              e.stopPropagation();
                              if (isPendiente) onStatusClick(order);
                            }}
                            className={`w-full md:w-44 h-full flex items-center justify-center gap-2 text-sm uppercase font-black transition-all border border-transparent rounded-none ${
                              isPendiente
                                ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 hover:border-[3px] hover:border-amber-500 dark:hover:border-amber-400 cursor-pointer"
                                : isEntregado
                                  ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 cursor-default"
                                  : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 cursor-default"
                            }`}
                          >
                            {order.estado || "Pendiente"}
                            {isPendiente && <Edit className="size-5" />}
                          </button>
                        </div>
                      </div>

                      {order.observaciones &&
                        order.observaciones.trim() !== "" && (
                          <div className="flex flex-col gap-1 p-3 md:px-5 md:py-3 border-t-2 border-border bg-transparent">
                            <span className="font-bold text-[10px] uppercase tracking-wider text-blue-600 dark:text-blue-400">
                              Observaciones
                            </span>
                            <p className="text-sm font-medium text-foreground italic wrap-break-word">
                              {order.observaciones}
                            </p>
                          </div>
                        )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
