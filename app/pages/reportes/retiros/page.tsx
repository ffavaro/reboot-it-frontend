"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { retiroApi } from "@/lib/api"
import type { ReporteRetiro, ReporteRetiroQuery } from "@/lib/type/retiro"
import type { EstadoDonacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { formatDate, formatDateTime } from "@/lib/utils/helpers"

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

export default function ReporteRetirosPage() {
  const { donantes } = useDonantes()
  const { estadosDonacion } = useEstadosDonacion()
  const { transportistas } = useEmpleadosTransportistas()

  const [filters, setFilters] = useState<ReporteRetiroQuery>({})
  const [result, setResult] = useState<ReporteRetiro[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  async function handleGenerate() {
    setIsLoading(true)
    try {
      const data = await retiroApi.getReporte(filters)
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

  function transportistaNombre(t: EmpleadoTransportista) {
    return t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : `#${t.id}`
  }

  const filtroTransportistaNombre =
    filters.empleadoTransportistaId
      ? transportistas.find((t: EmpleadoTransportista) => t.id === filters.empleadoTransportistaId)
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
          .badge { border: 1px solid #ccc; padding: 1px 4px; border-radius: 4px; font-size: 10px; }
        }
        .print-show { display: none; }
      `}</style>

      <div className="flex flex-col gap-6 p-6">
        {/* Encabezado solo visible al imprimir */}
        <div className="print-show flex flex-col gap-1 mb-2">
          <h1 className="text-xl font-bold">Reporte de Retiros a Domicilio</h1>
          <p className="text-sm">
            Generado el{" "}
            {new Date().toLocaleDateString("es-AR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
            })}
            {filters.donanteId && donantes.find((d: Donante) => d.id === filters.donanteId)
              ? ` · Donante: ${donantes.find((d: Donante) => d.id === filters.donanteId)!.nombre}`
              : ""}
            {filtroTransportistaNombre
              ? ` · Transportista: ${transportistaNombre(filtroTransportistaNombre)}`
              : ""}
            {filters.estadoDonacionId &&
            estadosDonacion.find((e: EstadoDonacion) => e.id === filters.estadoDonacionId)
              ? ` · Estado: ${estadosDonacion.find((e: EstadoDonacion) => e.id === filters.estadoDonacionId)!.descripcion}`
              : ""}
            {filters.fechaDesde || filters.fechaHasta
              ? ` · Período: ${filters.fechaDesde ?? "inicio"} al ${filters.fechaHasta ?? "hoy"}`
              : ""}
          </p>
        </div>

        {/* Encabezado de pantalla */}
        <div className="flex flex-col gap-1 no-print">
          <h1 className="text-2xl font-bold tracking-tight">Reporte de Retiros a Domicilio</h1>
          <p className="text-sm text-muted-foreground">
            Listado de retiros realizados a domicilio: quién los realizó y para qué donante.
          </p>
        </div>

        {/* Panel de filtros */}
        <div className="no-print rounded-xl border p-4 bg-card flex flex-col gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Filtros
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Donante */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Donante</label>
              <select
                value={filters.donanteId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    donanteId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Todos los donantes</option>
                {donantes.map((d: Donante) => (
                  <option key={d.id} value={d.id}>
                    {d.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Transportista */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Transportista</label>
              <select
                value={filters.empleadoTransportistaId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    empleadoTransportistaId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Todos los transportistas</option>
                {transportistas.map((t: EmpleadoTransportista) => (
                  <option key={t.id} value={t.id}>
                    {transportistaNombre(t)}
                  </option>
                ))}
              </select>
            </div>

            {/* Estado de la donación */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Estado de la donación</label>
              <select
                value={filters.estadoDonacionId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    estadoDonacionId: e.target.value ? Number(e.target.value) : undefined,
                  }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Todos los estados</option>
                {estadosDonacion.map((e: EstadoDonacion) => (
                  <option key={e.id} value={e.id}>
                    {e.descripcion}
                  </option>
                ))}
              </select>
            </div>

            {/* Fecha desde */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de inicio desde</label>
              <Input
                type="date"
                value={filters.fechaDesde ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, fechaDesde: e.target.value || undefined }))
                }
              />
            </div>

            {/* Fecha hasta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de inicio hasta</label>
              <Input
                type="date"
                value={filters.fechaHasta ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, fechaHasta: e.target.value || undefined }))
                }
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
                {result.length} retiro{result.length !== 1 ? "s" : ""} encontrado
                {result.length !== 1 ? "s" : ""}
              </span>
              <Button
                variant="outline"
                onClick={() => window.print()}
                disabled={result.length === 0}
              >
                Imprimir / Exportar PDF
              </Button>
            </div>

            {result.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12 no-print">
                No se encontraron retiros con los filtros seleccionados.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm report-table">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">#</th>
                      <th className="p-3 text-left font-medium">Donante</th>
                      <th className="p-3 text-left font-medium">Donación</th>
                      <th className="p-3 text-left font-medium">Estado donación</th>
                      <th className="p-3 text-left font-medium">Transportista</th>
                      <th className="p-3 text-left font-medium">Vehículo</th>
                      <th className="p-3 text-left font-medium">Dirección</th>
                      <th className="p-3 text-left font-medium">Fecha inicio</th>
                      <th className="p-3 text-left font-medium">Fecha retiro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-muted/30">
                        {/* ID */}
                        <td className="p-3 font-mono text-xs text-muted-foreground">#{r.id}</td>

                        {/* Donante */}
                        <td className="p-3 font-medium">
                          {r.donacion?.donante?.nombre ?? `Donante #${r.donacion?.donanteId ?? "—"}`}
                        </td>

                        {/* Donación */}
                        <td className="p-3 font-mono text-xs text-muted-foreground">
                          #{r.donacionId}
                          {r.donacion?.descripcion && (
                            <p className="font-sans font-normal text-muted-foreground mt-0.5 max-w-35 truncate">
                              {r.donacion.descripcion}
                            </p>
                          )}
                        </td>

                        {/* Estado donación */}
                        <td className="p-3">
                          {r.donacion?.estadoDonacion?.descripcion ? (
                            <span className="badge inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                              {r.donacion.estadoDonacion.descripcion}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Transportista */}
                        <td className="p-3">
                          {r.empleadoTransportista?.empleado ? (
                            <span className="font-medium text-xs">
                              {r.empleadoTransportista.empleado.nombre}{" "}
                              {r.empleadoTransportista.empleado.apellido}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Vehículo */}
                        <td className="p-3">
                          {r.vehiculo ? (
                            <div className="text-xs">
                              <span className="font-mono font-medium">{r.vehiculo.patente}</span>
                              {(r.vehiculo.marca || r.vehiculo.modelo) && (
                                <p className="text-muted-foreground">
                                  {[r.vehiculo.marca, r.vehiculo.modelo].filter(Boolean).join(" ")}
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Dirección */}
                        <td className="p-3 text-xs text-muted-foreground max-w-40">
                          {r.direccion ?? (
                            <span className="italic">—</span>
                          )}
                        </td>

                        {/* Fecha inicio */}
                        <td className="p-3 text-xs text-muted-foreground whitespace-nowrap">
                          {r.fechaInicio ? (
                            formatDateTime(r.fechaInicio)
                          ) : (
                            <span className="italic">—</span>
                          )}
                        </td>

                        {/* Fecha retiro efectivo */}
                        <td className="p-3 text-xs whitespace-nowrap">
                          {r.fechaRetiro ? (
                            <span className="text-green-600 font-medium">
                              {formatDate(r.fechaRetiro)}
                            </span>
                          ) : (
                            <span className="italic text-amber-600 text-xs">Pendiente</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pie de página solo al imprimir */}
            <div className="print-show mt-4 pt-2 border-t text-xs text-gray-500">
              Total: {result.length} retiro{result.length !== 1 ? "s" : ""}
            </div>
          </>
        )}
      </div>
    </>
  )
}
