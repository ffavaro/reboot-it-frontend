import * as XLSX from "xlsx"
import { DocumentoPdf } from "./pdf"
import { diaYHora, hoyIso } from "./formato"

export interface ColumnaArchivo<T> {
  titulo: string
  valor: (fila: T) => string | number
}

export interface ArchivoReporte<T> {
  titulo: string
  nombre: string
  filas: T[]
  columnas: ColumnaArchivo<T>[]
  detalle: string[]
}

const nombreConFecha = (nombre: string) => `${nombre}-${hoyIso()}`

const matriz = <T,>({ filas, columnas }: ArchivoReporte<T>) =>
  filas.map((fila) => columnas.map((c) => c.valor(fila)))

export async function descargarReportePdf<T>(reporte: ArchivoReporte<T>) {
  const pdf = await DocumentoPdf.crear("landscape")
  const generado = diaYHora(new Date().toISOString())
  const cantidad = `${reporte.filas.length} ${reporte.filas.length === 1 ? "registro" : "registros"}`

  pdf.titulo(reporte.titulo)
  reporte.detalle.forEach((linea) => pdf.nota(linea))
  pdf.nota(`Generado el ${generado} · ${cantidad}`)
  pdf.listado(reporte.columnas.map((c) => c.titulo), matriz(reporte))
  pdf.guardar(nombreConFecha(reporte.nombre))
}

export function descargarReporteExcel<T>(reporte: ArchivoReporte<T>) {
  const hoja = XLSX.utils.aoa_to_sheet([reporte.columnas.map((c) => c.titulo), ...matriz(reporte)])
  hoja["!cols"] = reporte.columnas.map((c, i) => {
    const largos = [c.titulo, ...reporte.filas.map((f) => String(reporte.columnas[i].valor(f)))].map((v) => v.length)
    return { wch: Math.min(Math.max(...largos) + 2, 60) }
  })
  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, reporte.titulo.replace(/[\\/?*[\]:]/g, "").slice(0, 31))
  XLSX.writeFile(libro, `${nombreConFecha(reporte.nombre)}.xlsx`)
}
