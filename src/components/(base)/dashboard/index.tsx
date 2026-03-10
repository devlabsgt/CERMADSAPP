"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUser } from "@/components/(base)/providers/UserProvider";

export function Dashboard() {
  const router = useRouter();
  const user = useUser();
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleNavigation = (href: string, id: string) => {
    if (activeId) return;
    setActiveId(id);
    setTimeout(() => {
      router.push(href);
    }, 1500);
  };

  return (
    <div className="px-4 w-full h-full pt-10 pb-10 relative">

      {/* ── MÓDULOS ── */}
      <div className="w-full">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
          <motion.div
            layoutId="la-arada"
            onClick={() => handleNavigation("/cermadsa/laarada", "la-arada")}
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
              "group relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] border flex items-center p-5 sm:p-6 bg-card shadow-sm cursor-pointer h-24 sm:h-32",
              "border-orange-500/20 bg-orange-500/5 dark:bg-[#121212] dark:border-orange-500/40",
            )}
          >
            <div className="relative z-10 shrink-0 mr-4 sm:mr-6">
              <div className="w-12 h-12 sm:w-16 sm:h-16 p-1.5 sm:p-2 bg-white rounded-xl sm:rounded-2xl border border-border/50 group-hover:scale-110 transition-transform duration-500 shadow-sm flex items-center justify-center">
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

            <div className="space-y-0.5 sm:space-y-1 relative z-10 flex-1">
              <h3 className="text-xl sm:text-2xl font-bold tracking-tight transition-colors text-orange-500 leading-none">
                La Arada
              </h3>
              <p className="text-xs sm:text-sm text-orange-500 font-medium italic mt-1 sm:mt-2">
                Construyendo Junto a ti el futuro.
              </p>
            </div>

            <div className="absolute inset-0 bg-linear-to-br from-transparent via-transparent to-current opacity-[0.03] dark:opacity-[0.05]" />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
