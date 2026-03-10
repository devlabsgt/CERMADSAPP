"use client";

import { useState, useMemo } from "react";
import { AuthorizeButton } from "./AuthorizeButton";
import {
  Monitor,
  Smartphone,
  Calendar,
  ChevronDown,
  Search,
  ShieldCheck,
  ShieldAlert,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Device {
  id: string;
  user_id: string;
  device_name: string;
  friendly_name?: string | null;
  is_authorized: boolean;
  created_at: string;
}

interface UserGroup {
  user_id: string;
  name: string;
  devices: Device[];
}

export function DevicesAccordion({ groups }: { groups: UserGroup[] }) {
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return groups;
    return groups.filter((g) => g.name.toLowerCase().includes(q));
  }, [groups, search]);

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const pendingCount = (devices: Device[]) =>
    devices.filter((d) => !d.is_authorized).length;

  return (
    <div className="w-full lg:w-4/5 mx-auto space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre de usuario..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Accordion */}
      {filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground italic text-sm">
          {search ? "Sin resultados para esa búsqueda." : "No hay registros de dispositivos."}
        </div>
      )}

      {filtered.map((group) => {
        const isOpen = openIds.has(group.user_id);
        const pending = pendingCount(group.devices);

        return (
          <div
            key={group.user_id}
            className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
          >
            {/* Header row */}
            <button
              onClick={() => toggle(group.user_id)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-muted">
                  <User className="size-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">{group.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {group.devices.length} dispositivo{group.devices.length !== 1 && "s"}
                    {pending > 0 && (
                      <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                        · {pending} pendiente{pending !== 1 && "s"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {pending > 0 && (
                  <span className="flex items-center justify-center min-w-[22px] h-[22px] px-1.5 rounded-full bg-amber-500 text-[11px] font-bold text-white animate-pulse">
                    {pending}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "size-4 text-muted-foreground transition-transform duration-300",
                    isOpen && "rotate-180"
                  )}
                />
              </div>
            </button>

            {/* Devices list */}
            <div
              className={cn(
                "grid transition-all duration-300 ease-in-out",
                isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="border-t border-border divide-y divide-border/60">
                  {group.devices.map((dev) => (
                    <div
                      key={dev.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 bg-muted/10 hover:bg-muted/20 transition-colors"
                    >
                      {/* Device info */}
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="mt-0.5 shrink-0 p-1.5 rounded-lg bg-background border border-border">
                          {dev.device_name.toLowerCase().includes("mac") ||
                          dev.device_name.toLowerCase().includes("windows") ? (
                            <Monitor className="size-4 text-muted-foreground" />
                          ) : (
                            <Smartphone className="size-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold truncate max-w-[260px] lg:max-w-md">
                            {dev.friendly_name || dev.device_name}
                          </p>
                          {dev.friendly_name && (
                            <p className="text-[10px] text-muted-foreground truncate max-w-[260px] lg:max-w-md">
                              {dev.device_name}
                            </p>
                          )}
                          <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                            <Calendar className="size-3 shrink-0" />
                            {format(new Date(dev.created_at), "dd/MM/yyyy HH:mm", {
                              locale: es,
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Status + actions */}
                      <div className="flex items-center gap-3 shrink-0">
                        {dev.is_authorized ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="size-3" />
                            Autorizado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            <ShieldAlert className="size-3" />
                            Pendiente
                          </span>
                        )}
                        <AuthorizeButton id={dev.id} isAuthorized={dev.is_authorized} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
