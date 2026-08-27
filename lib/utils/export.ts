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
  options: { fileName: string; title?: string }
) {
  const doc = new jsPDF()

  if (options.title) {
    doc.setFontSize(14)
    doc.text(options.title, 14, 15)
  }

  autoTable(doc, {
    startY: options.title ? 22 : 14,
    head: [columns.map((c) => c.header)],
    body: rows.map((row) => columns.map((c) => c.accessor(row))),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [55, 138, 221] },
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
