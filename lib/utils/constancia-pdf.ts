import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { ConstanciaRetiroDatos } from "@/lib/type/hoja-ruta"

function fecha(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

function fechaHora(iso: string | null): string {
  if (!iso) return "—"
  return new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) + " hs"
}

/** Genera y descarga el PDF de la constancia de retiro. Se arma al momento de descargar, no se guarda en el servidor. */
export function descargarConstanciaPdf(c: ConstanciaRetiroDatos) {
  const doc = new jsPDF()
  const ancho = doc.internal.pageSize.getWidth()
  const nroConstancia = String(c.constanciaId).padStart(6, "0")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Constancia de retiro", ancho / 2, 22, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100)
  doc.text("RebootIT", ancho / 2, 29, { align: "center" })
  doc.setTextColor(0)
  doc.text(`N° ${nroConstancia}`, 14, 40)
  doc.text(`Fecha de emisión: ${fecha(c.fechaEmision)}`, ancho - 14, 40, { align: "right" })

  const transportista = c.transportista ? `${c.transportista.nombre} ${c.transportista.apellido}` : "—"
  const filas: [string, string][] = [
    ["Donante", c.donante.nombre || "—"],
    ["Teléfono del donante", c.donante.telefono || "—"],
    ["Dirección de retiro", c.direccion || "—"],
    ["Fecha y hora del retiro", fechaHora(c.fechaRetiro)],
    ["Donación N°", c.donacionId != null ? String(c.donacionId) : "—"],
    ["Turno N°", c.turnoId != null ? String(c.turnoId) : "—"],
    ["Transportista", transportista],
    ["CUIT / DNI del transportista", c.transportista?.cuitDni || "—"],
    ["Vehículo", c.vehiculo ? `${c.vehiculo.patente} — ${c.vehiculo.marca} ${c.vehiculo.modelo}` : "—"],
    ["Peso estimado", c.pesoEstimadoKg != null ? `${Number(c.pesoEstimadoKg)} kg` : "—"],
  ]
  autoTable(doc, {
    startY: 46,
    body: filas,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 62, fillColor: [243, 244, 246] } },
  })

  const yTabla = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Materiales retirados", 14, yTabla)
  autoTable(doc, {
    startY: yTabla + 3,
    head: [["Tipo de material", "Cantidad"]],
    body: c.materiales.length
      ? c.materiales.map((m) => [m.tipo, m.cantidad != null ? String(m.cantidad) : "—"])
      : [["Sin materiales cargados", "—"]],
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 10 },
    columnStyles: { 1: { halign: "right", cellWidth: 35 } },
  })

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (c.observaciones) {
    doc.setFont("helvetica", "bold")
    doc.text("Observaciones", 14, y)
    doc.setFont("helvetica", "normal")
    const lineas = doc.splitTextToSize(c.observaciones, ancho - 28)
    doc.text(lineas, 14, y + 6)
    y += 6 + lineas.length * 5 + 6
  }

  // Firmas
  const base = Math.max(y + 24, 240)
  doc.setDrawColor(120)
  doc.line(20, base, 90, base)
  doc.line(ancho - 90, base, ancho - 20, base)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Firma del transportista", 55, base + 5, { align: "center" })
  doc.text("Firma del donante", ancho - 55, base + 5, { align: "center" })

  doc.save(`constancia-retiro-${nroConstancia}.pdf`)
}
