"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions";
import Swal from "sweetalert2";
import {
  X,
  Users,
  LogIn,
  LogOut,
  Home,
  Package,
  ClipboardList,
  CreditCard,
  Truck,
  ReceiptText,
  ShieldAlert,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import PassKeysModal from "@/components/(base)/layout/modals/PassKeysModal";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { createClient } from "@/utils/supabase/client";

const LA_ARADA_LINKS = [
  {
    href: "/cermadsa/laarada/ventas",
    label: "Ventas y Despachos",
    icon: ClipboardList,
    roles: ["super", "admin", "contabilidad", "ventas", "user"],
  },
  {
    href: "/cermadsa/laarada/clientes",
    label: "Clientes",
    icon: Users,
    roles: ["super", "admin", "contabilidad", "ventas"],
  },
  {
    href: "/cermadsa/laarada/creditos",
    label: "Créditos",
    icon: CreditCard,
    roles: ["super", "admin", "contabilidad", "ventas"],
  },
  {
    href: "/cermadsa/laarada/contabilidad",
    label: "Contabilidad",
    icon: ReceiptText,
    roles: ["super", "admin", "contabilidad"],
  },
  {
    href: "/cermadsa/laarada/productos",
    label: "Productos",
    icon: Package,
    roles: ["super", "admin", "contabilidad", "ventas"],
  },
  {
    href: "/cermadsa/laarada/proveedores",
    label: "Proveedores",
    icon: Truck,
    roles: ["super", "admin", "contabilidad"],
  },
];

interface MenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  user: any;
}

export default function Menu({ isOpen, setIsOpen, user }: MenuProps) {
  const [isPasskeysModalOpen, setIsPasskeysModalOpen] = useState(false);
  const pathname = usePathname();

  const metadata = user?.user_metadata || {};
  const realRole = metadata.rol || user?.role || "user";
  const [effectiveRole, setEffectiveRole] = useState<string>(realRole);

  useEffect(() => {
    if (realRole) setEffectiveRole(realRole);
  }, [realRole]);

  const username =
    metadata.username || user?.email?.split("@")[0] || "Invitado";

  const handleLogout = async () => {
    setIsOpen(false);
    const isDark = document.documentElement.classList.contains("dark");
    const result = await Swal.fire({
      title: "¿Cerrar sesión?",
      text: "Se cerrará tu sesión actual.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: isDark ? "#3b82f6" : "#2563eb",
      cancelButtonColor: "#ef4444",
      confirmButtonText: "Sí, salir",
      cancelButtonText: "Cancelar",
      background: isDark ? "#09090b" : "#ffffff",
      color: isDark ? "#ffffff" : "#000000",
    });
    
    if (result.isConfirmed) {
      const supabase = createClient();
      await supabase.auth.signOut();
      
      // Forzar una recarga completa de la página saltándose la caché de Next.js
      window.location.replace("/login");
    }
  };

  const isLaAradaPath = pathname?.startsWith("/cermadsa/laarada");
  const isCermadsaPath = pathname === "/cermadsa";

  const visibleLaAradaLinks = LA_ARADA_LINKS.filter((link) =>
    link.roles.includes(effectiveRole),
  );

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed right-0 top-0 z-50 h-full w-full sm:w-100 bg-background/95 backdrop-blur-2xl border-l border-border/50 transition-transform duration-500 overflow-y-auto shadow-2xl",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-6">
          {user ? (
            <div className="flex flex-col text-sm">
              <span className="font-bold leading-tight">{username}</span>
              <span className="text-muted-foreground text-xs font-medium uppercase leading-tight">
                {effectiveRole}
              </span>
            </div>
          ) : (
            <div />
          )}
          <button
            onClick={() => setIsOpen(false)}
            className="flex items-center justify-center rounded-xl p-2.5 text-foreground hover:bg-muted/50 border border-border/50 cursor-pointer"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col min-h-[calc(100%-80px)] px-6 pb-8">
          {user ? (
            <>
              {realRole === "super" && (
                <div className="mb-6 flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/50 p-3 rounded-xl">
                  <ShieldAlert className="size-5 text-yellow-600 shrink-0" />
                  <select
                    value={effectiveRole}
                    onChange={(e) => setEffectiveRole(e.target.value)}
                    className="bg-transparent text-xs font-bold text-yellow-700 outline-none cursor-pointer w-full"
                  >
                    <option value="super">Simular: SUPER</option>
                    <option value="admin">Simular: Admin</option>
                    <option value="contabilidad">Simular: Contabilidad</option>
                    <option value="ventas">Simular: Ventas</option>
                    <option value="user">Simular: User</option>
                  </select>
                </div>
              )}

              <div className="mb-8">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>Cerrar Sesión</span>
                  <LogOut className="size-4 rotate-180" />
                </button>
              </div>

              <button
                id="passkey-btn"
                onClick={() => setIsPasskeysModalOpen(true)}
                className="mb-8 w-full flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/50 hover:bg-muted/50 transition-colors cursor-pointer shadow-sm group"
              >
                <div className="flex items-center gap-4 text-left">
                  <div className="relative shrink-0 rounded-xl bg-background p-2 shadow-sm border border-border/50 group-hover:scale-105 transition-transform duration-300">
                    <AnimatedIcon
                      iconKey="oskfhomm"
                      className="size-8 text-foreground"
                      target="#passkey-btn"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-foreground">
                      Ingreso Seguro
                    </span>
                    <span className="text-[10px] font-medium text-muted-foreground mt-0.5">
                      Administrar dispositivos
                    </span>
                  </div>
                </div>
              </button>

              <nav className="flex flex-col mb-8 pl-2 w-full gap-6">
                {isCermadsaPath && (
                  <>
                    <Link
                      href="/cermadsa"
                      onClick={() => setIsOpen(false)}
                      className="w-fit text-base font-semibold text-muted-foreground hover:text-foreground flex items-center gap-3 py-1 relative group"
                    >
                      <Home className="size-5" />
                      <span>Inicio</span>
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                    </Link>

                    <Link
                      href="/cermadsa/laarada"
                      onClick={() => setIsOpen(false)}
                      className="w-fit text-base font-semibold text-muted-foreground hover:text-orange-500 flex items-center gap-3 py-1 relative group"
                    >
                      <div className="relative size-6 shrink-0">
                        <Image
                          src="/logos/LaArada.png"
                          alt="Logo La Arada"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                      <span>La Arada</span>
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-orange-500 transition-all group-hover:w-full" />
                    </Link>
                  </>
                )}

                {isLaAradaPath && (
                  <>
                    <Link
                      href="/cermadsa/laarada"
                      onClick={() => setIsOpen(false)}
                      className="w-fit text-base font-semibold text-muted-foreground hover:text-orange-500 flex items-center gap-3 py-1 relative group"
                    >
                      <div className="relative size-6 shrink-0">
                        <Image
                          src="/logos/LaArada.png"
                          alt="Logo La Arada"
                          fill
                          className="object-contain"
                          priority
                        />
                      </div>
                      <span>Inicio La Arada</span>
                      <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-orange-500 transition-all group-hover:w-full" />
                    </Link>
                    <div className="flex flex-col gap-6 pt-6 border-t border-border/90 w-full">
                      {visibleLaAradaLinks.map((link) => (
                        <Link
                          key={link.href}
                          href={link.href}
                          onClick={() => setIsOpen(false)}
                          className="w-fit text-base font-semibold text-muted-foreground hover:text-[#3b82f6]! flex items-center gap-3 py-1 relative group"
                        >
                          <link.icon
                            className="size-5"
                            style={{ color: "#3b82f6" }}
                          />
                          <span>{link.label}</span>
                          <span
                            className="absolute -bottom-1 left-0 h-0.5 w-0 transition-all group-hover:w-full"
                            style={{ backgroundColor: "#3b82f6" }}
                          />
                        </Link>
                      ))}
                    </div>
                  </>
                )}
                </nav>
            </>
          ) : (
            <div className="mb-8 mt-2">
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all"
              >
                <span>Iniciar Sesión</span>
                <LogIn className="size-4" />
              </Link>
            </div>
          )}
        </div>
      </aside>

      <PassKeysModal
        isOpen={isPasskeysModalOpen}
        onClose={() => setIsPasskeysModalOpen(false)}
        user={user}
      />
    </>
  );
}
