"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEstadosProcesoDestruccion } from "@/hooks/use-estado-proceso-destruccion"
import { useMetodosDestruccion } from "@/hooks/use-metodo-destruccion"
import { useEmpleadosFull } from "@/hooks/use-employees"
import { procesoDestruccionApi } from "@/lib/api"
import type { ProcesoDestruccion, ReporteProcesoDestruccionQuery } from "@/lib/type/proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import type { Empleado } from "@/lib/type/user"
import { formatDate } from "@/lib/utils/helpers"

const ESTADO_COLOR: Record<string, string> = {
  Iniciado: "bg-blue-100 text-blue-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  Finalizado: "bg-green-100 text-green-700",
}

export default function ReporteProcesoDestruccionPage() {
  const { estados } = useEstadosProcesoDestruccion()
  const { metodos } = useMetodosDestruccion()
  const { empleados } = useEmpleadosFull()

  const [filters, setFilters] = useState<ReporteProcesoDestruccionQuery>({})
  const [result, setResult] = useState<ProcesoDestruccion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  async function handleGenerate() {
    setIsLoading(true)
    try {
      const data = await procesoDestruccionApi.getReporte(filters)
      setResult(data)
      setHasGenerated(true)
    } catch {
      toast.error("Error al generar el reporte")
    } finally {
      setIsLoading(false)
    }
  }

  function handleLimpiar() {
    setFilters({})
    setResult([])
    setHasGenerated(false)
  }

  const estadoLabel = filters.estadoId
    ? estados.find((e: EstadoProcesoDestruccion) => e.id === filters.estadoId)?.nombre
    : null

  const metodoLabel = filters.metodoDestruccionId
    ? metodos.find((m: MetodoDestruccion) => m.id === filters.metodoDestruccionId)?.nombre
    : null

  const empleadoLabel = filters.empleadoId
    ? empleados.find((e: Empleado) => e.id === filters.empleadoId)
    : null

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-show { display: block !important; }
          body { font-size: 11px; color: #000; }
          .report-table { width: 100%; border-collapse: collapse; }
          .report-table th,
          .report-table td { border: 1px solid #aaa; padding: 4px 6px; text-align: left; }
          .report-table th { background-color: #eee !important; font-weight: 600; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .report-table tr:nth-child(even) td { background-color: #f9f9f9 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .badge { border: 1px solid #ccc; padding: 1px 5px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        }
        .print-show { display: none; }
      `}</style>

      <div className="flex flex-col gap-6 p-6">
        {/* Encabezado solo al imprimir */}
        <div className="print-show flex flex-col gap-1 mb-2">
          <h1 className="text-xl font-bold">Reporte de Procesos de Destrucción</h1>
          <p className="text-sm">
            Generado el{" "}
            {new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            {estadoLabel ? ` · Estado: ${estadoLabel}` : ""}
            {metodoLabel ? ` · Método: ${metodoLabel}` : ""}
            {empleadoLabel ? ` · Empleado: ${empleadoLabel.nombre} ${empleadoLabel.apellido}` : ""}
            {filters.fechaDesde || filters.fechaHasta
              ? ` · Período: ${filters.fechaDesde ?? "inicio"} al ${filters.fechaHasta ?? "hoy"}`
              : ""}
          </p>
        </div>

        {/* Encabezado de pantalla */}
        <div className="flex flex-col gap-1 no-print">
          <h1 className="text-2xl font-bold tracking-tight">Reporte de Procesos de Destrucción</h1>
          <p className="text-sm text-muted-foreground">
            Filtrá y generá un reporte imprimible de procesos de destrucción.
          </p>
        </div>

        {/* Filtros */}
        <div className="no-print rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Estado del proceso</label>
              <Select
                value={filters.estadoId ? String(filters.estadoId) : ""}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, estadoId: v ? Number(v) : undefined }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {estados.map((e: EstadoProcesoDestruccion) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Método */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Método de destrucción</label>
              <Select
                value={filters.metodoDestruccionId ? String(filters.metodoDestruccionId) : ""}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, metodoDestruccionId: v ? Number(v) : undefined }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los métodos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los métodos</SelectItem>
                  {metodos.map((m: MetodoDestruccion) => (
                    <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Empleado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Empleado responsable</label>
              <Select
                value={filters.empleadoId ? String(filters.empleadoId) : ""}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, empleadoId: v ? Number(v) : undefined }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los empleados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los empleados</SelectItem>
                  {empleados.map((e: Empleado) => (
                    <SelectItem key={e.id} value={String(e.id)}>{e.nombre} {e.apellido}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha desde */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de proceso desde</label>
              <Input
                type="date"
                value={filters.fechaDesde ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value || undefined }))}
              />
            </div>

            {/* Fecha hasta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de proceso hasta</label>
              <Input
                type="date"
                value={filters.fechaHasta ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, fechaHasta: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button onClick={handleGenerate} disabled={isLoading}>
              {isLoading ? "Generando..." : "Generar reporte"}
            </Button>
            <Button variant="outline" onClick={handleLimpiar} disabled={isLoading}>
              Limpiar filtros
            </Button>
          </div>
        </div>

        {/* Resultados */}
        {hasGenerated && (
          <>
            <div className="flex items-center justify-between no-print">
              <span className="text-sm text-muted-foreground">
                {result.length} proceso{result.length !== 1 ? "s" : ""} encontrado{result.length !== 1 ? "s" : ""}
              </span>
              <Button variant="outline" onClick={() => window.print()} disabled={result.length === 0}>
                Imprimir / Exportar PDF
              </Button>
            </div>

            {result.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12 no-print">
                No se encontraron procesos con los filtros seleccionados.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-foreground/5">
                <table className="w-full text-sm report-table">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/60">
                      <th className="p-3 text-left font-medium">#</th>
                      <th className="p-3 text-left font-medium">Medio de almacenamiento</th>
                      <th className="p-3 text-left font-medium">Tipo de material</th>
                      <th className="p-3 text-left font-medium">Método</th>
                      <th className="p-3 text-left font-medium">Estado</th>
                      <th className="p-3 text-left font-medium">Empleado responsable</th>
                      <th className="p-3 text-left font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((p) => (
                      <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                        {/* ID */}
                        <td className="p-3 font-mono text-xs text-muted-foreground">#{p.id}</td>

                        {/* Medio */}
                        <td className="p-3">
                          <span className="font-mono text-xs text-muted-foreground">
                            #{p.medioAlmacenamientoId}
                          </span>
                          {p.medioAlmacenamiento?.material?.descripcion && (
                            <p className="text-xs text-muted-foreground mt-0.5 max-w-40 truncate">
                              {p.medioAlmacenamiento.material.descripcion}
                            </p>
                          )}
                        </td>

                        {/* Tipo de material */}
                        <td className="p-3 text-xs">
                          {p.medioAlmacenamiento?.material?.tipoMaterial?.nombre ?? (
                            <span className="italic text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Método */}
                        <td className="p-3 text-xs">
                          {p.metodoDestruccion?.nombre ?? (
                            <span className="italic text-muted-foreground">Sin método</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="p-3">
                          {p.estado ? (
                            <span
                              className={`badge inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_COLOR[p.estado.nombre] ?? "bg-muted text-foreground"}`}
                            >
                              {p.estado.nombre}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Empleado */}
                        <td className="p-3 text-xs">
                          {p.empleado ? (
                            `${p.empleado.nombre} ${p.empleado.apellido}`
                          ) : (
                            <span className="italic text-muted-foreground">Sin asignar</span>
                          )}
                        </td>

                        {/* Fecha */}
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {p.fecha ? formatDate(p.fecha) : <span className="italic">—</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="print-show mt-4 pt-2 border-t text-xs text-gray-500">
              Total: {result.length} proceso{result.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </>
  )
}
