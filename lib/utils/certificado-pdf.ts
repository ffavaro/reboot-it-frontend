import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import type { CertificadoDisposicionDatos } from "@/lib/type/certificado-disposicion"

function fecha(iso: string | null): string {
  if (!iso) return "—"
  // la fecha de emisión llega como yyyy-MM-dd: se arma sin pasar por la zona horaria
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : new Date(iso).toLocaleDateString("es-AR")
}

/** Genera y descarga el PDF del certificado de disposición final emitido por RebootIT. Se arma al descargar. */
export function descargarCertificadoPdf(c: CertificadoDisposicionDatos) {
  const doc = new jsPDF()
  const ancho = doc.internal.pageSize.getWidth()
  const numero = c.numeroCertificado ?? String(c.certificadoId).padStart(6, "0")

  doc.setFont("helvetica", "bold")
  doc.setFontSize(18)
  doc.text("Certificado de disposición final", ancho / 2, 22, { align: "center" })
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100)
  doc.text("RebootIT", ancho / 2, 29, { align: "center" })
  doc.setTextColor(0)
  doc.text(`N° ${numero}`, 14, 40)
  doc.text(`Fecha de emisión: ${fecha(c.fechaEmision)}`, ancho - 14, 40, { align: "right" })

  const donante = c.donante.razonSocial ? `${c.donante.nombre} (${c.donante.razonSocial})` : c.donante.nombre
  const texto = doc.splitTextToSize(
    `RebootIT certifica que los materiales detallados a continuación, recibidos del donante ${donante || "—"} en el marco de la donación N° ${c.donacionId ?? "—"}, fueron clasificados y entregados para su disposición final al gestor ambiental indicado.`,
    ancho - 28,
  )
  doc.text(texto, 14, 50)

  const filas: [string, string][] = [
    ["Donante", donante || "—"],
    ["Dirección del donante", c.donante.direccion || "—"],
    ["Teléfono del donante", c.donante.telefono || "—"],
    ["Donación N°", c.donacionId != null ? String(c.donacionId) : "—"],
    ["Lote N°", String(c.loteId)],
    ["Peso bruto del lote", c.pesoBrutoKg != null ? `${Number(c.pesoBrutoKg)} kg` : "—"],
    ["Gestor ambiental", c.gestor?.razonSocial || "—"],
    ["CUIT del gestor", c.gestor?.cuit || "—"],
    ["Habilitación del gestor", c.gestor?.habilitacion || "—"],
    ["Contacto del gestor", c.gestor?.contacto || "—"],
  ]
  autoTable(doc, {
    startY: 50 + texto.length * 5 + 4,
    body: filas,
    theme: "grid",
    styles: { fontSize: 10, cellPadding: 2.5 },
    columnStyles: { 0: { fontStyle: "bold", cellWidth: 62, fillColor: [243, 244, 246] } },
  })

  const yTabla = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  doc.setFont("helvetica", "bold")
  doc.setFontSize(11)
  doc.text("Materiales", 14, yTabla)
  autoTable(doc, {
    startY: yTabla + 3,
    head: [["Tipo de material", "Condición", "Cantidad"]],
    body: c.materiales.length
      ? c.materiales.map((m) => [m.tipo, m.condicion, String(m.cantidad)])
      : [["Sin materiales registrados en el lote", "—", "—"]],
    theme: "striped",
    headStyles: { fillColor: [30, 41, 59] },
    styles: { fontSize: 10 },
    columnStyles: { 2: { halign: "right", cellWidth: 30 } },
  })

  let y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8
  if (c.terminosCondiciones) {
    doc.setFont("helvetica", "bold")
    doc.text("Términos y condiciones", 14, y)
    doc.setFont("helvetica", "normal")
    const lineas = doc.splitTextToSize(c.terminosCondiciones, ancho - 28)
    doc.text(lineas, 14, y + 6)
    y += 6 + lineas.length * 5 + 6
  }

  const base = Math.max(y + 24, 245)
  doc.setDrawColor(120)
  doc.line(20, base, 90, base)
  doc.line(ancho - 90, base, ancho - 20, base)
  doc.setFont("helvetica", "normal")
  doc.setFontSize(9)
  doc.text("Firma y sello - RebootIT", 55, base + 5, { align: "center" })
  doc.text("Firma y sello - Gestor ambiental", ancho - 55, base + 5, { align: "center" })

  doc.save(`certificado-disposicion-${numero}.pdf`)
}
