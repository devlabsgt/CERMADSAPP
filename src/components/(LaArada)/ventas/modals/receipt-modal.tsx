"use client";

import { useEffect, useState } from "react";
import {
  X,
  Printer,
  FileText,
  Receipt,
  FileCheck2,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  MessageCircle,
} from "lucide-react";
import { getVentaById, updateEstadoVenta } from "../lib/actions";
import { useCertificar, useAnular } from "@/hooks/useInfile";
import type { INFILEResponse } from "@/types/infile";
import Swal from "sweetalert2";

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  ventaId: string | null;
}

type Tab = "recibo" | "factura";

export default function ReceiptModal({
  isOpen,
  onClose,
  ventaId,
}: ReceiptModalProps) {
  const [venta, setVenta] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("recibo");

  // INFILE state
  const { certificar, loading: certificando, error: infileError, respuesta, reset } = useCertificar();
  const { anular, loading: anulando, error: anularError } = useAnular();
  const [nitReceptor, setNitReceptor] = useState("");
  const [nombreReceptor, setNombreReceptor] = useState("CONSUMIDOR FINAL");
  const [correoReceptor, setCorreoReceptor] = useState("");
  const [facturaCF, setFacturaCF] = useState(true);
  const [waNumber, setWaNumber] = useState("");
  const [infileResult, setInfileResult] = useState<INFILEResponse | null>(null);

  useEffect(() => {
    if (isOpen && ventaId) {
      setLoading(true);
      setTab("recibo");
      reset();
      setInfileResult(null);
      getVentaById(ventaId).then((data) => {
        setVenta(data);
        if (data?.dte_documentos?.length > 0) {
          // Si hay certificados, tomar el más reciente o único. Si solo hay anulados, tomar uno.
          const activos = data.dte_documentos.filter((d: any) => d.estado === "certificado");
          const dte = activos.length > 0 ? activos[0] : data.dte_documentos[data.dte_documentos.length - 1];
          setInfileResult({
            resultado: true,
            serie: dte.serie,
            numero: dte.numero?.toString() || "",
            uuid: dte.uuid_infile,
            fecha: dte.fecha_certificacion,
            alertas_infile: !!dte.alertas_infile?.length,
            descripcion_alertas_infile: dte.alertas_infile ?? [],
          } as INFILEResponse);
          if (dte.nit_receptor) setNitReceptor(dte.nit_receptor);
          if (dte.nombre_receptor) setNombreReceptor(dte.nombre_receptor);
        } else {
          // Pre-llenar datos del receptor con info del cliente si existe
          if (data?.ven_clientes?.nit) setNitReceptor(data.ven_clientes.nit);
          if (data?.ven_clientes?.nombre) setNombreReceptor(data.ven_clientes.nombre);
        }
        setLoading(false);
      });
    } else {
      setVenta(null);
    }
  }, [isOpen, ventaId]);

  // ─── Imprimir recibo ─────────────────────────────────────────────────────────
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
            <title>Despacho_La_Arada</title>
            <style>
              @page { margin: 0; size: 80mm 297mm; }
              body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 4mm; color: black; line-height: 1.2; background: white; }
              .flex { display: flex; } .flex-col { flex-direction: column; } .justify-between { justify-content: space-between; } .items-center { align-items: center; }
              .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; }
              .font-black { font-weight: 900; } .font-bold { font-weight: 700; } .uppercase { text-transform: uppercase; } .w-full { width: 100%; }
              .border-t-2 { border-top-width: 2px; } .border-dashed { border-top-style: dashed; } .border-black { border-color: black; }
              .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; }
              table { border-collapse: collapse; width: 100%; } th, td { vertical-align: top; padding: 2px 0; }
              .text-2xl { font-size: 1.5rem; line-height: 2rem; } .text-sm { font-size: 0.875rem; } .text-xs { font-size: 0.75rem; } .text-gray-600 { color: #4b5563; }
              .space-y-1 > * + * { margin-top: 0.25rem; }
            </style>
          </head>
          <body>${printContent}</body>
        </html>
      `);
      doc.close();
      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 1000);
      }, 250);
    }
  };

  // ─── Certificar factura con INFILE ───────────────────────────────────────────
  const handleCertificar = async () => {
    if (!venta) return;

    const nitFinal = facturaCF ? "CF" : (nitReceptor.trim().toUpperCase() || "CF");
    const nombreFinal = facturaCF ? "CONSUMIDOR FINAL" : (nombreReceptor.trim() || "CONSUMIDOR FINAL");

    // Calcular IVA (12% incluido en el precio: total / 1.12 * 0.12)
    const granTotal = venta.total ?? 0;
    const montoGravable = parseFloat((granTotal / 1.12).toFixed(2));
    const montoIVA = parseFloat((granTotal - montoGravable).toFixed(2));

    const items = venta.ven_detalle?.map((item: any, idx: number) => {
      const itemTotal = item.subtotal ?? 0;
      const ig = parseFloat((itemTotal / 1.12).toFixed(2));
      const iva = parseFloat((itemTotal - ig).toFixed(2));
      return {
        numeroLinea: idx + 1,
        bienOServicio: "B" as const,
        cantidad: item.cantidad,
        unidadMedida: item.inv_productos?.medida || "UNI",
        descripcion: item.inv_productos?.nombre || "Producto",
        precioUnitario: item.precio_aplicado ?? 0,
        precio: itemTotal,
        descuento: 0,
        impuestos: [
          {
            nombreCorto: "IVA" as const,
            codigoUnidadGravable: 1,
            montoGravable: ig,
            montoImpuesto: iva,
          },
        ],
        total: itemTotal,
      };
    }) ?? [];

    const now = new Date();
    const offset = "-06:00";
    const fechaISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}${offset}`;

    const resultado = await certificar({
      tipo: "FACT",
      codigoMoneda: "GTQ",
      fechaHoraEmision: fechaISO,
      emisor: {
        nitEmisor: "11700682K",
        nombreEmisor: "CORPORACION CERMAD, SOCIEDAD ANONIMA",
        nombreComercial: "LA ARADA",
        codigoEstablecimiento: "1",
        afiliacionIVA: "GEN",
        direccion: {
          direccion: "CHIQUIMULA, GUATEMALA",
          codigoPostal: "20001",
          municipio: "CHIQUIMULA",
          departamento: "CHIQUIMULA",
          pais: "GT",
        },
      },
      receptor: {
        idReceptor: nitFinal,
        nombreReceptor: nombreFinal,
        ...(correoReceptor.trim() ? { correoReceptor: correoReceptor.trim() } : {}),
        direccion: {
          direccion: "CIUDAD",
          codigoPostal: "01010",
          municipio: "GUATEMALA",
          departamento: "GUATEMALA",
          pais: "GT",
        },
      },
      fraseTipo: 1,
      fraseEscenario: 1,
      items,
      totales: {
        totalIVA: montoIVA,
        granTotal,
      },
      ventaId: venta.id,
    });

    if (resultado) {
      if (resultado.resultado) {
        setInfileResult(resultado);
        // Recargar la venta para incluir el `dte_documentos` recién creado y habilitar el botón "Anular"
        if (ventaId) {
          const updatedVenta = await getVentaById(ventaId);
          setVenta(updatedVenta);
        }
      } else {
        const rawMsjs = resultado.descripcion_errores?.map(e => e.mensaje_error).join("\n") || "";
        // Limpiamos los códigos técnicos horribles de la SAT como "FEL-GUI-18 | 2.2 | ... | Error - "
        const cleanMsjs = rawMsjs.split('\n').map(msg => {
          const parts = msg.split('|');
          let text = parts[parts.length - 1]?.trim() || msg;
          text = text.replace(/^Error\s*-\s*/i, '');
          // Ej: "El NIT del Receptor [11991039] es inválido"
          return text;
        }).join('\n') || "Rechazada por SAT/INFILE.";

        await Swal.fire({
          didOpen: () => {
            const swalContainer = Swal.getContainer();
            if (swalContainer) {
              swalContainer.style.setProperty("z-index", "99999", "important");
            }
          },
          title: "Factura Rechazada",
          text: cleanMsjs,
          icon: "error",
          confirmButtonColor: "#e11d48",
        });
        setInfileResult(null);
      }
    }
  };

  // ─── Anular factura con INFILE ─────────────────────────────────────────────
  const handleAnular = async () => {
    if (!venta?.dte_documentos?.length || !infileResult?.uuid) return;
    const dte = venta.dte_documentos.find((d: any) => d.uuid_infile === infileResult.uuid);
    if (!dte) return;
    
    // Evitar que el botón haga nada si ya está anulado
    if (dte.estado === "anulado") return;

    const result = await Swal.fire({
      didOpen: () => {
        const swalContainer = Swal.getContainer();
        if (swalContainer) {
          swalContainer.style.setProperty("z-index", "99999", "important");
        }
      },
      title: 'Anular Factura Electrónica',
      text: 'Por favor, ingrese el motivo por el cual está anulando este documento.',
      input: 'text',
      inputPlaceholder: 'Ej: Cliente solicitó la devolución del producto',
      showCancelButton: true,
      confirmButtonText: 'Anular ante la SAT',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#e11d48', // Tailwind rose-600
      icon: 'warning',
      inputValidator: (value) => {
        if (!value || value.length < 5) {
          return 'Debe ingresar un motivo válido (mínimo 5 caracteres).';
        }
      }
    });

    if (!result.isConfirmed) return;
    const motivo = result.value;

    // Forzar el formato a hora de Guatemala, INFILE es super estricto con el patrón ISO.
    const getGmtMinus6ISO = (dateStr: string) => {
      const d = new Date(dateStr);
      const gtTime = new Date(d.getTime() - 6 * 60 * 60 * 1000);
      return `${gtTime.getUTCFullYear()}-${String(gtTime.getUTCMonth()+1).padStart(2, '0')}-${String(gtTime.getUTCDate()).padStart(2, '0')}T${String(gtTime.getUTCHours()).padStart(2, '0')}:${String(gtTime.getUTCMinutes()).padStart(2, '0')}:${String(gtTime.getUTCSeconds()).padStart(2, '0')}-06:00`;
    };

    const input = {
      uuidAAnular: dte.uuid_infile,
      nitEmisor: "11700682K",
      idReceptor: dte.id_receptor,
      fechaEmisionDocumento: getGmtMinus6ISO(dte.fecha_emision),
      fechaHoraAnulacion: getGmtMinus6ISO(new Date().toISOString()),
      motivoAnulacion: motivo,
    };

    const resultado = await anular(input);
    if (resultado?.resultado) {
      await Swal.fire({
        didOpen: () => {
          const swalContainer = Swal.getContainer();
          if (swalContainer) {
            swalContainer.style.setProperty("z-index", "99999", "important");
          }
        },
        title: "¡Factura Anulada!",
        text: "La factura fue invalidada exitosamente en la plataforma de la SAT.",
        icon: "success",
        confirmButtonColor: "#059669",
      });

      // Actualizar el estado local para reflejar la anulación del DTE
      setVenta({
        ...venta,
        dte_documentos: [{ ...dte, estado: "anulado" }]
      });

      // Preguntar si también desea anular la venta interna para que se devuelva el stock
      const resVenta = await Swal.fire({
        didOpen: () => {
          const swalContainer = Swal.getContainer();
          if (swalContainer) {
            swalContainer.style.setProperty("z-index", "99999", "important");
          }
        },
        title: "¿Anular también la venta?",
        text: "La factura ya está anulada fiscalmente. ¿Deseas anular también el registro de la venta en el sistema para devolver el inventario?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, anular venta total",
        cancelButtonText: "No, mantener venta interna",
        confirmButtonColor: "#e11d48",
      });

      if (resVenta.isConfirmed) {
        await updateEstadoVenta(venta.id, "Anulado", motivo);
        await Swal.fire({
          didOpen: () => {
            const swalContainer = Swal.getContainer();
            if (swalContainer) {
              swalContainer.style.setProperty("z-index", "99999", "important");
            }
          },
          title: "¡Venta interna anulada!",
          text: "El stock de los productos ha sido devuelto exitosamente.",
          icon: "success",
          confirmButtonColor: "#059669",
        });
      }
    } else if (resultado) {
      // Si la API retornó 200 pero resultado es falso, INFILE rechazó la anulación.
      const msjs = resultado.descripcion_errores?.map(e => e.mensaje_error).join(", ") || "Rechazada por SAT/INFILE.";
      await Swal.fire({
        didOpen: () => {
          const swalContainer = Swal.getContainer();
          if (swalContainer) {
            swalContainer.style.setProperty("z-index", "99999", "important");
          }
        },
        title: "No se pudo anular",
        text: msjs,
        icon: "error",
        confirmButtonColor: "#e11d48",
      });
    }
  };

  if (!isOpen) return null;

  const tipoComprobante = venta?.tipo_comprobante || "Recibo";
  const isFacturaComprobante = tipoComprobante.includes("Factura");
  const nitToPrint = isFacturaComprobante && venta?.ven_clientes?.nit ? venta.ven_clientes.nit : "C/F";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm px-0 sm:p-4">
      <div className="w-full max-w-3xl bg-white text-black rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[98vh] sm:max-h-[95vh]">

        {/* ─── Header ─────────────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 p-4 border-b bg-gray-50 shrink-0">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold flex items-center gap-2 text-gray-800">
              <FileText className="size-5" /> Vista Previa de Venta
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-200 rounded-full text-gray-600 transition-colors cursor-pointer"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* ─── Tabs ───────────────────────────────────────────────────────── */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab("recibo")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                tab === "recibo"
                  ? "bg-blue-600 text-white shadow"
                  : "bg-white border text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Receipt className="size-4" /> Recibo
            </button>
            <button
              onClick={() => setTab("factura")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                tab === "factura"
                  ? "bg-emerald-600 text-white shadow"
                  : "bg-white border text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileCheck2 className="size-4" /> Factura Electrónica (INFILE)
            </button>
          </div>
        </div>

        {/* ─── Recibo Tab ──────────────────────────────────────────────────────── */}
        {tab === "recibo" && (
          <>
            <div className="bg-white border-b px-4 py-4 shrink-0 space-y-3">


              {/* Input Telefónico Minimalista */}
              <div className="px-1">
                <input
                   type="tel"
                   placeholder="Teléfono para enviar por WhatsApp (opcional)"
                   value={waNumber}
                   onChange={(e) => setWaNumber(e.target.value)}
                   className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-100 text-xs px-2 py-1.5 outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="flex gap-2">
                <a
                  href={(() => {
                    if (!venta) return "#";
                    const date = new Date(venta.created_at);
                    const formattedDate = `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`;
                    
                    const message = 
                    `¡Hola! 👋\n` +
                    `Aquí tiene su comprobante de compra:\n\n` +
                      `*Cod. Venta:* ${venta.id?.substring(0, 6).toUpperCase()}\n` +
                      `*CLIENTE:* ${venta.ven_clientes?.nombre || "Consumidor Final"}\n` +
                      `*TOTAL:* Q${venta.total?.toFixed(2)}\n\n` +
                      `*VENDEDOR:* ${venta.vendedor?.nombre || "-"}\n` +
                      `*FECHA:* ${formattedDate}\n\n` +
                      `✨¡GRACIAS POR SU COMPRA!✨\n\n` +
                      `*LA ARADA*  \n _Construyendo Junto a ti el Futuro_\n\n` 
                    
                    const encodedMsg = encodeURIComponent(message);
                    const cleanPhone = waNumber.replace(/\D/g, '');
                    if (cleanPhone.length >= 8) {
                      const finalPhone = cleanPhone.startsWith('502') ? cleanPhone : '502' + cleanPhone;
                      return `https://api.whatsapp.com/send/?phone=${finalPhone}&text=${encodedMsg}`;
                    }
                    return `https://api.whatsapp.com/send/?text=${encodedMsg}`;
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-1/2 flex items-center justify-center gap-2 px-3 py-2 bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-400 rounded-lg font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950 transition cursor-pointer"
                >
                  <MessageCircle className="size-4" /> Enviar
                </a>
                
                <button
                  onClick={handlePrint}
                  className="w-1/2 flex items-center justify-center gap-2 px-3 py-2 bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition cursor-pointer"
                >
                  <Printer className="size-4" /> Imprimir
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-gray-100">
              <div
                id="print-container"
                className="bg-white p-4 w-full max-w-[320px] font-mono text-black text-xs shadow-md mx-auto leading-tight"
              >
                {loading ? (
                  <div className="py-20 text-center text-gray-500 text-sm italic">Cargando documento...</div>
                ) : venta ? (
                  <div className="flex flex-col gap-2">
                    <div className="text-center mb-2">
                      <h1 className="text-2xl font-black uppercase">La Arada</h1>
                      <p>Chiquimula, Guatemala, C.A.</p>
                      <p>Tel: +502 12 34-5678</p>
                    </div>
                    <div className="border-t-2 border-dashed border-black"></div>
                    <div>
                      <p><span className="font-bold uppercase">Cod. Venta:</span> {venta.id?.substring(0, 6).toUpperCase()}</p>
                      <p><span className="font-bold uppercase">Cliente:</span> {venta.ven_clientes?.nombre}</p>
                      {isFacturaComprobante && (
                        <p><span className="font-bold uppercase">Nit:</span> {nitToPrint}</p>
                      )}
                      <p><span className="font-bold uppercase">Tipo:</span> {tipoComprobante}</p>
                    </div>
                    <div className="border-t-2 border-dashed border-black"></div>
                    <table className="w-full text-left">
                      <thead>
                        <tr>
                          <th className="py-1">CANT</th>
                          <th className="py-1">DESCRIPCIÓN</th>
                          <th className="py-1 text-right">TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venta.ven_detalle?.map((item: any) => (
                          <tr key={item.id} className="align-top">
                            <td className="py-1">{item.cantidad} {item.inv_productos?.medida || ""}</td>
                            <td className="py-1 pr-1">
                              {item.inv_productos?.nombre}
                              <div className="text-[10px] text-gray-600">Q{item.precio_aplicado?.toFixed(2)} c/u</div>
                            </td>
                            <td className="py-1 text-right">Q{item.subtotal?.toFixed(2)}</td>
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
                      <p className="font-bold text-xs mt-2 uppercase">¡Gracias por su compra!</p>
                      <p className="mt-1"><span className="font-bold uppercase">Vendedor:</span> {venta.vendedor?.nombre || "-"}</p>
                      <p className="mt-2 text-center">
                        {new Date(venta.created_at).toLocaleDateString("es-GT")}{" "}
                        {new Date(venta.created_at).toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-red-500 text-sm">No se encontró la venta.</div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── Factura DTE Tab ─────────────────────────────────────────────────── */}
        {tab === "factura" && (
          <div className="flex-1 overflow-y-auto p-5 bg-gray-50 space-y-4">

            {/* Resultado exitoso */}
            {infileResult?.resultado ? (
              <div className="space-y-4">
                {/* Header de éxito + botón imprimir */}
                <div className="space-y-3 shrink-0">
                  {/* Mensaje de Estado (Certificada o Anulada) */}
                  {(() => {
                    const currentDte = venta?.dte_documentos?.find((d: any) => d.uuid_infile === infileResult?.uuid);
                    const isAnulado = currentDte?.estado === "anulado";
                    
                    if (isAnulado) {
                      return (
                        <div className="flex items-center gap-2 justify-center py-1 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-100 dark:border-red-900/50">
                          <AlertCircle className="size-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                          <div className="flex flex-col text-left">
                            <p className="font-bold text-sm text-red-600 dark:text-red-400 leading-none uppercase tracking-wide">Factura Anulada</p>
                            <p className="text-red-500/70 dark:text-red-400/50 text-[10px] mt-1 leading-none italic">Documento invalidado ante la SAT</p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex items-center gap-2 justify-center py-1">
                        <CheckCircle2 className="size-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col text-left">
                          <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 leading-none uppercase tracking-wide">¡Factura Certificada!</p>
                          <p className="text-gray-500 dark:text-gray-400 text-[10px] mt-1 leading-none">Validada y autorizada por la SAT vía INFILE</p>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Input Telefónico Minimalista (Opcional) */}
                  <div className="px-1">
                    <input
                       type="tel"
                       placeholder="Teléfono para enviar por WhatsApp (opcional)"
                       value={waNumber}
                       onChange={(e) => setWaNumber(e.target.value)}
                       className="w-full bg-transparent border-b border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300 text-xs px-2 py-1.5 outline-none focus:border-emerald-500 dark:focus:border-emerald-400 transition"
                    />
                  </div>

                  {/* Botones de acción directos 50/50 - Sin fondos, sin sombras */}
                  <div className="flex gap-2">
                    <a
                      href={(() => {
                        const date = new Date(venta.created_at);
                        const formattedDate = `${date.toLocaleDateString("es-GT")} ${date.toLocaleTimeString("es-GT", { hour: "2-digit", minute: "2-digit" })}`;
                        
                        const message = 
                        `¡Hola! 👋\n` +
                        `Aquí tiene su factura electrónica:\n` +
                        `https://report.feel.com.gt/ingfacereport/ingfacereport_documento?uuid=${infileResult.uuid}\n\n` +
                          `*Cod. Venta:* ${venta.id?.substring(0, 6).toUpperCase()}\n` +
                          `*CLIENTE:* ${venta.ven_clientes?.nombre || "Consumidor Final"}\n` +
                          `*TOTAL:* Q${venta.total?.toFixed(2)}\n\n` +
                          `*VENDEDOR:* ${venta.vendedor?.nombre || "-"}\n` +
                          `*FECHA:* ${formattedDate}\n\n` +
                          `✨¡GRACIAS POR SU COMPRA!✨\n\n` +
                          `*LA ARADA*  \n _Construyendo Junto a ti el Futuro_\n\n` 
                        
                        const encodedMsg = encodeURIComponent(message);
                        const cleanPhone = waNumber.replace(/\D/g, '');
                        if (cleanPhone.length >= 8) {
                          const finalPhone = cleanPhone.startsWith('502') ? cleanPhone : '502' + cleanPhone;
                          return `https://api.whatsapp.com/send/?phone=${finalPhone}&text=${encodedMsg}`;
                        }
                        return `https://api.whatsapp.com/send/?text=${encodedMsg}`;
                      })()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-1/2 flex items-center justify-center gap-2 px-3 py-2 bg-transparent text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-400 rounded-lg font-bold text-sm hover:bg-emerald-50 dark:hover:bg-emerald-950 transition cursor-pointer"
                    >
                      <MessageCircle className="size-4" /> Enviar
                    </a>
                    
                    <button
                      onClick={() => {
                        const content = document.getElementById("dte-print-container")?.innerHTML;
                        if (!content) return;
                        const iframe = document.createElement("iframe");
                        iframe.style.display = "none";
                        document.body.appendChild(iframe);
                        const doc = iframe.contentWindow?.document;
                        if (doc) {
                          doc.open();
                          doc.write(`<html><head><title>Factura_DTE</title><style>
                            @page { margin: 0; size: 80mm 297mm; }
                            body { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 12px; width: 72mm; margin: 0 auto; padding: 4mm; color: black; line-height: 1.2; background: white; }
                            .flex { display: flex; } .flex-col { flex-direction: column; } .justify-between { justify-content: space-between; } .items-center { align-items: center; }
                            .text-center { text-align: center; } .text-right { text-align: right; } .text-left { text-align: left; }
                            .font-black { font-weight: 900; } .font-bold { font-weight: 700; } .uppercase { text-transform: uppercase; } .w-full { width: 100%; }
                            .border-t-2 { border-top-width: 2px; } .border-dashed { border-top-style: dashed; } .border-black { border-color: black; }
                            .py-1 { padding-top: 0.25rem; padding-bottom: 0.25rem; } .mb-2 { margin-bottom: 0.5rem; } .mt-1 { margin-top: 0.25rem; } .mt-2 { margin-top: 0.5rem; }
                            table { border-collapse: collapse; width: 100%; } th, td { vertical-align: top; padding: 2px 0; }
                            .text-2xl { font-size: 1.5rem; line-height: 2rem; } .text-sm { font-size: 0.875rem; } .text-xs { font-size: 0.75rem; } .break-all { word-break: break-all; }
                            .space-y-1 > * + * { margin-top: 0.25rem; }
                          </style></head><body>${content}</body></html>`);
                          doc.close();
                          setTimeout(() => { iframe.contentWindow?.focus(); iframe.contentWindow?.print(); setTimeout(() => document.body.removeChild(iframe), 1000); }, 250);
                        }
                      }}
                      className="w-1/2 flex items-center justify-center gap-2 px-3 py-2.5 bg-transparent text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400 rounded-lg font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition cursor-pointer"
                    >
                      <Printer className="size-4" /> Imprimir
                    </button>
                  </div>
                </div>

                {/* Vista previa del DTE simulando ticket térmico */}
                <div className="bg-gray-100 rounded-xl p-4 overflow-y-auto">
                  <div
                    id="dte-print-container"
                    className="bg-white p-4 w-full max-w-[320px] font-mono text-black text-xs shadow-md mx-auto leading-tight"
                  >
                    {/* Encabezado empresa */}
                    <div className="text-center mb-2">
                      <h1 className="text-2xl font-black uppercase">La Arada</h1>
                      <p>Chiquimula, Guatemala, C.A.</p>
                      <p>Tel: +502 12 34-5678</p>
                      <p className="mt-1 font-bold text-[10px]">CORPORACION CERMAD, S.A.</p>
                      <p className="text-[10px]">NIT: 11700682K</p>
                    </div>

                    <div className="border-t-2 border-dashed border-black"></div>

                    {/* Datos de autorización */}
                    <div>
                      <p className="text-center font-bold uppercase mt-1 mb-1">FACTURA ELECTRÓNICA</p>
                      <p><span className="font-bold">Serie:</span> {infileResult.serie}</p>
                      <p><span className="font-bold">Número:</span> {infileResult.numero}</p>
                      <p className="mt-1 flex items-baseline gap-1 leading-none flex-wrap">
                        <span className="font-bold uppercase text-[10px]">UUID:</span>
                        <span className="text-[10px] text-gray-700">{infileResult.uuid}</span>
                      </p>
                      <p className="mt-1"><span className="font-bold">Fecha:</span> {infileResult.fecha ? new Date(infileResult.fecha).toLocaleString("es-GT") : "-"}</p>
                    </div>

                    <div className="border-t-2 border-dashed border-black mt-1"></div>

                    {/* Datos receptor */}
                    <div className="mt-1 mb-1">
                      <p><span className="font-bold uppercase">Cliente:</span> {nombreReceptor.trim() || "CONSUMIDOR FINAL"}</p>
                      <p><span className="font-bold uppercase">NIT:</span> {nitReceptor.trim() || "CF"}</p>
                    </div>

                    <div className="border-t-2 border-dashed border-black"></div>

                    {/* Detalle de productos */}
                    <table className="w-full text-left mt-1 mb-1">
                      <thead>
                        <tr>
                          <th className="py-1 uppercase">Cant</th>
                          <th className="py-1 uppercase">Descripción</th>
                          <th className="py-1 text-right uppercase">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {venta?.ven_detalle?.map((item: any, idx: number) => (
                          <tr key={idx} className="align-top">
                            <td className="py-1">{item.cantidad} {item.inv_productos?.medida || ""}</td>
                            <td className="py-1 pr-1">
                              {item.inv_productos?.nombre}
                              <div className="text-[10px] text-gray-600">Q{item.precio_aplicado?.toFixed(2)} c/u</div>
                            </td>
                            <td className="py-1 text-right">Q{item.subtotal?.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="border-t-2 border-dashed border-black"></div>

                    {/* Totales */}
                    <div className="py-1">
                      {(() => {
                        const total = venta?.total ?? 0;
                        const gravable = parseFloat((total / 1.12).toFixed(2));
                        const iva = parseFloat((total - gravable).toFixed(2));
                        return (
                          <>
                            <div className="flex justify-between items-center text-[10px]">
                              <span>Base Gravable:</span>
                              <span>Q{gravable.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px]">
                              <span>IVA (12%):</span>
                              <span>Q{iva.toFixed(2)}</span>
                            </div>
                            <div className="border-t-2 border-dashed border-black mt-1 mb-1"></div>
                            <div className="flex justify-between items-center font-black text-sm">
                              <span>TOTAL:</span>
                              <span>Q{total.toFixed(2)}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>

                    <div className="border-t-2 border-dashed border-black"></div>

                    {/* Pie de página */}
                    <div className="text-center text-[10px] mt-2 space-y-1">
                      <p className="font-bold uppercase">CERTIFICADOR: INFILE, S.A.</p>
                      <p>NIT: 1252133-7</p>
                      <p className="mt-1">Documento Tributario Electrónico</p>
                      <p>Autorizado por SAT Guatemala</p>
                      {infileResult.alertas_infile && (
                        <p className="font-bold mt-2 uppercase">*** PRUEBAS ***<br/>No válido fiscalmente</p>
                      )}
                      <p className="mt-2">¡Gracias por su compra!</p>
                      <p><span className="font-bold uppercase">Vendedor:</span> {venta?.vendedor?.nombre || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Datos adicionales colapsados */}
                <div className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
                  {infileResult.alertas_infile && infileResult.descripcion_alertas_infile?.length ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                      <p className="text-xs font-bold text-amber-700 uppercase mb-1">⚠ Alerta INFILE</p>
                      {infileResult.descripcion_alertas_infile.map((a, i) => (
                        <p key={i} className="text-xs text-amber-700">{a}</p>
                      ))}
                    </div>
                  ) : null}
                  {venta?.dte_documentos?.find((d: any) => d.uuid_infile === infileResult?.uuid)?.estado === "anulado" ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-sm font-bold text-red-700 uppercase">Factura Anulada</p>
                      <p className="text-xs text-red-600 mt-1">Este documento fue invalidado y reportado a la SAT.</p>
                      <button
                        onClick={() => {
                          setInfileResult(null);
                          setVenta({
                            ...venta,
                            dte_documentos: venta.dte_documentos.filter((d: any) => d.estado !== "anulado")
                          });
                        }}
                        className="mt-3 w-full py-2 bg-white text-red-700 rounded-lg border border-red-200 text-sm font-bold hover:bg-red-100 transition shadow-sm cursor-pointer"
                      >
                        Generar Nueva Factura
                      </button>
                    </div>
                  ) : (
                    <>
                      <p className="text-center text-[10px] text-gray-500 italic mt-2">Este documento ya fue certificado en la SAT.</p>
                      {venta?.dte_documentos?.some((d: any) => d.estado === "certificado" && d.uuid_infile === infileResult?.uuid) && (
                        <>
                          {anularError && <p className="text-red-600 text-xs text-center mt-2 font-bold">{anularError}</p>}
                          <button
                            onClick={handleAnular}
                            disabled={anulando}
                            className="w-full mt-2 py-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 hover:bg-red-100 transition cursor-pointer font-bold disabled:opacity-50"
                          >
                            {anulando ? "Anulando..." : "Anular Factura"}
                          </button>
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            ) : (
              <>
                {/* Info de la venta */}
                {loading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="size-6 animate-spin text-gray-400" />
                  </div>
                ) : venta ? (
                  <>
                    <div className="bg-white rounded-xl border shadow-sm p-4 space-y-2">
                      <p className="text-xs font-bold text-gray-500 uppercase">Resumen de Venta</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Venta No.</span>
                        <span className="font-bold">{String(venta.numero_recibo).padStart(5, "0")}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Cliente</span>
                        <span className="font-bold">{venta.ven_clientes?.nombre || "—"}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Total</span>
                        <span className="font-bold text-emerald-700">Q{venta.total?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Productos</span>
                        <span className="font-bold">{venta.ven_detalle?.length ?? 0} línea(s)</span>
                      </div>
                    </div>

                    {/* Datos del receptor */}
                    <div className="bg-white rounded-xl border shadow-sm p-4 space-y-3 transition-all">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <p className="text-xs font-bold text-gray-500 uppercase">Facturar a:</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase transition-colors ${facturaCF ? 'text-emerald-600' : 'text-gray-400'}`}>C/F</span>
                          <button
                            type="button"
                            onClick={() => setFacturaCF(!facturaCF)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${!facturaCF ? 'bg-emerald-500' : 'bg-gray-300'}`}
                          >
                            <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${!facturaCF ? 'translate-x-[9px]' : '-translate-x-[9px]'}`} />
                          </button>
                          <span className={`text-[10px] font-bold uppercase transition-colors ${!facturaCF ? 'text-emerald-600' : 'text-gray-400'}`}>NIT</span>
                        </div>
                      </div>

                      {!facturaCF ? (
                        <div className="space-y-3 pt-2 animate-in slide-in-from-top-2 fade-in">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600">NIT del Receptor</label>
                            <input
                              type="text"
                              value={nitReceptor}
                              onChange={e => setNitReceptor(e.target.value)}
                              placeholder="Ej: 1234567-8"
                              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                            />
                            <p className="text-[10px] text-gray-400">Sin guiones o espacios es válido también.</p>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-600">Nombre del Receptor</label>
                            <input
                              type="text"
                              value={nombreReceptor}
                              onChange={e => setNombreReceptor(e.target.value)}
                              placeholder="Nombre completo o razón social"
                              className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="animate-in fade-in py-2">
                           <p className="text-xs text-center font-bold text-emerald-700 bg-emerald-50 rounded-lg p-2 uppercase">
                             Generando a Consumidor Final
                           </p>
                        </div>
                      )}

                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-bold text-gray-600">Correo electrónico <span className="text-gray-400 font-normal">(opcional)</span></label>
                        <input
                          type="email"
                          value={correoReceptor}
                          onChange={e => setCorreoReceptor(e.target.value)}
                          placeholder="Para envío de PDF por correo automático"
                          className="w-full border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-400 transition"
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {infileError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start text-sm text-red-700">
                        <AlertCircle className="size-4 shrink-0 mt-0.5" />
                        {infileError}
                      </div>
                    )}

                    {/* Botón certificar */}
                    <button
                      onClick={handleCertificar}
                      disabled={certificando}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 text-white font-bold text-sm hover:bg-emerald-700 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
                    >
                      {certificando ? (
                        <><Loader2 className="size-4 animate-spin" /> Certificando con INFILE...</>
                      ) : (
                        <><FileCheck2 className="size-4" /> Generar Factura Electrónica <ChevronRight className="size-4" /></>
                      )}
                    </button>

                    <p className="text-center text-[10px] text-gray-400">
                      La factura será certificada ante la SAT a través de INFILE S.A.
                    </p>
                  </>
                ) : (
                  <div className="text-center text-red-500 text-sm py-10">No se encontró la venta.</div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
