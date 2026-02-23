"use client";

import { useEffect, useState } from "react";
import { X, Printer, FileText, Settings2 } from "lucide-react";
import { getVentaById } from "../lib/actions";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaId: string | null;
}

export default function ReceiptModal({
  isOpen,
  onClose,
  ventaId,
}: ReceiptModalProps) {
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [docType, setDocType] = useState<"recibo" | "factura">("recibo");
  const [nitToUse, setNitToUse] = useState<string>("C/F");

  useEffect(() => {
    if (isOpen && ventaId) {
      setLoading(true);
      getVentaById(ventaId).then((data) => {
        setVenta(data);
        setLoading(false);
        setDocType("recibo");
        setNitToUse("C/F");
      });
    } else {
      setVenta(null);
    }
  }, [isOpen, ventaId]);

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  const clientNit = venta?.ven_clientes?.nit;
  const hasValidClientNit =
    clientNit && clientNit !== "C/F" && clientNit !== "";

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #print-container, #print-container * {
              visibility: visible;
            }
            #print-container {
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              padding: 10mm 15mm !important;
              margin: 0 !important;
            }
            @page {
              margin: 0;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 print:items-start print:justify-start print:p-0 print:bg-white">
        <div className="w-full max-w-3xl bg-white text-black rounded-xl shadow-2xl overflow-hidden print:shadow-none print:w-full print:max-w-none print:rounded-none">
          <div className="flex flex-col gap-4 p-4 border-b bg-gray-50 print:hidden">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
                <FileText className="size-5" /> Vista Previa de Impresión
              </h2>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-600 transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white border rounded-lg p-3 gap-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                  <Settings2 className="size-4 text-gray-400" /> Documento:
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="docType"
                      checked={docType === "recibo"}
                      onChange={() => {
                        setDocType("recibo");
                        setNitToUse("C/F");
                      }}
                    />
                    Recibo
                  </label>
                  <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                    <input
                      type="radio"
                      name="docType"
                      checked={docType === "factura"}
                      onChange={() => setDocType("factura")}
                    />
                    Factura
                  </label>
                </div>

                {docType === "factura" && (
                  <div className="flex items-center gap-2 sm:border-l sm:pl-4">
                    <span className="text-xs text-gray-500 font-bold uppercase">
                      NIT:
                    </span>
                    <select
                      value={nitToUse}
                      onChange={(e) => setNitToUse(e.target.value)}
                      className="text-sm border rounded px-2 py-1 outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer bg-gray-50"
                    >
                      <option value="C/F">C/F</option>
                      {hasValidClientNit && (
                        <option value={clientNit}>{clientNit}</option>
                      )}
                    </select>
                  </div>
                )}
              </div>

              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold text-sm transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Printer className="size-4" /> IMPRIMIR
              </button>
            </div>
          </div>

          <div className="p-8 print:p-0" id="print-container">
            {loading ? (
              <div className="py-20 text-center text-gray-500 text-sm italic">
                Cargando documento...
              </div>
            ) : venta ? (
              <div className="space-y-6 font-mono">
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4">
                  <div>
                    <h1 className="text-lg font-black uppercase tracking-widest text-orange-500">
                      La Arada
                    </h1>
                    <p className="text-[10px] text-gray-600">
                      Chiquimula, Guatemala, C.A.
                    </p>
                    <p className="text-[10px] text-gray-600">
                      Tel: +502 12 34-5678
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="bg-gray-800 text-white px-3 py-1 text-[10px] font-bold uppercase inline-block mb-1">
                      {docType === "factura" ? "Factura Simulada" : "Recibo"}
                    </div>
                    <h3 className="text-base font-bold text-red-600">
                      NO. {String(venta.numero_recibo).padStart(5, "0")}
                    </h3>
                    <p className="text-[10px] text-gray-500">
                      Fecha:{" "}
                      {new Date(venta.created_at).toLocaleDateString("es-GT")}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-2 gap-3">
                    <div className={docType === "recibo" ? "col-span-2" : ""}>
                      <span className="block text-[9px] font-bold uppercase text-gray-500">
                        Cliente
                      </span>
                      <span className="font-bold text-sm">
                        {venta.ven_clientes?.nombre}
                      </span>
                    </div>
                    {docType === "factura" && (
                      <div>
                        <span className="block text-[9px] font-bold uppercase text-gray-500">
                          NIT
                        </span>
                        <span className="text-sm">{nitToUse}</span>
                      </div>
                    )}
                    <div className="col-span-2">
                      <span className="block text-[9px] font-bold uppercase text-gray-500">
                        Dirección
                      </span>
                      <span className="text-[11px]">
                        {venta.ven_clientes?.direccion || "Ciudad"}
                      </span>
                    </div>
                  </div>
                </div>

                <table className="w-full text-left mt-4">
                  <thead>
                    <tr className="border-b-2 border-gray-800 text-[10px] uppercase">
                      <th className="py-2 w-16 text-center">Cant.</th>
                      <th className="py-2">Descripción</th>
                      <th className="py-2 w-24 text-right">P. Unit</th>
                      <th className="py-2 w-24 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-xs">
                    {venta.ven_detalle?.map((item: any) => (
                      <tr key={item.id}>
                        <td className="py-2 text-center font-bold">
                          {item.cantidad}
                        </td>
                        <td className="py-2">
                          <span className="block font-semibold">
                            {item.inv_productos?.medida}
                            {" de "}
                            {item.inv_productos?.nombre}
                          </span>
                          <span className="text-[9px] text-gray-500">
                            {item.inv_productos?.codigo}
                          </span>
                        </td>
                        <td className="py-2 text-right">
                          Q{item.precio_aplicado?.toFixed(2)}
                        </td>
                        <td className="py-2 text-right font-bold">
                          Q{item.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="flex justify-end pt-3 border-t border-gray-800">
                  <div className="w-48 space-y-1">
                    <div className="flex justify-between text-[11px] text-gray-600">
                      <span>Subtotal:</span>
                      <span>Q{venta.total?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-black border-t border-gray-400 pt-1 mt-1">
                      <span>TOTAL:</span>
                      <span>Q{venta.total?.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-6 text-center space-y-4">
                  {(venta.placa_camion || venta.descripcion_camion) && (
                    <div className="text-left bg-gray-100 p-2 text-[10px] mb-4">
                      <span className="font-bold">Datos de Transporte:</span>{" "}
                      Placa {venta.placa_camion} - {venta.descripcion_camion}
                    </div>
                  )}

                  {docType === "factura" && (
                    <p className="text-[8px] text-gray-400 uppercase mt-4">
                      Documento emitido internamente por Sistema Kore. No válido
                      como factura fiscal (FEL) hasta su certificación.
                      <br />
                      Sujeto a pagos trimestrales ISR.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-red-500 text-sm">
                No se encontró la venta.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
