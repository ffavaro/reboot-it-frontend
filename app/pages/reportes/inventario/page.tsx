"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTipoMateriales } from "@/hooks/use-tipo-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { materialApi } from "@/lib/api"
import type { ReporteInventario, ReporteInventarioQuery } from "@/lib/type/material"
import type { TipoMaterial } from "@/lib/type/tipo-material"
import type { CondicionMaterial } from "@/lib/type/condicion-material"
import { formatDate } from "@/lib/utils/helpers"

const SELECT_CLASS =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"

const ESTADO_COLOR: Record<string, string> = {
  Iniciado: "bg-blue-100 text-blue-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  Finalizado: "bg-green-100 text-green-700",
}

export default function ReporteInventarioPage() {
  const { tipoMateriales } = useTipoMateriales()
  const { condiciones } = useCondicionesMaterial()

  const [filters, setFilters] = useState<ReporteInventarioQuery>({})
  const [result, setResult] = useState<ReporteInventario[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasGenerated, setHasGenerated] = useState(false)

  async function handleGenerate() {
    setIsLoading(true)
    try {
      const data = await materialApi.getReporte(filters)
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

  const tipoLabel = filters.tipoMaterialId
    ? tipoMateriales.find((t: TipoMaterial) => t.id === filters.tipoMaterialId)?.nombre
    : null

  const condicionLabel = filters.condicionMaterialId
    ? condiciones.find((c: CondicionMaterial) => c.id === filters.condicionMaterialId)?.condicion
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
          .tag-destruccion { color: #b45309 !important; }
          .tag-sin-destruccion { color: #15803d !important; }
        }
        .print-show { display: none; }
      `}</style>

      <div className="flex flex-col gap-6 p-6">
        {/* Encabezado solo al imprimir */}
        <div className="print-show flex flex-col gap-1 mb-2">
          <h1 className="text-xl font-bold">Reporte de Inventario de Materiales</h1>
          <p className="text-sm">
            Generado el{" "}
            {new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })}
            {tipoLabel ? ` · Tipo: ${tipoLabel}` : ""}
            {condicionLabel ? ` · Condición: ${condicionLabel}` : ""}
            {filters.loteId ? ` · Lote #${filters.loteId}` : ""}
            {filters.tieneDestruccion !== undefined
              ? ` · ${filters.tieneDestruccion ? "Con proceso de destrucción" : "Sin proceso de destrucción"}`
              : ""}
            {filters.fechaDesde || filters.fechaHasta
              ? ` · Período: ${filters.fechaDesde ?? "inicio"} al ${filters.fechaHasta ?? "hoy"}`
              : ""}
          </p>
        </div>

        {/* Encabezado de pantalla */}
        <div className="flex flex-col gap-1 no-print">
          <h1 className="text-2xl font-bold tracking-tight">Reporte de Inventario</h1>
          <p className="text-sm text-muted-foreground">
            Listado de materiales registrados con su lote, condición y estado de destrucción.
          </p>
        </div>

        {/* Filtros */}
        <div className="no-print rounded-xl border p-4 bg-card flex flex-col gap-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Filtros</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Tipo de material */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Tipo de material</label>
              <select
                value={filters.tipoMaterialId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, tipoMaterialId: e.target.value ? Number(e.target.value) : undefined }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Todos los tipos</option>
                {tipoMateriales.map((t: TipoMaterial) => (
                  <option key={t.id} value={t.id}>{t.nombre}</option>
                ))}
              </select>
            </div>

            {/* Condición */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Condición del material</label>
              <select
                value={filters.condicionMaterialId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, condicionMaterialId: e.target.value ? Number(e.target.value) : undefined }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Todas las condiciones</option>
                {condiciones.map((c: CondicionMaterial) => (
                  <option key={c.id} value={c.id}>{c.condicion}</option>
                ))}
              </select>
            </div>

            {/* Proceso de destrucción */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Proceso de destrucción</label>
              <select
                value={filters.tieneDestruccion === undefined ? "" : String(filters.tieneDestruccion)}
                onChange={(e) =>
                  setFilters((f) => ({
                    ...f,
                    tieneDestruccion: e.target.value === "" ? undefined : e.target.value === "true",
                  }))
                }
                className={SELECT_CLASS}
              >
                <option value="">Todos</option>
                <option value="true">Con proceso de destrucción</option>
                <option value="false">Sin proceso de destrucción</option>
              </select>
            </div>

            {/* Lote */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                Lote <span className="text-muted-foreground font-normal">(ID)</span>
              </label>
              <Input
                type="number"
                placeholder="Ej: 5"
                value={filters.loteId ?? ""}
                onChange={(e) =>
                  setFilters((f) => ({ ...f, loteId: e.target.value ? Number(e.target.value) : undefined }))
                }
              />
            </div>

            {/* Fecha desde */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de registro desde</label>
              <Input
                type="date"
                value={filters.fechaDesde ?? ""}
                onChange={(e) => setFilters((f) => ({ ...f, fechaDesde: e.target.value || undefined }))}
              />
            </div>

            {/* Fecha hasta */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Fecha de registro hasta</label>
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
                {result.length} material{result.length !== 1 ? "es" : ""} encontrado{result.length !== 1 ? "s" : ""}
              </span>
              <Button variant="outline" onClick={() => window.print()} disabled={result.length === 0}>
                Imprimir / Exportar PDF
              </Button>
            </div>

            {result.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12 no-print">
                No se encontraron materiales con los filtros seleccionados.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border">
                <table className="w-full text-sm report-table">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium"># Material</th>
                      <th className="p-3 text-left font-medium">Lote / Donación</th>
                      <th className="p-3 text-left font-medium">Tipo</th>
                      <th className="p-3 text-left font-medium">Condición</th>
                      <th className="p-3 text-left font-medium">Descripción</th>
                      <th className="p-3 text-left font-medium">Proceso de destrucción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((m) => (
                      <tr key={m.id} className="border-b last:border-0 hover:bg-muted/30">
                        {/* ID Material */}
                        <td className="p-3 font-mono text-xs text-muted-foreground">#{m.id}</td>

                        {/* Lote / Donación */}
                        <td className="p-3 text-xs">
                          {m.lote ? (
                            <div>
                              <p>
                                <span className="text-muted-foreground">Lote </span>
                                <span className="font-mono font-medium">#{m.lote.id}</span>
                              </p>
                              <p>
                                <span className="text-muted-foreground">Donación </span>
                                <span className="font-mono">#{m.lote.donacionId}</span>
                              </p>
                              {m.lote.pesoBrutoKg && (
                                <p className="text-muted-foreground">{m.lote.pesoBrutoKg} kg</p>
                              )}
                            </div>
                          ) : (
                            <span className="italic text-muted-foreground">Sin lote</span>
                          )}
                        </td>

                        {/* Tipo */}
                        <td className="p-3 text-xs font-medium">
                          {m.tipoMaterial?.nombre ?? (
                            <span className="italic text-muted-foreground">—</span>
                          )}
                        </td>

                        {/* Condición */}
                        <td className="p-3">
                          {m.condicionMaterial ? (
                            <span className="badge inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-700">
                              {m.condicionMaterial.condicion}
                            </span>
                          ) : (
                            <span className="italic text-muted-foreground text-xs">—</span>
                          )}
                        </td>

                        {/* Descripción */}
                        <td className="p-3 text-xs text-muted-foreground max-w-40">
                          {m.descripcion ?? <span className="italic">—</span>}
                        </td>

                        {/* Proceso de destrucción */}
                        <td className="p-3">
                          {m.medioAlmacenamiento ? (
                            <div className="text-xs space-y-0.5">
                              <p className="tag-destruccion text-amber-600 font-medium">
                                Requiere destrucción
                              </p>
                              {m.medioAlmacenamiento.procesoDestruccion ? (
                                <>
                                  {m.medioAlmacenamiento.procesoDestruccion.estado && (
                                    <span
                                      className={`badge inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${ESTADO_COLOR[m.medioAlmacenamiento.procesoDestruccion.estado.nombre] ?? "bg-muted text-foreground"}`}
                                    >
                                      {m.medioAlmacenamiento.procesoDestruccion.estado.nombre}
                                    </span>
                                  )}
                                  {m.medioAlmacenamiento.procesoDestruccion.metodoDestruccion && (
                                    <p className="text-muted-foreground">
                                      {m.medioAlmacenamiento.procesoDestruccion.metodoDestruccion.nombre}
                                    </p>
                                  )}
                                  {m.medioAlmacenamiento.procesoDestruccion.fecha && (
                                    <p className="text-muted-foreground">
                                      {formatDate(m.medioAlmacenamiento.procesoDestruccion.fecha)}
                                    </p>
                                  )}
                                </>
                              ) : (
                                <span className="text-muted-foreground italic">Sin proceso aún</span>
                              )}
                            </div>
                          ) : (
                            <span className="tag-sin-destruccion text-green-600 text-xs font-medium">
                              No requiere destrucción
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="print-show mt-4 pt-2 border-t text-xs text-gray-500">
              Total: {result.length} material{result.length !== 1 ? "es" : ""}
            </div>
          </>
        )}
      </div>
    </>
  )
}
