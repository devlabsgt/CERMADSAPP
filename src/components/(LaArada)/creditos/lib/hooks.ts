"use client";

import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useVentas } from "../../ventas/lib/hooks";
import { ClienteCredito, VentaCredito, PagoCreditoValues } from "./zod";
import { procesarPagoCredito } from "./actions";
import Swal from "sweetalert2";
import { useTheme } from "next-themes";

interface ActionResponse {
  success?: boolean;
  error?: string;
}

export function useCreditos() {
  const { data: ventas = [], isLoading } = useVentas();

  const creditosTotales = useMemo(() => {
    return ventas.filter(
      (v: VentaCredito) =>
        v.tipo_venta === "Crédito" &&
        v.estado !== "Anulado" &&
        v.estado !== "Pagado",
    );
  }, [ventas]);

  const clientesConCredito = useMemo(() => {
    const agrupados = creditosTotales.reduce(
      (acc: Record<string, ClienteCredito>, venta: VentaCredito) => {
        const id = venta.cliente_id;
        if (!acc[id]) {
          acc[id] = {
            cliente_id: id,
            nombre: venta.ven_clientes?.nombre || "Desconocido",
            nit: venta.ven_clientes?.nit || "C/F",
            telefono: venta.ven_clientes?.telefono || "N/A",
            totalDeuda: 0,
            cantidadPedidos: 0,
          };
        }
        acc[id].totalDeuda += Number(venta.total || 0);
        acc[id].cantidadPedidos += 1;
        return acc;
      },
      {} as Record<string, ClienteCredito>,
    );

    return (Object.values(agrupados) as ClienteCredito[]).sort(
      (a, b) => b.totalDeuda - a.totalDeuda,
    );
  }, [creditosTotales]);

  return { clientesConCredito, creditosTotales, isLoading };
}

const useSwalConfig = () => {
  const { theme } = useTheme();
  return {
    background: theme === "dark" ? "#18181b" : "#ffffff",
    color: theme === "dark" ? "#ffffff" : "#000000",
    toast: true,
    position: "top" as const,
    showConfirmButton: false,
    timer: 2000,
    customClass: {
      popup: theme === "dark" ? "border border-border" : "",
    },
  };
};

export function useProcesarPago() {
  const queryClient = useQueryClient();
  const config = useSwalConfig();

  return useMutation({
    mutationFn: (data: PagoCreditoValues) => procesarPagoCredito(data),
    onSuccess: (res: ActionResponse) => {
      if (res.error) {
        Swal.fire({
          ...config,
          icon: "error",
          title: "Error",
          text: res.error,
          timer: 4000,
        });
        return;
      }
      queryClient.invalidateQueries({ queryKey: ["ventas"] });
      Swal.fire({
        ...config,
        icon: "success",
        title: "Pago registrado exitosamente",
      });
    },
    onError: (error: Error) => {
      Swal.fire({
        ...config,
        icon: "error",
        title: "Error de conexión",
        text: error.message,
      });
    },
  });
}
