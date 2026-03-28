"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts";
import { useMemo } from "react";

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellerId: string | null;
  sellerName: string | null;
  allVentas: any[];
}

const MONTHS = [
  "Ene", "Feb", "Mar", "Abr", "May", "Jun",
  "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
];

export default function StatsModal({
  isOpen,
  onClose,
  sellerId,
  sellerName,
  allVentas,
}: StatsModalProps) {
  const chartData = useMemo(() => {
    if (!sellerId || !allVentas.length) return [];

    // Filtrar ventas del vendedor actual que no estén anuladas
    const filtered = allVentas.filter(
      (v) => (v.usuario_id === sellerId || (sellerId === "unknown" && !v.usuario_id)) && 
             v.estado?.toLowerCase() !== "anulado"
    );

    const yearData: Record<number, number> = {};
    // Inicializar meses
    for(let i=0; i<12; i++) yearData[i] = 0;

    filtered.forEach((v) => {
      const date = new Date(v.created_at);
      const month = date.getMonth();
      yearData[month] += (v.total || 0);
    });

    return MONTHS.map((name, i) => ({
      name,
      total: parseFloat(yearData[i].toFixed(2)),
    }));
  }, [sellerId, allVentas]);

  const stats = useMemo(() => {
    const total = chartData.reduce((acc, curr) => acc + curr.total, 0);
    const avg = total / chartData.filter(d => d.total > 0).length || 0;
    const maxVal = Math.max(...chartData.map(d => d.total));
    return { total, avg, max: maxVal };
  }, [chartData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1600px] w-[95vw] sm:max-w-[95vw] max-h-[96vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter">
            <TrendingUp className="size-6 text-orange-500" />
            Rendimiento: {sellerName?.toUpperCase() || "VENDEDOR"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/40">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="size-4 text-orange-600" />
              <span className="text-[10px] font-black uppercase text-orange-600/70 tracking-wider">Ventas Totales</span>
            </div>
            <p className="text-2xl font-black text-orange-700 dark:text-orange-400 tracking-tighter">Q{stats.total.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-2 mb-1">
              <Package className="size-4 text-blue-600" />
              <span className="text-[10px] font-black uppercase text-blue-600/70 tracking-wider">Promedio Mes Activo</span>
            </div>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-400 tracking-tighter">Q{stats.avg.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/40">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="size-4 text-emerald-600" />
              <span className="text-[10px] font-black uppercase text-emerald-600/70 tracking-wider">Pico Máximo</span>
            </div>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tighter">Q{stats.max.toLocaleString()}</p>
          </div>
        </div>

        <div className="mt-8 bg-muted/20 border rounded-3xl p-6 h-[550px]">
          <h4 className="text-xs font-black uppercase text-muted-foreground mb-6 flex items-center gap-2">
             <div className="size-2 bg-orange-500 rounded-full animate-pulse" />
             Ventas Mensuales (Serie de Tiempo Anual)
          </h4>
          <ResponsiveContainer width="100%" height="85%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold'}}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fontWeight: 'bold'}}
                tickFormatter={(val) => `Q${val/1000}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#000', 
                  border: 'none', 
                  borderRadius: '16px', 
                  fontSize: '12px',
                  color: '#fff',
                  fontWeight: 'bold'
                }}
                itemStyle={{ color: '#f97316' }}
                formatter={(val?: any) => [`Q${Number(val || 0).toLocaleString()}`, "Ventas"]}
              />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#f97316" 
                strokeWidth={4}
                fillOpacity={1} 
                fill="url(#colorTotal)" 
                dot={{ r: 4, fill: "#f97316", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6, strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 flex justify-end">
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-foreground text-background rounded-full font-black text-xs uppercase hover:opacity-80 transition active:scale-95"
            >
                Cerrar Panel
            </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
