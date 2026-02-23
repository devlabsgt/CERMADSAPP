import { Suspense } from "react";
import ListadoVentas from "@/components/(LaArada)/pedidos";

export default function VentasPage() {
  return (
    <Suspense>
      <ListadoVentas />
    </Suspense>
  );
}
