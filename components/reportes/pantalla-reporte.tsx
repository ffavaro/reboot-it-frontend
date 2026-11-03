"use client"

import { useState } from "react"
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { DateInput } from "@/components/ui/date-input"
import { descargarReporteExcel, descargarReportePdf, type ArchivoReporte } from "@/lib/documentos/reporte"
import { describirPeriodo, periodoInvalido, periodoUltimoMes, type Periodo } from "@/lib/utils/helpers"

export interface ColumnaReporte<T> {
  encabezado: string
  celda: (fila: T) => React.ReactNode
  exportar: (fila: T) => string | number
  clase?: string
}

interface PantallaReporteProps<T extends { id: number }, F extends Periodo> {
  titulo: string
  descripcion: string
  archivo: string
  unidad: [singular: string, plural: string]
  filtrosBase: Omit<F, keyof Periodo>
  consultar: (filtros: F) => Promise<T[]>
  columnas: ColumnaReporte<T>[]
  resumir: (filtros: F) => Array<string | null>
  children: (filtros: F, cambiar: (parcial: Partial<F>) => void) => React.ReactNode
}

type Exportando = "pdf" | "excel" | null

export function PantallaReporte<T extends { id: number }, F extends Periodo>({
  titulo,
  descripcion,
  archivo,
  unidad,
  filtrosBase,
  consultar,
  columnas,
  resumir,
  children,
}: PantallaReporteProps<T, F>) {
  const iniciales = () => ({ ...filtrosBase, ...periodoUltimoMes() }) as F
  const [filtros, setFiltros] = useState<F>(iniciales)
  const [filas, setFilas] = useState<T[] | null>(null)
  const [consultando, setConsultando] = useState(false)
  const [exportando, setExportando] = useState<Exportando>(null)
  const [aplicados, setAplicados] = useState<F | null>(null)

  const cambiar = (parcial: Partial<F>) => setFiltros((f) => ({ ...f, ...parcial }))

  async function generar() {
    if (periodoInvalido(filtros)) {
      toast.error("La Fecha Desde no puede ser posterior a la Fecha Hasta")
      return
    }
    setConsultando(true)
    try {
      setFilas(await consultar(filtros))
      setAplicados(filtros)
    } catch {
      toast.error("No se pudo generar el reporte")
    } finally {
      setConsultando(false)
    }
  }

  function restablecer() {
    setFiltros(iniciales())
    setFilas(null)
    setAplicados(null)
  }

  async function exportar(formato: "pdf" | "excel") {
    if (!filas?.length || !aplicados) return
    const contenido: ArchivoReporte<T> = {
      titulo,
      nombre: archivo,
      filas,
      columnas: columnas.map((c) => ({ titulo: c.encabezado, valor: c.exportar })),
      detalle: [describirPeriodo(aplicados), ...resumir(aplicados).filter((l): l is string => !!l)],
    }
    setExportando(formato)
    try {
      if (formato === "pdf") await descargarReportePdf(contenido)
      else descargarReporteExcel(contenido)
    } catch {
      toast.error("No se pudo descargar el archivo")
    } finally {
      setExportando(null)
    }
  }

  const cantidad = filas?.length ?? 0

  return (
    <div className="flex flex-col gap-6 p-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
        <p className="text-sm text-muted-foreground">{descripcion}</p>
      </header>

      <section className="flex flex-col gap-4 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Filtros</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {children(filtros, cambiar)}
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Fecha Desde</span>
            <DateInput value={filtros.fechaDesde ?? ""} onChange={(v) => cambiar({ fechaDesde: v || undefined } as Partial<F>)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium">Fecha Hasta</span>
            <DateInput value={filtros.fechaHasta ?? ""} onChange={(v) => cambiar({ fechaHasta: v || undefined } as Partial<F>)} />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={generar} disabled={consultando}>
            {consultando && <Loader2 className="h-4 w-4 animate-spin" />}
            {consultando ? "Generando..." : "Generar reporte"}
          </Button>
          <Button variant="outline" onClick={restablecer} disabled={consultando}>
            Limpiar filtros
          </Button>
          <span className="text-xs text-muted-foreground">Por defecto se consulta el último mes.</span>
        </div>
      </section>

      {filas && (
        <section className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">
              {cantidad} {cantidad === 1 ? unidad[0] : unidad[1]}
            </span>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!cantidad || exportando !== null} onClick={() => exportar("pdf")}>
                {exportando === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
                Descargar PDF
              </Button>
              <Button variant="outline" disabled={!cantidad || exportando !== null} onClick={() => exportar("excel")}>
                {exportando === "excel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
                Descargar Excel
              </Button>
            </div>
          </div>

          {cantidad === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No hay {unidad[1]} para los filtros elegidos.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-foreground/5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/60">
                    {columnas.map((c) => (
                      <th key={c.encabezado} className="p-3 text-left font-medium">
                        {c.encabezado}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filas.map((fila) => (
                    <tr key={fila.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                      {columnas.map((c) => (
                        <td key={c.encabezado} className={c.clase ?? "p-3 text-xs"}>
                          {c.celda(fila)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export const SinDato = ({ texto = "—" }: { texto?: string }) => (
  <span className="text-xs italic text-muted-foreground">{texto}</span>
)
