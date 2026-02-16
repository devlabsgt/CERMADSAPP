"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export function Dashboard() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);

    setTimeout(() => {
      router.push("/kore/laarada");
    }, 3000);
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
        <Link
          href="/kore/laarada"
          onClick={handleCardClick}
          className={`group relative flex flex-col items-center justify-center h-48 gap-4 rounded-xl border bg-card/40 backdrop-blur-sm shadow-sm transition-all duration-300 
            ${
              isNavigating
                ? "animate-pulse border-orange-500 shadow-lg shadow-orange-500/30 scale-[0.98]"
                : "border-border/50 hover:border-orange-500 hover:shadow-md hover:shadow-orange-500/20"
            }`}
        >
          <div className="relative h-20 w-20 overflow-hidden">
            <Image
              src="/logos/LaArada.png"
              alt="Logo La Arada"
              fill
              className={`object-contain p-2 transition-transform duration-300 ${isNavigating ? "scale-110" : "group-hover:scale-130"}`}
            />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="font-bold text-lg tracking-tight text-orange-500">
              La Arada
            </span>
            <span className="text-xs tracking-tight text-white/50 group-hover:text-white ">
              Construyendo Junto a ti el futuro.
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
