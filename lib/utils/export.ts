import { jsPDF } from "jspdf"
import autoTable from "jspdf-autotable"
import * as XLSX from "xlsx"

export type ExportColumn<T> = {
  header: string
  accessor: (row: T) => string | number
}

export function exportToPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  options: { fileName: string; title?: string; subtitle?: string; orientation?: "portrait" | "landscape" }
) {
  const doc = new jsPDF({ orientation: options.orientation ?? "portrait" })
  let y = 14

  if (options.title) {
    doc.setFontSize(14)
    doc.text(options.title, 14, 15)
    y = 22
  }
  if (options.subtitle) {
    doc.setFontSize(9)
    doc.setTextColor(110)
    doc.text(options.subtitle, 14, y)
    doc.setTextColor(0)
    y += 6
  }
  doc.setFontSize(9)
  doc.setTextColor(110)
  doc.text(`Generado el ${new Date().toLocaleString("es-AR")} · ${rows.length} registro${rows.length !== 1 ? "s" : ""}`, 14, y)
  doc.setTextColor(0)

  autoTable(doc, {
    startY: y + 4,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => c.accessor(row))),
    styles: { fontSize: 8, cellPadding: 1.8 },
    headStyles: { fillColor: [55, 138, 221] },
    // en cada página queda numerada y con el encabezado de la tabla
    didDrawPage: () => {
      const pagina = doc.getNumberOfPages()
      doc.setFontSize(8)
      doc.setTextColor(110)
      doc.text(`Página ${pagina}`, doc.internal.pageSize.getWidth() - 14, doc.internal.pageSize.getHeight() - 8, { align: "right" })
      doc.setTextColor(0)
    },
  })

  doc.save(`${options.fileName}.pdf`)
}

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  options: { fileName: string; sheetName?: string }
) {
  const data = rows.map((row) => {
    const record: Record<string, string | number> = {}
    columns.forEach((c) => {
      record[c.header] = c.accessor(row)
    })
    return record
  })

  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName ?? "Datos")
  XLSX.writeFile(workbook, `${options.fileName}.xlsx`)
}
