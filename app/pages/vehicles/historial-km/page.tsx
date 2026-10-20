"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { cn } from "@/lib/utils"
import { useVehiculos } from "@/hooks/use-vehicles"
import { useHistorialKmVehiculo } from "@/hooks/use-historial-km"
import { formatKm } from "@/lib/utils/helpers"
import type { HistorialKmVehiculo } from "@/lib/type/historial-km"

// Se arma a mano (no toLocaleString) para no depender de los datos ICU de es-AR del entorno
function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const COLUMNS: TableColumn<HistorialKmVehiculo>[] = [
  {
    key: "createdAt",
    header: "Fecha y hora",
    cell: (h) => <span className="tabular-nums">{formatFechaHora(h.createdAt)}</span>,
  },
  {
    key: "kmInicial",
    header: "Km inicial",
    cell: (h) => <span className="tabular-nums">{formatKm(h.kmInicial)}</span>,
  },
  {
    key: "kmFinal",
    header: "Km final",
    cell: (h) =>
      h.kmFinal !== null ? (
        <span className="tabular-nums">{formatKm(h.kmFinal)}</span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "recorrido",
    header: "Recorrido",
    cell: (h) =>
      h.kmFinal !== null ? (
        <span className="tabular-nums font-medium">{formatKm(h.kmFinal - h.kmInicial)}</span>
      ) : (
        <span className="italic text-muted-foreground">—</span>
      ),
  },
  {
    key: "estado",
    header: "Estado",
    cell: (h) =>
      h.kmFinal !== null ? (
        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
          Finalizado
        </span>
      ) : (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
          En curso
        </span>
      ),
  },
]

function HistorialKmContent() {
  const params = useSearchParams()
  const vehiculoId = Number(params.get("vehiculoId")) || null

  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const { vehiculos } = useVehiculos()
  const vehiculo = vehiculos.find((v) => v.id === vehiculoId)
  const { historial, isLoading, error } = useHistorialKmVehiculo(vehiculoId, {
    fechaDesde: desde || undefined,
    fechaHasta: hasta || undefined,
  })

  const finalizados = historial.filter((h) => h.kmFinal !== null)
  const kmTotales = finalizados.reduce((acc, h) => acc + ((h.kmFinal as number) - h.kmInicial), 0)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <Link href="/pages/vehicles" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit -ml-2")}>
          <ArrowLeft className="h-4 w-4" />
          Volver a vehículos
        </Link>
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Historial de kilometraje</h1>
          <p className="text-sm text-muted-foreground">
            {vehiculo ? (
              <>
                <span className="font-mono">{vehiculo.patente}</span> · {vehiculo.marca} {vehiculo.modelo}
                {vehiculo.kilometraje !== null && <> · Km actual: {formatKm(vehiculo.kilometraje)}</>}
              </>
            ) : (
              "Recorridos registrados del vehículo."
            )}
          </p>
        </div>
      </div>

      {!vehiculoId ? (
        <p className="text-sm italic text-muted-foreground">
          No se indicó un vehículo. Entrá desde el detalle de un vehículo en la pantalla de Vehículos.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
              <DatePicker value={desde} onChange={setDesde} max={hasta || undefined} placeholder="Desde" clearable aria-label="Fecha desde" />
              <span className="text-xs text-muted-foreground">→</span>
              <DatePicker value={hasta} onChange={setHasta} min={desde || undefined} placeholder="Hasta" clearable aria-label="Fecha hasta" />
            </div>
            {(desde || hasta) && (
              <button onClick={() => { setDesde(""); setHasta("") }} className="px-1 text-xs text-muted-foreground hover:text-foreground">
                ✕ Limpiar filtros
              </button>
            )}
            <span className="ml-auto text-sm text-muted-foreground">
              {historial.length} registro{historial.length !== 1 ? "s" : ""}
              {finalizados.length > 0 && <> · {formatKm(kmTotales)} recorridos en {finalizados.length} recorrido{finalizados.length !== 1 ? "s" : ""} finalizado{finalizados.length !== 1 ? "s" : ""}</>}
            </span>
          </div>

          {error ? (
            <p className="text-sm text-destructive">No se pudo cargar el historial del vehículo.</p>
          ) : (
            <DataTable
              data={historial}
              columns={COLUMNS}
              isLoading={isLoading}
              loadingText="Cargando historial..."
              emptyText="Este vehículo todavía no tiene recorridos registrados."
              emptySearchText="No hay recorridos en ese rango de fechas."
              search={`${desde}|${hasta}`}
            />
          )}
        </>
      )}
    </div>
  )
}

export default function HistorialKmPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Cargando…</div>}>
      <HistorialKmContent />
    </Suspense>
  )
}
