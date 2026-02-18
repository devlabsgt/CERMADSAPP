"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { logout } from "@/app/actions";
import Swal from "sweetalert2";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import {
  Menu,
  X,
  Users,
  CarFront,
  Info,
  PhoneCall,
  LayoutGrid,
  LogIn,
  LogOut,
  Home,
  Package,
  ClipboardList,
  History,
  CreditCard,
  Truck,
  ReceiptText,
  PieChart,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import { AuroraText } from "@/components/ui/aurora-text";

export default function Header() {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {}, [user]);

  const metadata = user?.user_metadata || {};
  const username =
    metadata.username || user?.email?.split("@")[0] || "Invitado";
  const userRole = metadata.rol || user?.role || "user";
  const canManageProfiles = ["super", "admin", "rrhh"].includes(userRole);

  const adminLinks = [
    { href: "/cermadsa", label: "Inicio", icon: Home },
    { href: "/cermadsa/laarada/clientes", label: "Clientes", icon: Users },
    { href: "/cermadsa/laarada/productos", label: "Productos", icon: Package },
    {
      href: "/cermadsa/laarada/pedidos",
      label: "Pedidos",
      icon: ClipboardList,
    },
    {
      href: "/cermadsa/laarada/historiales",
      label: "Historiales",
      icon: History,
    },
    { href: "/cermadsa/laarada/creditos", label: "Créditos", icon: CreditCard },
    {
      href: "/cermadsa/laarada/proveedores",
      label: "Proveedores",
      icon: Truck,
    },
    {
      href: "/cermadsa/laarada/gastos",
      label: "Registro de gastos",
      icon: ReceiptText,
    },
    { href: "/cermadsa/laarada/reportes", label: "Reportes", icon: PieChart },
    { href: "/cermadsa/usuarios", label: "Usuarios", icon: Users },
  ];

  const publicLinks = [
    { href: "#inventory", label: "Inventory", icon: CarFront },
    { href: "#services", label: "Services", icon: LayoutGrid },
    { href: "#about", label: "About Us", icon: Info },
    { href: "#contact", label: "Contact", icon: PhoneCall },
  ];

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
      await logout();
    }
  };

  const inicioLink = adminLinks[0];
  const usuariosLink = adminLinks[adminLinks.length - 1];
  const middleLinks = adminLinks.slice(1, -1);
  const showMiddleSection = pathname?.startsWith("/cermadsa/laarada");

  return (
    <>
      <header className="w-full bg-background transition-all border-b border-border/40 md:border-none">
        <div className="mx-auto flex h-24 items-center justify-between pr-6 lg:pl-5">
          <div className="flex items-center h-full">
            <Link
              href={user ? "/cermadsa" : "/"}
              className="flex items-center h-full py-2 shrink-0"
            >
              <img
                src="/icon.png"
                alt="Kore.dev"
                className="h-full w-auto object-contain rounded-lg"
              />
            </Link>

            {user && (
              <div className="hidden md:flex ml-8 border-l border-border/30 h-10 items-center">
                <BreadcrumbNav />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            <AnimatedThemeToggler />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center rounded-xl p-2.5 text-foreground hover:bg-muted/50 border border-border/50 cursor-pointer"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </header>

      {user && (
        <div className="md:hidden w-full px-6 py-3 border-b border-border/40 bg-muted/10">
          <BreadcrumbNav />
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/40 backdrop-blur-sm transition-opacity"
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
                {userRole}
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
              <div className="mb-8 mt-2">
                <button
                  onClick={handleLogout}
                  className="flex items-center justify-between rounded-xl bg-primary text-primary-foreground px-5 py-3 text-sm font-bold w-full hover:opacity-90 transition-all cursor-pointer"
                >
                  <span>Cerrar Sesión</span>
                  <LogOut className="size-4 rotate-180" />
                </button>
              </div>

              <nav className="flex flex-col mb-8 pl-2 w-full">
                {canManageProfiles && (
                  <>
                    <div className="mb-6">
                      <Link
                        href={inicioLink.href}
                        onClick={() => setIsOpen(false)}
                        className="w-fit text-base font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3 py-1 relative group"
                      >
                        <inicioLink.icon className="size-5" />
                        <span>{inicioLink.label}</span>
                        <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                      </Link>
                    </div>

                    {showMiddleSection && (
                      <div className="flex flex-col gap-6 pt-6 border-t border-border/90 w-full">
                        {middleLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="w-fit text-base font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3 py-1 relative group"
                          >
                            <link.icon className="size-5" />
                            <span>{link.label}</span>
                            <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                          </Link>
                        ))}
                      </div>
                    )}

                    <div className="pt-6 border-t border-border/90 w-full mt-6">
                      <Link
                        href={usuariosLink.href}
                        onClick={() => setIsOpen(false)}
                        className="w-fit text-base font-semibold text-muted-foreground hover:text-foreground transition-colors flex items-center gap-3 py-1 relative group"
                      >
                        <usuariosLink.icon className="size-5" />
                        <span>{usuariosLink.label}</span>
                        <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                      </Link>
                    </div>
                  </>
                )}
              </nav>
            </>
          ) : (
            <>
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

              <nav className="flex flex-col gap-6 mb-8 pl-2">
                {publicLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsOpen(false)}
                    className="w-fit text-lg font-bold text-muted-foreground hover:text-foreground transition-colors relative group"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-primary transition-all group-hover:w-full" />
                  </Link>
                ))}
              </nav>
            </>
          )}

          <div className="mt-auto pt-6 border-t border-border/40">
            <div className="flex flex-col space-y-6">
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="text-center space-y-1 pt-4"
              >
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-40">
                  © 2025 CERMADSAPP
                </p>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Powered by{" "}
                  <a
                    href="https://www.oscar27jimenez.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline cursor-pointer transition-all inline-block"
                  >
                    <AuroraText>Kore | Ingeniería</AuroraText>
                  </a>
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
