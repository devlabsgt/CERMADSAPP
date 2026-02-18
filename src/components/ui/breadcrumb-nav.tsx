"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Home } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BreadcrumbNav() {
  const pathname = usePathname();
  const router = useRouter();

  const segments = pathname.split("/").filter((item) => item !== "");

  const parentPath =
    segments.length > 1 ? `/${segments.slice(0, -1).join("/")}` : "/cermadsa";

  const isRoot = pathname === "/cermadsa";

  return (
    <div className="flex items-center gap-3 text-[9px] md:text-base font-medium text-muted-foreground overflow-hidden pt-2">
      <AnimatePresence mode="popLayout">
        {!isRoot && (
          <motion.button
            key="back-button"
            initial={{ opacity: 0, x: -20, width: 0 }}
            animate={{ opacity: 1, x: 0, width: "auto" }}
            exit={{ opacity: 0, x: -20, width: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            onClick={() => router.push(parentPath)}
            className="group flex items-center justify-center hover:text-foreground transition-colors cursor-pointer mr-1"
            title="Volver"
          >
            <ArrowLeft className="size-4 md:size-5 transition-transform group-hover:-translate-x-1" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar mask-gradient">
        <Link
          href="/cermadsa"
          className="hover:text-foreground transition-colors p-1 shrink-0"
        >
          <Home className="size-4 md:size-5" />
        </Link>

        <AnimatePresence mode="popLayout">
          {segments.map((segment, index) => {
            if (segment === "cermadsa") return null;

            const href = `/${segments.slice(0, index + 1).join("/")}`;
            const isLast = index === segments.length - 1;

            return (
              <motion.div
                key={href}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex items-center gap-1 shrink-0"
              >
                <ChevronRight className="size-4 md:size-5 text-muted-foreground/40" />
                <Link
                  href={href}
                  className={`capitalize hover:text-foreground transition-colors truncate max-w-38 sm:max-w-none ${
                    isLast
                      ? "text-foreground font-bold pointer-events-none text-xs md:text-lg"
                      : ""
                  }`}
                >
                  {segment.replace(/-/g, " ")}
                </Link>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
