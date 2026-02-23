"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Script from "next/script";
import Image from "next/image";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";
import { getStockStats } from "./productos/lib/actions";
import { getPendingOrdersCount } from "./pedidos/lib/actions";

export default function DashboardLaArada() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pendientes: 0,
    sinStock: 0,
    stockBajo: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [pendientes, stock] = await Promise.all([
        getPendingOrdersCount(),
        getStockStats(),
      ]);
      setStats({
        pendientes: pendientes || 0,
        sinStock: stock?.sinStock || 0,
        stockBajo: stock?.stockBajo || 0,
      });
    };
    fetchStats();
  }, []);

  const menuItems = [
    {
      id: "pedidos",
      href: "/cermadsa/laarada/pedidos",
      label: "Ventas y pedidos",
      iconKey: "falgkefu",
      desc: "Gestión de órdenes y despachos.",
      color:
        "border-orange-500/20 bg-orange-500/5 dark:bg-[#121212] dark:border-orange-500/40",
      className: "md:col-span-2 md:row-span-2",
    },
    {
      id: "clientes",
      href: "/cermadsa/laarada/clientes",
      label: "Clientes",
      iconKey: "kvapezwg",
      desc: "Cartera de clientes.",
      color:
        "border-blue-500/20 bg-blue-500/5 dark:bg-[#121212] dark:border-blue-500/40",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "creditos",
      href: "/cermadsa/laarada/creditos",
      label: "Créditos",
      iconKey: "unsfxkxg",
      desc: "Gestión de cobros.",
      color:
        "border-red-500/20 bg-red-500/5 dark:bg-[#121212] dark:border-red-500/40",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "productos",
      href: "/cermadsa/laarada/productos",
      label: "Productos",
      iconKey: "itixlgjo",
      desc: "Inventario.",
      color:
        "border-amber-500/20 bg-amber-500/5 dark:bg-[#121212] dark:border-amber-500/40",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "proveedores",
      href: "/cermadsa/laarada/proveedores",
      label: "Proveedores",
      iconKey: "zdwrqfmb",
      desc: "Abastecimiento.",
      color:
        "border-emerald-500/20 bg-emerald-500/5 dark:bg-[#121212] dark:border-emerald-500/40",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "historiales",
      href: "/cermadsa/laarada/estadisticas",
      label: "Estadísticas",
      iconKey: "cnbqxixv",
      desc: "Auditoría de movimientos y reportes detallados.",
      color:
        "border-purple-500/20 bg-purple-500/5 dark:bg-[#121212] dark:border-purple-500/40",
      className: "md:col-span-4 md:row-span-1",
    },
  ];

  const handleNavigation = (id: string, href: string) => {
    if (activeId) return;
    setActiveId(id);
    setTimeout(() => {
      router.push(href);
    }, 1500);
  };

  return (
    <>
      <Script
        src="https://cdn.lordicon.com/lordicon.js"
        strategy="afterInteractive"
      />

      <div className="min-h-screen p-6 lg:p-12 space-y-10 max-w-7xl mx-auto bg-background dark:bg-[#0a0a0a]">
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

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[120px] md:auto-rows-[200px]"
        >
          {menuItems.map((item) => (
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
                "group relative overflow-hidden rounded-4xl md:rounded-[2.5rem] border flex flex-row md:flex-col items-center md:items-start md:justify-between p-4 md:p-6 bg-card shadow-sm cursor-pointer",
                item.color,
                item.className,
              )}
            >
              {item.id === "pedidos" && stats.pendientes > 0 && (
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
                    "p-2 md:p-3 bg-white rounded-xl md:rounded-2xl border border-border/50 shadow-sm",
                    item.id === "pedidos" && "md:p-5",
                  )}
                >
                  <AnimatedIcon
                    iconKey={item.iconKey}
                    target={`#card-${item.id}`}
                    className={cn(
                      "w-8 h-8 md:w-12 md:h-12",
                      item.id === "pedidos" && "md:w-24 md:h-24",
                    )}
                  />
                </div>
              </div>

              <div className="ml-4 md:ml-0 space-y-0 md:space-y-1 relative z-10">
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
        </motion.div>
      </div>
    </>
  );
}
