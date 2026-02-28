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

  useEffect(() => {
    if (isOpen && ventaId) {
      setLoading(true);
      getVentaById(ventaId).then((data) => {
        setVenta(data);
        setLoading(false);
      });
    } else {
      setVenta(null);
    }
  }, [isOpen, ventaId]);

  const handlePrint = () => {
    const printContent = document.getElementById("print-container")?.innerHTML;
    if (!printContent) return;

    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <html>
          <head>
            <title>Ticket_La_Arada</title>
            <style>
              @page { 
                margin: 0; 
                size: 80mm 297mm; 
              }
              body { 
                font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; 
                font-size: 12px; 
                width: 72mm; 
                margin: 0 auto; 
                padding: 4mm; 
                color: black;
                line-height: 1.2;
                background: white;
              }
              .flex { display: flex; }
              .flex-col { flex-direction: column; }
              .justify-between { justify-content: space-between; }
              .items-center { align-items: center; }
              .text-center { text-align: center; }
              .text-right { text-align: right; }
              .text-left { text-align: left; }
              .font-black { font-weight: 900; }
              .font-bold { font-weight: 700; }
              .uppercase { text-transform: uppercase; }
              .w-full { width: 100%; }
              .w-8 { width: 2rem; }
              .border-t-2 { border-top-width: 2px; }
              .border-dashed { border-top-style: dashed; }
              .border-black { border-color: black; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; }
              .pr-1 { padding-right: 0.25rem; }
              .mb-2 { margin-bottom: 0.5rem; }
              .mt-1 { margin-top: 0.25rem; }
              .mt-2 { margin-top: 0.5rem; }
              .gap-2 { gap: 0.5rem; }
              table { border-collapse: collapse; width: 100%; }
              th, td { vertical-align: top; padding: 2px 0; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; }
              .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
              .text-xs { font-size: 0.75rem; line-height: 1rem; }
              .text-\\[10px\\] { font-size: 10px; }
              .text-gray-600 { color: #4b5563; }
              .text-gray-500 { color: #6b7280; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
              .align-top { vertical-align: top; }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    } else {
      window.print();
    }
  };

  if (!isOpen) return null;

  const tipoComprobante = venta?.tipo_comprobante || "Recibo";
  const isFactura = tipoComprobante.includes("Factura");
  const clientNit = venta?.ven_clientes?.nit;

  const nitToPrint =
    tipoComprobante === "Factura NIT" && clientNit && clientNit !== ""
      ? clientNit
      : "C/F";

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl bg-white text-black rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <div className="flex flex-col gap-4 p-4 border-b bg-gray-50 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
              <FileText className="size-5" /> Vista Previa de Ticket
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
                <Settings2 className="size-4 text-gray-400" /> Documento
                Generado:
              </div>
              <div className="px-3 py-1 rounded-md bg-purple-100 text-purple-800 font-bold text-sm uppercase tracking-wider border border-purple-200">
                {tipoComprobante}
              </div>
              {isFactura && (
                <div className="flex items-center gap-2 sm:border-l sm:pl-4">
                  <span className="text-xs text-gray-500 font-bold uppercase">
                    NIT ASIGNADO:
                  </span>
                  <span className="font-mono font-bold text-sm">
                    {nitToPrint}
                  </span>
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

        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100">
          <div
            id="print-container"
            className="bg-white p-4 w-full max-w-[320px] font-mono text-black text-xs shadow-md mx-auto leading-tight"
          >
            {loading ? (
              <div className="py-20 text-center text-gray-500 text-sm italic">
                Cargando documento...
              </div>
            ) : venta ? (
              <div className="flex flex-col gap-2">
                <div className="text-center mb-2">
                  <h1 className="text-2xl font-black uppercase">La Arada</h1>
                  <p>Chiquimula, Guatemala, C.A.</p>
                  <p>Tel: +502 12 34-5678</p>
                </div>

                <div className="border-t-2 border-dashed border-black"></div>

                <div>
                  <p>
                    <span className="font-bold">TICKET NO:</span>{" "}
                    {String(venta.numero_recibo).padStart(5, "0")}
                  </p>
                  <p>
                    <span className="font-bold">FECHA:</span>{" "}
                    {new Date(venta.created_at).toLocaleDateString("es-GT")}{" "}
                    {new Date(venta.created_at).toLocaleTimeString("es-GT", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p>
                    <span className="font-bold">CLIENTE:</span>{" "}
                    {venta.ven_clientes?.nombre}
                  </p>
                  {isFactura && (
                    <p>
                      <span className="font-bold">NIT:</span> {nitToPrint}
                    </p>
                  )}
                  <p>
                    <span className="font-bold">TIPO:</span> {tipoComprobante}
                  </p>
                </div>

                <div className="border-t-2 border-dashed border-black"></div>

                <table className="w-full text-left">
                  <thead>
                    <tr>
                      <th className="py-1 w-8">CANT</th>
                      <th className="py-1">DESCRIPCIÓN</th>
                      <th className="py-1 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {venta.ven_detalle?.map((item: any) => (
                      <tr key={item.id} className="align-top">
                        <td className="py-1">{item.cantidad}</td>
                        <td className="py-1 pr-1">
                          {item.inv_productos?.nombre}
                          <div className="text-[10px] text-gray-600">
                            Q{item.precio_aplicado?.toFixed(2)} c/u
                          </div>
                        </td>
                        <td className="py-1 text-right">
                          Q{item.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="border-t-2 border-dashed border-black mt-1"></div>

                <div className="flex justify-between items-center text-sm font-black py-1">
                  <span>TOTAL:</span>
                  <span>Q{venta.total?.toFixed(2)}</span>
                </div>

                <div className="border-t-2 border-dashed border-black mb-2"></div>

                <div className="text-center text-[10px] space-y-1">
                  {(venta.placa_camion || venta.descripcion_camion) && (
                    <p>
                      <span className="font-bold">Transporte:</span> Placa{" "}
                      {venta.placa_camion} - {venta.descripcion_camion}
                    </p>
                  )}
                  <p className="font-bold text-xs mt-2">
                    ¡GRACIAS POR SU COMPRA!
                  </p>
                  {isFactura && (
                    <p className="mt-2 text-gray-500">
                      Documento emitido internamente. No válido como factura
                      fiscal (FEL) hasta su certificación.
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
    </div>
  );
}
