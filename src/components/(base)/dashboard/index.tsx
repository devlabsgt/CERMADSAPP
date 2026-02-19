"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

export function Dashboard() {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleNavigation = (href: string) => {
    if (activeId) return;
    setActiveId("la-arada");
    setTimeout(() => {
      router.push(href);
    }, 1500);
  };

  return (
    <div className="space-y-6 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">
          Panel de Control
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido al panel de control de CERMAD S.A. por favor ingresa al
          módulo para iniciar.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          layoutId="la-arada"
          onClick={() => handleNavigation("/cermadsa/laarada")}
          whileHover={{ scale: 1.02, y: -5 }}
          animate={
            activeId === "la-arada"
              ? {
                  scale: [1, 1.05, 1],
                  transition: { duration: 1.5, ease: "easeInOut" },
                }
              : { scale: 1, y: 0 }
          }
          className={cn(
            "group relative overflow-hidden rounded-[2.5rem] border flex flex-col justify-between p-6 bg-card shadow-sm cursor-pointer h-64",
            "border-orange-500/20 bg-orange-500/5 dark:bg-[#121212] dark:border-orange-500/40",
          )}
        >
          <div className="relative z-10 shrink-0">
            <div className="w-16 h-16 p-2 bg-white rounded-2xl border border-border/50 group-hover:scale-110 transition-transform duration-500 shadow-sm flex items-center justify-center">
              <div className="relative w-full h-full">
                <Image
                  src="/logos/LaArada.png"
                  alt="Logo La Arada"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>
          </div>

          <div className="space-y-1 relative z-10 mt-auto">
            <h3 className="text-2xl font-bold tracking-tight transition-colors text-orange-500">
              La Arada
            </h3>
            <p className="text-sm text-orange-500 font-medium italic">
              Construyendo Junto a ti el futuro.
            </p>
          </div>

          <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05]" />
        </motion.div>
      </div>
    </div>
  );
}
