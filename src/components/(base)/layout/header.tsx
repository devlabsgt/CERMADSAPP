"use client";

import { useState } from "react";
import Link from "next/link";
import { useUser } from "@/components/(base)/providers/UserProvider";
import { BreadcrumbNav } from "@/components/ui/breadcrumb-nav";
import { Menu as MenuIcon, X } from "lucide-react";
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler";
import AnimatedIcon from "@/components/ui/AnimatedIcon";
import { AuroraText } from "@/components/ui/aurora-text";
import Menu from "./Menu";

export default function Header() {
  const user = useUser();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <header className="w-full bg-background transition-all border-b border-border/40 md:border-none relative z-40">
        <div className="mx-auto flex h-14 md:h-16 items-center justify-between px-4 md:px-8 gap-4">
          <div className="flex items-center">
            <Link
              href={user ? "/cermadsa" : "/"}
              className="flex items-center shrink-0"
            >
              <span className="font-serif font-bold text-lg md:text-2xl tracking-tight">
                <AuroraText
                  colors={["#ff0000", "#dc2626", "#991b1b", "#ef4444"]}
                >
                  CERMAD S.A.
                </AuroraText>
              </span>
            </Link>
            {user && (
              <div className="hidden md:flex ml-8 border-l border-border/30 h-10 items-center pl-4">
                <BreadcrumbNav />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center">
              <AnimatedThemeToggler />
            </div>
            <button
              id="refresh-btn"
              onClick={() => window.location.reload()}
              className="flex items-center justify-center text-foreground hover:text-foreground/80 cursor-pointer transition-all active:scale-95"
            >
              <AnimatedIcon
                iconKey="diemywzy"
                target="#refresh-btn"
                className="size-6 md:size-8"
              />
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center text-foreground hover:text-foreground/80 cursor-pointer transition-all active:scale-95 ml-2"
            >
              {isOpen ? (
                <X className="size-6 md:size-8" />
              ) : (
                <MenuIcon className="size-6 md:size-8" />
              )}
            </button>
          </div>
        </div>
      </header>

      {user && (
        <div className="md:hidden w-full px-6 py-3 border-b border-border/40 bg-muted/10 relative z-30">
          <BreadcrumbNav />
        </div>
      )}

      <Menu isOpen={isOpen} setIsOpen={setIsOpen} user={user} />
    </>
  );
}
