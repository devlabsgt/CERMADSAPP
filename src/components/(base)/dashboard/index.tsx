"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Settings2, SmartphoneNfc, ChevronLeft, ChevronRight, User as UserIcon, Users } from "lucide-react";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { getPendingDevicesCount } from "@/components/(LaArada)/admin/lib/actions";
import VerPerfil from "@/components/(base)/(users)/profile/VerPerfil";

export function Dashboard() {
  const router = useRouter();
  const user = useUser();
  const metadata = user?.user_metadata || {};
  const role = metadata.rol || user?.role || "user";
  const canViewSettings = ["super", "admin", "rrhh"].includes(role);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [pendingDevices, setPendingDevices] = useState(0);
  const [asideOpen, setAsideOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    if (!canViewSettings) return;
    getPendingDevicesCount().then((c) => setPendingDevices(c ?? 0));
  }, [canViewSettings]);

  const handleNavigation = (href: string) => {
    if (activeId) return;
    setActiveId("la-arada");
    setTimeout(() => {
      router.push(href);
    }, 1500);
  };

  return (
    <>
    <div className="space-y-6 w-full">
      <div className="flex flex-col gap-2 px-4">
        <h1 className="text-3xl font-bold tracking-tighter text-foreground">
          Panel de Control
        </h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido al panel de control de CERMAD S.A. por favor ingresa al
          módulo para iniciar.
        </p>
      </div>

      <div className="flex items-start w-full">

        {/* COLLAPSIBLE LEFT ASIDE */}
        {canViewSettings && (
          <motion.aside
            animate={{ width: asideOpen ? 256 : 56 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="shrink-0 overflow-hidden self-stretch"
          >
            <div className="bg-card border-r border-border/40 sticky top-6 overflow-hidden h-full">

              {/* Header */}
              <div className="flex items-center justify-between px-3 py-3 border-b border-border/30">
                <AnimatePresence initial={false}>
                  {asideOpen && (
                    <motion.div
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                      className="flex items-center gap-2 overflow-hidden"
                    >
                      <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg shrink-0">
                        <Settings2 className="size-3.5" />
                      </div>
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                        Ajustes
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={() => setAsideOpen((o) => !o)}
                  className={cn(
                    "p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0 cursor-pointer",
                    !asideOpen && "mx-auto"
                  )}
                >
                  {asideOpen ? (
                    <ChevronLeft className="size-4" />
                  ) : (
                    <ChevronRight className="size-4" />
                  )}
                </button>
              </div>

              {/* Items */}
              <div className="p-2 space-y-1">
                {asideOpen ? (
                  <>
                    {/* Dispositivos */}
                    <Link
                      href="/cermadsa/admin/dispositivos"
                      className="group flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-muted/70 border border-transparent hover:border-border/30 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <SmartphoneNfc className="size-4 text-muted-foreground group-hover:text-amber-500 transition-colors shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">Dispositivos</p>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Administrar accesos de empleados
                          </p>
                        </div>
                      </div>
                      {pendingDevices > 0 && (
                        <div className="flex items-center justify-center min-w-[20px] h-[20px] px-1 rounded-full bg-amber-500 text-[10px] font-bold text-white shadow ring-2 ring-white dark:ring-black animate-pulse shrink-0">
                          {pendingDevices}
                        </div>
                      )}
                    </Link>

                    <div className="my-1 border-t border-border/30" />

                    {/* Mi Perfil */}
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="group flex items-center gap-3 w-full p-3 rounded-xl hover:bg-muted/70 border border-transparent hover:border-border/30 transition-all text-left cursor-pointer"
                    >
                      <UserIcon className="size-4 shrink-0" style={{ color: "#a855f7" }} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">Mi Perfil</p>
                        <p className="text-[10px] text-muted-foreground truncate">Ver y editar perfil</p>
                      </div>
                    </button>

                    {/* Usuarios — solo admin/super/rrhh */}
                    {canViewSettings && (
                      <Link
                        href="/cermadsa/usuarios"
                        className="group flex items-center gap-3 p-3 rounded-xl hover:bg-muted/70 border border-transparent hover:border-border/30 transition-all cursor-pointer"
                      >
                        <Users className="size-4 shrink-0" style={{ color: "#a855f7" }} />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">Usuarios</p>
                          <p className="text-[10px] text-muted-foreground truncate">Gestionar usuarios</p>
                        </div>
                      </Link>
                    )}
                  </>
                ) : (
                  <>
                    {/* Dispositivos icon */}
                    <Link
                      href="/cermadsa/admin/dispositivos"
                      className="relative flex items-center justify-center p-3 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer"
                      title="Dispositivos"
                    >
                      <SmartphoneNfc className="size-6 text-muted-foreground hover:text-amber-500 transition-colors" />
                      {pendingDevices > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-white animate-pulse">
                          {pendingDevices}
                        </span>
                      )}
                    </Link>

                    {/* Mi Perfil icon */}
                    <button
                      onClick={() => setIsProfileOpen(true)}
                      className="flex items-center justify-center p-3 rounded-xl hover:bg-muted/70 transition-colors w-full cursor-pointer"
                      title="Mi Perfil"
                    >
                      <UserIcon className="size-6" style={{ color: "#a855f7" }} />
                    </button>

                    {/* Usuarios icon */}
                    {canViewSettings && (
                      <Link
                        href="/cermadsa/usuarios"
                        className="flex items-center justify-center p-3 rounded-xl hover:bg-muted/70 transition-colors cursor-pointer"
                        title="Usuarios"
                      >
                        <Users className="size-6" style={{ color: "#a855f7" }} />
                      </Link>
                    )}
                  </>
                )}
              </div>

            </div>
          </motion.aside>
        )}

        {/* MODULE CARDS — full remaining width */}
        <div className="flex-1 min-w-0 grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-4 p-4">
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
    </div>

    <VerPerfil
      isOpen={isProfileOpen}
      onClose={() => setIsProfileOpen(false)}
      userId={user?.id || null}
    />
    </>
  );
}


