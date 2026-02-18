"use client";

import { useState } from "react";
import { Plus, Search, Package } from "lucide-react";
import { useProducts } from "./lib/hooks";
import ProductModal from "./modal/product-modal";

export default function ListadoProductos() {
  const { data: productos = [], isLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

  const filteredProductos = productos.filter(
    (prod: any) =>
      prod.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      prod.codigo.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (product: any) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <Package className="size-5 md:size-6 text-primary" />
            Inventario de Productos
          </h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            Gestiona los materiales de la pedrinera.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center justify-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-bold hover:opacity-90 transition-all cursor-pointer active:scale-95 w-full sm:w-auto text-xs md:text-sm"
        >
          <Plus className="size-4" />
          NUEVO PRODUCTO
        </button>
      </div>

      <div className="flex items-center gap-2 bg-background border rounded-lg px-3 py-2 w-full sm:max-w-md focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        <Search className="size-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar producto..."
          className="bg-transparent outline-none text-xs md:text-sm w-full"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-[9px] md:text-sm text-left table-fixed sm:table-auto">
            <thead className="bg-muted/50 text-muted-foreground font-bold border-b uppercase tracking-widest">
              <tr>
                <th className="w-[12%] md:w-auto px-2 md:px-6 py-4">Cod.</th>
                <th className="w-[38%] md:w-auto px-2 md:px-6 py-4">Nombre</th>
                <th className="w-[28%] md:w-auto px-2 md:px-6 py-4">Medida</th>
                <th className="w-[22%] md:w-auto px-2 md:px-6 py-4 text-right">
                  Precio
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-muted-foreground italic"
                  >
                    Cargando productos...
                  </td>
                </tr>
              ) : filteredProductos.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-muted-foreground"
                  >
                    No hay resultados.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((prod: any) => (
                  <tr
                    key={prod.id}
                    onClick={() => handleEdit(prod)}
                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-2 md:px-6 py-4 font-mono font-bold text-primary truncate">
                      {prod.codigo}
                    </td>
                    <td className="px-2 md:px-6 py-4 font-semibold uppercase truncate">
                      {prod.nombre}
                    </td>
                    <td className="px-2 md:px-6 py-4 text-muted-foreground font-medium truncate">
                      {prod.medida}
                    </td>
                    <td className="px-2 md:px-6 py-4 font-black text-foreground text-right whitespace-nowrap">
                      Q{prod.precio_base.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={selectedProduct}
      />
    </div>
  );
}
