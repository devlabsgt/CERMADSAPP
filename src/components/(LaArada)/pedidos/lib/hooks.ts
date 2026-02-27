import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { getVentas, createVenta, getCatalogos, updateVenta } from "./actions";
import { VentaFormValues } from "./zod";
import Swal from "sweetalert2";

export function useVentas() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const supabase = createClient();
    let timeoutId: NodeJS.Timeout;

    const invalidate = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
      }, 500);
    };

    const channel = supabase
      .channel("realtime-ventas")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ven_ventas" },
        invalidate,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ven_detalle" },
        invalidate,
      )
      .subscribe();

    return () => {
      clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["ventas"],
    queryFn: getVentas,
  });
}

export function useCatalogos() {
  return useQuery({
    queryKey: ["catalogos"],
    queryFn: getCatalogos,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: VentaFormValues) => createVenta(data),
    onSuccess: (res) => {
      if (res?.error) {
        Swal.fire({ icon: "error", title: "Error", text: res.error });
      } else {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
        queryClient.invalidateQueries({ queryKey: ["catalogos"] });
        Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Pedido creado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    },
  });
}

export function useUpdateVenta() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: VentaFormValues }) =>
      updateVenta(id, data),
    onSuccess: (res) => {
      if (res?.error) {
        Swal.fire({ icon: "error", title: "Error", text: res.error });
      } else {
        queryClient.invalidateQueries({ queryKey: ["ventas"] });
        Swal.fire({
          toast: true,
          position: "top",
          icon: "success",
          title: "Pedido actualizado correctamente",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    },
  });
}
