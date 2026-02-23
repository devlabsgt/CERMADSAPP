import { Calendar, Edit, Printer } from "lucide-react";
import { useState, useMemo } from "react";

const getGuatemalaDateParts = (dateInput?: string | Date) => {
  if (!dateInput) return getGuatemalaDateParts(new Date());
  const date = new Date(dateInput);
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

export default function ListView({
  items,
  isLoading,
  formatDate,
  onStatusClick,
  onPrintClick,
  onEditClick,
}: any) {
  const data = items || [];
  const current = useMemo(() => getGuatemalaDateParts(), []);

  const [filtroEstado, setFiltroEstado] = useState("Todos");
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
    const c = {
      Todos: 0,
      Pendiente: 0,
      Entregado: 0,
      Anulado: 0,
    };
    data.forEach((order: any) => {
      const dateToUse = order.fecha_entrega || order.created_at || new Date();
      const orderDate = getGuatemalaDateParts(dateToUse);

      const matchAnio = orderDate.year === filtroAnio;
      const matchMes = orderDate.month === filtroMes;
      const matchSemana =
        filtroSemana === "Todas" || orderDate.week === filtroSemana;

      if (matchAnio && matchMes && matchSemana) {
        c.Todos++;
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

  const filteredItems = data.filter((order: any) => {
    const matchEstado =
      filtroEstado === "Todos" ||
      String(order.estado || "Pendiente")
        .trim()
        .toLowerCase() === String(filtroEstado).trim().toLowerCase();

    const dateToUse = order.fecha_entrega || order.created_at || new Date();
    const orderDate = getGuatemalaDateParts(dateToUse);

    const matchAnio = orderDate.year === filtroAnio;
    const matchMes = orderDate.month === filtroMes;
    const matchSemana =
      filtroSemana === "Todas" || orderDate.week === filtroSemana;

    return matchEstado && matchAnio && matchMes && matchSemana;
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center italic text-muted-foreground border rounded-xl bg-card">
        Cargando pedidos...
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-6 items-start animate-in fade-in duration-300">
      <aside className="w-full md:w-[10%] shrink-0 flex flex-col gap-6 sticky md:top-6 text-xs">
        <div className="flex flex-col gap-3">
          <h3 className="font-bold text-muted-foreground uppercase text-xs">
            Fecha de entrega
          </h3>
          <div className="flex gap-2">
            <select
              value={filtroAnio}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                setFiltroAnio(Number(e.target.value))
              }
              className="w-1/2 p-3 border rounded-xl bg-background text-foreground cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 font-bold text-xs md:text-sm"
            >
              {Array.from(
                { length: Math.max(1, new Date().getFullYear() - 2024) },
                (_, i) => 2026 + i,
              ).map((anio: number) => (
                <option key={anio} value={anio}>
                  {anio}
                </option>
              ))}
            </select>
            <select
              value={filtroMes}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                setFiltroMes(Number(e.target.value));
                setFiltroSemana("Todas");
              }}
              className="w-1/2 p-1 border rounded-xl bg-background text-[9px] text-foreground cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 font-bold capitalize md:text-xs"
            >
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>
                  {new Date(2000, i, 1).toLocaleString("es-GT", {
                    month: "long",
                    timeZone: "America/Guatemala",
                  })}
                </option>
              ))}
            </select>
          </div>
          <select
            value={filtroSemana}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
              setFiltroSemana(
                e.target.value === "Todas" ? "Todas" : Number(e.target.value),
              )
            }
            className="w-full p-3 border rounded-xl bg-background text-foreground cursor-pointer outline-none focus:ring-2 focus:ring-primary/20 font-bold text-[9px] md:text-base"
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
                valor: "Todos",
                colorBase:
                  "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                bordeActivo: "border-blue-500 dark:border-blue-400",
              },
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
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFiltroEstado(e.target.value)
                  }
                  className="sr-only"
                />
                <span className="font-bold text-xs truncate">
                  {valor} ({counts[valor as keyof typeof counts]})
                </span>
              </label>
            ))}
          </div>
        </div>
      </aside>

      <div className="flex-1 w-full flex flex-col gap-3">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border rounded-xl bg-card">
            No hay pedidos registrados con estos filtros.
          </div>
        ) : (
          filteredItems.map((venta: any) => (
            <div
              key={venta.id}
              className="bg-card border border-border rounded-xl flex flex-col md:flex-row overflow-hidden relative"
            >
              <div
                onClick={() => onEditClick(venta)}
                className="grow flex flex-col md:flex-row cursor-pointer hover:ring-inset hover:ring-2 hover:ring-primary/40 transition-all outline-none rounded-t-xl md:rounded-none md:rounded-l-xl"
              >
                <div className="flex flex-col gap-2 p-4 grow justify-center">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-500 dark:text-orange-400 text-sm">
                      #{String(venta.numero_recibo).padStart(5, "0")}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] uppercase font-bold ${
                        venta.tipo_venta === "Contado"
                          ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400"
                          : "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400"
                      }`}
                    >
                      {venta.tipo_venta}
                    </span>
                  </div>
                  <h3 className="font-bold text-foreground text-base">
                    {venta.ven_clientes?.nombre}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="size-3" />
                    <span>{formatDate(venta.fecha_entrega)}</span>
                  </div>
                </div>

                <div className="flex flex-col items-start md:items-end justify-center p-4 shrink-0 bg-transparent">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">
                    Total
                  </span>
                  <span className="font-mono font-bold text-base md:text-lg">
                    Q{venta.total.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex items-stretch w-full md:w-auto h-14 md:h-auto border-t md:border-t-0 bg-card relative z-10">
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onStatusClick(venta);
                  }}
                  className={`w-1/2 md:w-36 h-full flex items-center justify-center gap-1.5 text-xs uppercase font-bold cursor-pointer transition-all border border-transparent border-r-border/50 rounded-bl-xl md:rounded-none ${
                    String(venta.estado || "Pendiente")
                      .trim()
                      .toLowerCase() === "pendiente"
                      ? "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 hover:border-[3px] hover:border-amber-500 dark:hover:border-amber-400"
                      : String(venta.estado || "")
                            .trim()
                            .toLowerCase() === "entregado"
                        ? "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 hover:border-[3px] hover:border-green-500 dark:hover:border-green-400"
                        : "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400 hover:border-[3px] hover:border-red-500 dark:hover:border-red-400"
                  }`}
                >
                  {venta.estado || "Pendiente"} <Edit className="size-4" />
                </button>
                <button
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    e.stopPropagation();
                    onPrintClick(venta.id);
                  }}
                  className="w-1/2 md:w-auto md:px-6 h-full flex items-center justify-center bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 hover:border-[3px] hover:border-blue-500 dark:hover:border-blue-400 transition-all border border-transparent cursor-pointer rounded-br-xl md:rounded-r-xl md:rounded-bl-none"
                >
                  <Printer className="size-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
