"use client"

import { FileDown, FileSpreadsheet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportToExcel, exportToPdf, type ExportColumn } from "@/lib/utils/export"
import { todayISO } from "@/lib/utils/helpers"

/**
 * Botones de los reportes: descargan el resultado como PDF y como Excel. Los dos archivos se arman con los datos del reporte
 * (no son una captura de la pantalla), con las mismas columnas.
 */
export function ExportarReporte<T>({
  filas, columnas, nombreArchivo, titulo, periodo,
}: {
  filas: T[]
  columnas: ExportColumn<T>[]
  nombreArchivo: string
  titulo: string
  periodo?: string
}) {
  const archivo = `${nombreArchivo}-${todayISO()}`
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" disabled={filas.length === 0} onClick={() => exportToPdf(filas, columnas, { fileName: archivo, title: titulo, subtitle: periodo, orientation: "landscape" })}>
        <FileDown className="h-4 w-4" />
        Descargar PDF
      </Button>
      <Button variant="outline" disabled={filas.length === 0} onClick={() => exportToExcel(filas, columnas, { fileName: archivo, sheetName: titulo.slice(0, 31) })}>
        <FileSpreadsheet className="h-4 w-4" />
        Descargar Excel
      </Button>
    </div>
  )
}

/** "Período: 01/05/2026 al 24/10/2026" para el encabezado del PDF. */
export function periodoTexto(desde?: string, hasta?: string) {
  const f = (iso?: string, vacio = "") => (iso ? iso.slice(0, 10).split("-").reverse().join("/") : vacio)
  return `Período: ${f(desde, "inicio")} al ${f(hasta, "hoy")}`
}
