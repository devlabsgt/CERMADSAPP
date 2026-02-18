"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Script from "next/script";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { cn } from "@/lib/utils";

export default function DashboardLaArada() {
  const menuItems = [
    {
      id: "pedidos",
      href: "/cermadsa/laarada/pedidos",
      label: "Pedidos",
      iconKey: "pmawqxvu",
      desc: "Gestión de órdenes, despachos y seguimiento de entregas.",
      color:
        "border-orange-500/20 bg-orange-500/5 dark:bg-orange-500/15 hover:bg-orange-500/10",
      className: "md:col-span-2 md:row-span-2",
    },
    {
      id: "clientes",
      href: "/cermadsa/laarada/clientes",
      label: "Clientes",
      iconKey: "kvapezwg",
      desc: "Cartera y créditos de clientes.",
      color:
        "border-blue-500/20 bg-blue-500/5 dark:bg-blue-500/15 hover:bg-blue-500/10",
      className: "md:col-span-2 md:row-span-1",
    },
    {
      id: "productos",
      href: "/cermadsa/laarada/productos",
      label: "Productos",
      iconKey: "pkyxcgiq",
      desc: "Inventario de materiales.",
      color:
        "border-amber-500/20 bg-amber-500/5 dark:bg-amber-500/15 hover:bg-amber-500/10",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "proveedores",
      href: "/cermadsa/laarada/proveedores",
      label: "Proveedores",
      iconKey: "zdwrqfmb",
      desc: "Gestión de abastecimiento.",
      color:
        "border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/15 hover:bg-emerald-500/10",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "historiales",
      href: "/cermadsa/laarada/estadisticas",
      label: "Estadísticas",
      iconKey: "xowcggal",
      desc: "Auditoría de movimientos.",
      color:
        "border-purple-500/20 bg-purple-500/5 dark:bg-purple-500/15 hover:bg-purple-500/10",
      className: "md:col-span-1 md:row-span-1",
    },
    {
      id: "creditos",
      href: "/cermadsa/laarada/creditos",
      label: "Créditos",
      iconKey: "unsfxkxg",
      desc: "Gestión de cobros.",
      color:
        "border-red-500/20 bg-red-500/5 dark:bg-red-500/15 hover:bg-red-500/10",
      className: "md:col-span-1 md:row-span-1",
    },
  ];

  return (
    <>
      <Script
        src="https://cdn.lordicon.com/lordicon.js"
        strategy="afterInteractive"
      />

      <div className="min-h-screen p-6 lg:p-12 space-y-10 max-w-7xl mx-auto">
        <header className="flex flex-col gap-2">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-orange-600 dark:text-orange-500">
            Panel La Arada
          </h1>
          <p className="text-muted-foreground text-lg font-medium italic">
            Gestión logística y administrativa
          </p>
        </header>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[200px]"
        >
          {menuItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              id={`card-${item.id}`}
              className={cn(
                "group relative overflow-hidden rounded-4xl border transition-all duration-300 flex flex-col justify-between p-8 bg-card shadow-sm hover:shadow-md",
                item.color,
                item.className,
              )}
            >
              <div className="flex justify-between items-start">
                <div className="p-3 bg-background rounded-2xl border border-border/50 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                  <AnimatedIcon
                    iconKey={item.iconKey}
                    target={`#card-${item.id}`}
                    className="w-10 h-10 md:w-12 md:h-12 text-foreground"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <h3 className="text-xl md:text-2xl font-bold tracking-tight text-foreground transition-colors group-hover:text-orange-500">
                  {item.label}
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-2 font-medium">
                  {item.desc}
                </p>
              </div>
            </Link>
          ))}
        </motion.div>
      </div>
    </>
  );
}
