"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";
import { ChevronRight, ShieldAlert } from "lucide-react";
import {
  AreaChart,
  Area,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { getStockStats } from "./productos/lib/actions";
import { getPendingOrdersCount, getVentas } from "./ventas/lib/actions";
import { useUser } from "@/components/(base)/providers/UserProvider";

export default function DashboardLaArada() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState(realRole);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [ventas, setVentas] = useState<any[]>([]);
  const [stats, setStats] = useState({
    pendientes: 0,
    sinStock: 0,
    stockBajo: 0,
  });

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
  }, [realRole]);

  useEffect(() => {
    const fetchStats = async () => {
      const [pendientes, stock, ordersData] = await Promise.all([
        getPendingOrdersCount(),
        getStockStats(),
        getVentas().catch(() => []),
      ]);
      setStats({
        pendientes: pendientes || 0,
        sinStock: stock?.sinStock || 0,
        stockBajo: stock?.stockBajo || 0,
      });
      setVentas(ordersData || []);
    };
    fetchStats();
  }, []);

  const currentMonthData = useMemo(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const validOrders = ventas.filter(
      (o: any) => String(o.estado).toLowerCase().trim() !== "anulado",
    );

    const dayMap: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) dayMap[i] = 0;

    let totalMes = 0;
    let totalOrders = 0;

    validOrders.forEach((item: any) => {
      let dateString = item.fecha_entrega || item.created_at;
      if (dateString) {
        if (typeof dateString === "string" && dateString.length === 10) {
          dateString = `${dateString}T12:00:00`;
        }
        const date = new Date(dateString);
        if (
          date.getMonth() === currentMonth &&
          date.getFullYear() === currentYear
        ) {
          const day = date.getDate();
          const total = Number(item.total || 0);
          dayMap[day] += total;
          totalMes += total;
          totalOrders++;
        }
      }
    });

    const chartData = Object.entries(dayMap).map(([day, total]) => ({
      name: day,
      total: total,
    }));

    const activeDays = chartData.filter((d) => d.total > 0);
    const avgDaily = activeDays.length > 0 ? totalMes / activeDays.length : 0;
    const bestDayTotal = chartData.reduce(
      (max, current) => (current.total > max ? current.total : max),
      0,
    );

    return { totalMes, totalOrders, avgDaily, bestDayTotal, chartData };
  }, [ventas]);

  const canViewContabilidad = ["super", "admin", "contabilidad"].includes(
    effectiveRole,
  );

  const menuItems = [
    {
      id: "ventas",
      href: "/cermadsa/laarada/ventas",
      label: "Ventas y Despachos",
      iconKey: "kphyjsqb",
      desc: "Gestión de Ventas y despachos.",
      color: "border-orange-500/20 bg-orange-500/5 dark:border-orange-500/40",
      className: canViewContabilidad
        ? "md:col-span-2 md:row-span-1"
        : "md:col-span-2 md:row-span-2",
      allowedRoles: ["super", "admin", "contabilidad", "ventas", "user"],
    },
    {
      id: "clientes",
      href: "/cermadsa/laarada/clientes",
      label: "Clientes",
      iconKey: "xkrgmuxd",
      desc: "Cartera de clientes.",
      color: "border-blue-500/20 bg-blue-500/5 dark:border-blue-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad", "ventas"],
    },
    {
      id: "creditos",
      href: "/cermadsa/laarada/creditos",
      label: "Créditos",
      iconKey: "qrhmobcu",
      desc: "Gestión de cobros.",
      color: "border-red-500/20 bg-red-500/5 dark:border-red-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad", "ventas"],
    },
    {
      id: "contabilidad",
      href: "/cermadsa/laarada/contabilidad",
      label: "Contabilidad",
      iconKey: "hrxrggwa",
      desc: "Gestión financiera y reportes.",
      color: "border-indigo-500/20 bg-indigo-500/5 dark:border-indigo-500/40",
      className: "md:col-span-2 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad"],
    },
    {
      id: "productos",
      href: "/cermadsa/laarada/productos",
      label: "Productos",
      iconKey: "gbzbfgyf",
      desc: "Inventario.",
      color: "border-amber-500/20 bg-amber-500/5 dark:border-amber-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad", "ventas"],
    },
    {
      id: "proveedores",
      href: "/cermadsa/laarada/proveedores",
      label: "Proveedores",
      iconKey: "zdwrqfmb",
      desc: "Abastecimiento.",
      color:
        "border-emerald-500/20 bg-emerald-500/5 dark:border-emerald-500/40",
      className: "md:col-span-1 md:row-span-1",
      allowedRoles: ["super", "admin", "contabilidad"],
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    item.allowedRoles.includes(effectiveRole),
  );

  const canViewStats = ["super", "admin", "contabilidad"].includes(
    effectiveRole,
  );

  const handleNavigation = (id: string, href: string) => {
    if (activeId) return;
    setActiveId(id);
    setTimeout(() => {
      router.push(href);
    }, 1500);
  };

  return (
    <>
      <div className="min-h-screen px-6 lg:px-12 space-y-10 max-w-550 w-full mx-auto">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
          <header className="flex items-center gap-4 md:gap-6 group">
            <div className="relative size-12 md:size-16 shrink-0 transition-transform duration-300 group-hover:-translate-y-2">
              <Image
                src="/logos/LaArada.png"
                alt="Logo La Arada"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-orange-600 dark:text-orange-500">
                La Arada
              </h1>
              <p className="text-orange-600 dark:text-orange-500 text-sm md:text-lg font-medium italic">
                Construyendo Junto a ti el Futuro
              </p>
            </div>
          </header>

          {realRole === "super" && (
            <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 backdrop-blur-md px-4 py-2 rounded-xl shadow-sm w-full xl:w-auto justify-center">
              <ShieldAlert className="size-5 text-yellow-600 shrink-0" />
              <span className="text-xs font-bold text-yellow-600 uppercase hidden sm:inline whitespace-nowrap">
                Modo Super:
              </span>
              <select
                value={effectiveRole}
                onChange={(e) => setEffectiveRole(e.target.value)}
                className="bg-transparent text-sm font-bold text-yellow-700 outline-none cursor-pointer w-full sm:w-auto"
              >
                <option value="super">SUPER (Real)</option>
                <option value="admin">Admin</option>
                <option value="contabilidad">Contabilidad</option>
                <option value="ventas">Ventas</option>
                <option value="rrhh">RRHH</option>
                <option value="user">User (Normal)</option>
              </select>
            </div>
          )}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[120px] md:auto-rows-[200px]"
        >
              {visibleMenuItems.map((item) => (
                <motion.div
                  key={item.id}
                  id={`card-${item.id}`}
                  layoutId={item.id}
                  onClick={() => handleNavigation(item.id, item.href)}
                  whileHover={{ scale: 1.02, y: -5 }}
                  animate={
                    activeId === item.id
                      ? {
                          scale: [1, 1.05, 1],
                          transition: { duration: 1.5, ease: "easeInOut" },
                        }
                      : { scale: 1, y: 0 }
                  }
                  className={cn(
                    "group relative overflow-hidden rounded-4xl md:rounded-[2.5rem] border flex flex-row items-center justify-start gap-4 md:gap-6 p-4 md:p-6 shadow-sm cursor-pointer",
                    item.color,
                    item.className,
                  )}
                >
                  {item.id === "ventas" && stats.pendientes > 0 && (
                    <div className="absolute top-3 right-3 md:top-5 md:right-5 flex items-center bg-amber-500 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full shadow-md z-20 animate-pulse ring-2 ring-white dark:ring-black">
                      Pendientes de entrega: {stats.pendientes}
                    </div>
                  )}

                  {item.id === "productos" &&
                    (stats.sinStock > 0 || stats.stockBajo > 0) && (
                      <div className="absolute top-3 right-3 md:top-5 md:right-5 flex flex-col gap-1.5 z-20 items-end">
                        {stats.sinStock > 0 && (
                          <div className="flex items-center bg-red-500 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full shadow-md animate-pulse ring-2 ring-white dark:ring-black">
                            Sin stock: {stats.sinStock}
                          </div>
                        )}
                        {stats.stockBajo > 0 && (
                          <div className="flex items-center bg-orange-500 text-white px-3 py-1 text-[10px] md:text-xs font-bold rounded-full shadow-md ring-2 ring-white dark:ring-black">
                            Stock bajo: {stats.stockBajo}
                          </div>
                        )}
                      </div>
                    )}

                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "p-2 md:p-3 bg-gray-50 rounded-xl md:rounded-2xl border border-border/50 shadow-sm",
                        item.id === "ventas" && !canViewContabilidad && "md:p-5",
                      )}
                    >
                      <AnimatedIcon
                        iconKey={item.iconKey}
                        target={`#card-${item.id}`}
                        className={cn(
                          "w-8 h-8 md:w-20 md:h-20",
                          item.id === "ventas" &&
                            !canViewContabilidad &&
                            "md:w-24 md:h-24",
                        )}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col space-y-0 md:space-y-1 relative z-10">
                    <h3 className="text-base md:text-xl font-bold tracking-tight text-foreground transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-1 font-medium italic">
                      {item.desc}
                    </p>
                  </div>

                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05]" />
                </motion.div>
              ))}

              {canViewStats && (
                <motion.div
                  id="stats-widget"
                  onClick={() => router.push("/cermadsa/laarada/estadisticas")}
                  whileHover={{ scale: 1.01 }}
                  className="md:col-span-4 rounded-4xl md:rounded-[2.5rem] border border-purple-500/20 bg-purple-500/5 dark:border-purple-500/40 p-6 md:p-8 shadow-sm cursor-pointer relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 group min-h-75 mb-12"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 md:w-[35%] w-full z-10">
                    <div className="p-4 bg-white text-purple-500 rounded-2xl md:rounded-3xl shadow-lg shadow-purple-500/10 shrink-0 group-hover:scale-105 transition-transform">
                      <AnimatedIcon
                        iconKey="qgwuoxgw"
                        target="#stats-widget"
                        className="w-8 h-8 md:w-20 md:h-20"
                      />
                    </div>
                    <div className="space-y-1 w-full">
                      <h3 className="text-xs md:text-sm font-bold text-purple-600 uppercase tracking-widest">
                        Ingresos de este mes
                      </h3>
                      <p className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tighter">
                        Q
                        {currentMonthData.totalMes.toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </p>

                      <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-purple-500/20 w-full">
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Promedio Diario
                          </p>
                          <p className="text-sm lg:text-base font-black text-foreground">
                            Q
                            {currentMonthData.avgDaily.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Mejor Día
                          </p>
                          <p className="text-sm lg:text-base font-black text-foreground">
                            Q
                            {currentMonthData.bestDayTotal.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">
                            Total Ventas
                          </p>
                          <p className="text-sm lg:text-base font-black text-foreground">
                            {currentMonthData.totalOrders} ventas entregadas
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-[11px] font-bold text-purple-500 hover:text-purple-400 transition-colors uppercase mt-3 pt-2">
                        Ver estadísticas detalladas{" "}
                        <ChevronRight className="size-4" />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-[65%] h-50 md:h-full min-h-50 flex-1 z-10 mt-4 md:mt-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={currentMonthData.chartData}
                        margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient
                            id="colorMini"
                            x1="0"
                            y1="0"
                            x2="0"
                            y2="1"
                          >
                            <stop
                              offset="5%"
                              stopColor="#9333ea"
                              stopOpacity={0.4}
                            />
                            <stop
                              offset="95%"
                              stopColor="#9333ea"
                              stopOpacity={0}
                            />
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="name"
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#888", fontWeight: "bold" }}
                        />
                        <YAxis
                          width={75}
                          fontSize={10}
                          tickLine={false}
                          axisLine={false}
                          tick={{ fill: "#888", fontWeight: "bold" }}
                          tickFormatter={(val) =>
                            `Q${val.toLocaleString("en-US", {
                              minimumFractionDigits: 0,
                              maximumFractionDigits: 0,
                            })}`
                          }
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#000",
                            border: "none",
                            borderRadius: "8px",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: "bold",
                          }}
                          formatter={(value: number | undefined) => [
                            `Q${Number(value || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}`,
                            "Ingreso",
                          ]}
                          labelFormatter={(label) => `Día ${label}`}
                          cursor={{ stroke: "#9333ea", strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="total"
                          stroke="#9333ea"
                          strokeWidth={3}
                          fill="url(#colorMini)"
                          isAnimationActive={true}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05] z-0" />
                </motion.div>
              )}
        </motion.div>
      </div>
    </>
  );
}
