"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useDonantes } from "@/hooks/use-donantes"
import { useEstadosDonacion } from "@/hooks/use-estado-donacion"
import { donacionApi } from "@/lib/api"
import type { ReporteDonacion, ReporteDonacionQuery, EstadoDonacion } from "@/lib/type/donacion"
import type { Donante } from "@/lib/type/donante"
import { formatDate, formatDateTime } from "@/lib/utils/helpers"

export default function ReporteDonacionPage() {
  const { donantes } = useDonantes()
  const { estadosDonacion } = useEstadosDonacion()

  const [filters, setFilters] = useState<ReporteDonacionQuery>({})
  const [result, setResult] = useState<ReporteDonacion[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  async function handleGenerate() {
    setIsLoading(true)
    try {
      const data = await donacionApi.getReporte(filters)
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
          .tag-retiro { color: #b45309 !important; }
          .tag-sucursal { color: #15803d !important; }
        }
        .print-show { display: none; }
      `}</style>

      <div className="flex flex-col gap-6 p-6">
        {/* Encabezado solo visible al imprimir */}
        <div className="print-show flex flex-col gap-1 mb-2">
          <h1 className="text-xl font-bold">Reporte de Donaciones</h1>
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
            {filters.estadoDonacionId &&
            estadosDonacion.find((e: EstadoDonacion) => e.id === filters.estadoDonacionId)
              ? ` · Estado: ${estadosDonacion.find((e: EstadoDonacion) => e.id === filters.estadoDonacionId)!.descripcion}`
              : ""}
            {filters.necesitaRetiro !== undefined
              ? ` · Entrega: ${filters.necesitaRetiro ? "Retiro a domicilio" : "En sucursal"}`
              : ""}
            {filters.fechaDesde || filters.fechaHasta
              ? ` · Período: ${filters.fechaDesde ?? "inicio"} al ${filters.fechaHasta ?? "hoy"}`
              : ""}
          </p>
        </div>

        {/* Encabezado de pantalla */}
        <div className="flex flex-col gap-1 no-print">
          <h1 className="text-2xl font-bold tracking-tight">Reporte de Donaciones</h1>
          <p className="text-sm text-muted-foreground">
            Aplicá filtros y generá un reporte imprimible.
          </p>
        </div>

        {/* Panel de filtros */}
        <div className="no-print rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4 flex flex-col gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Filtros
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Donante */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Donante</label>
              <Select
                value={filters.donanteId ? String(filters.donanteId) : ""}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, donanteId: v ? Number(v) : undefined }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los donantes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los donantes</SelectItem>
                  {donantes.map((d: Donante) => (
                    <SelectItem key={d.id} value={String(d.id)}>
                      {d.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Estado */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Estado de donación</label>
              <Select
                value={filters.estadoDonacionId ? String(filters.estadoDonacionId) : ""}
                onValueChange={(v) =>
                  setFilters((f) => ({ ...f, estadoDonacionId: v ? Number(v) : undefined }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos los estados</SelectItem>
                  {estadosDonacion.map((e: EstadoDonacion) => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.descripcion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Modalidad de entrega */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Modalidad de entrega</label>
              <Select
                value={filters.necesitaRetiro === undefined ? "" : String(filters.necesitaRetiro)}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    necesitaRetiro: v === "" ? undefined : v === "true",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="true">Retiro a domicilio</SelectItem>
                  <SelectItem value="false">En sucursal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Medios de almacenamiento */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Medios de almacenamiento</label>
              <Select
                value={filters.tieneMateriales === undefined ? "" : String(filters.tieneMateriales)}
                onValueChange={(v) =>
                  setFilters((f) => ({
                    ...f,
                    tieneMateriales: v === "" ? undefined : v === "true",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas</SelectItem>
                  <SelectItem value="true">Con materiales registrados</SelectItem>
                  <SelectItem value="false">Sin materiales registrados</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fecha desde */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de registro desde</label>
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
              <label className="text-sm font-medium">Fecha de registro hasta</label>
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
                {result.length} donación{result.length !== 1 ? "es" : ""} encontrada
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
                No se encontraron donaciones con los filtros seleccionados.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl bg-card shadow-sm ring-1 ring-foreground/5">
                <table className="w-full text-sm report-table">
                  <thead>
                    <tr className="border-b border-border/60 bg-muted/60">
                      <th className="p-3 text-left font-medium">#</th>
                      <th className="p-3 text-left font-medium">Donante</th>
                      <th className="p-3 text-left font-medium">Estado</th>
                      <th className="p-3 text-left font-medium">Turno</th>
                      <th className="p-3 text-left font-medium">Entrega</th>
                      <th className="p-3 text-left font-medium">Materiales</th>
                      <th className="p-3 text-left font-medium">Retiro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((d) => (
                      <tr key={d.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                        {/* ID */}
                        <td className="p-3 font-mono text-xs text-muted-foreground">#{d.id}</td>

                        {/* Donante */}
                        <td className="p-3 font-medium">
                          {d.donante?.nombre ?? `Donante #${d.donanteId}`}
                        </td>

                        {/* Estado */}
                        <td className="p-3">
                          {d.estadoDonacion?.descripcion ? (
                            <span className="badge inline-block rounded-full px-2 py-0.5 text-xs font-medium bg-muted">
                              {d.estadoDonacion.descripcion}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Turno */}
                        <td className="p-3 text-muted-foreground text-xs">
                          {d.turno ? (
                            formatDateTime(d.turno.fechaHora)
                          ) : (
                            <span className="italic">—</span>
                          )}
                        </td>

                        {/* Entrega */}
                        <td className="p-3">
                          {d.necesitaRetiro ? (
                            <div className="text-xs space-y-0.5">
                              <span className="tag-retiro text-amber-600 font-medium">
                                Retiro a domicilio
                              </span>
                              {d.direccionRetiro ? (
                                <p className="text-muted-foreground">
                                  Otra dirección: {d.direccionRetiro}
                                </p>
                              ) : (
                                <p className="text-muted-foreground italic">
                                  Dirección registrada del donante
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="tag-sucursal text-green-600 font-medium text-xs">
                              En sucursal
                            </span>
                          )}
                        </td>

                        {/* Materiales */}
                        <td className="p-3">
                          {d.detalles && d.detalles.length > 0 ? (
                            <div>
                              <span className="font-medium text-xs">
                                {d.detalles.length} ítem{d.detalles.length !== 1 ? "s" : ""}
                              </span>
                              <ul className="text-xs text-muted-foreground mt-0.5 list-disc list-inside space-y-0.5">
                                {d.detalles.map((det) => (
                                  <li key={det.id}>
                                    {det.tipoMaterial?.descripcion ??
                                      `Material #${det.tipoMaterialId}`}
                                    {det.cantidadEstimada ? ` (x${det.cantidadEstimada})` : ""}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">
                              Sin materiales
                            </span>
                          )}
                        </td>

                        {/* Retiro */}
                        <td className="p-3">
                          {d.necesitaRetiro ? (
                            d.retiro ? (
                              <div className="text-xs space-y-0.5">
                                <p className="font-medium">
                                  {d.retiro.empleadoTransportista?.empleado
                                    ? `${d.retiro.empleadoTransportista.empleado.nombre} ${d.retiro.empleadoTransportista.empleado.apellido}`
                                    : "Sin transportista"}
                                </p>
                                {d.retiro.vehiculo && (
                                  <p className="text-muted-foreground font-mono">
                                    {d.retiro.vehiculo.patente}
                                    {d.retiro.vehiculo.marca
                                      ? ` · ${d.retiro.vehiculo.marca}${d.retiro.vehiculo.modelo ? " " + d.retiro.vehiculo.modelo : ""}`
                                      : ""}
                                  </p>
                                )}
                                {d.retiro.fechaRetiro && (
                                  <p className="text-muted-foreground">
                                    Retirado: {formatDate(d.retiro.fechaRetiro)}
                                  </p>
                                )}
                                {!d.retiro.fechaRetiro && d.retiro.fechaInicio && (
                                  <p className="text-muted-foreground">
                                    Inicio: {formatDate(d.retiro.fechaInicio)}
                                  </p>
                                )}
                                {d.retiro.direccion && (
                                  <p className="text-muted-foreground">{d.retiro.direccion}</p>
                                )}
                              </div>
                            ) : (
                              <span className="italic text-muted-foreground text-xs">
                                Pendiente de retiro
                              </span>
                            )
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
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
              Total: {result.length} donación{result.length !== 1 ? "es" : ""}
            </div>
          </>
        )}
      </div>
    </>
  )
}
