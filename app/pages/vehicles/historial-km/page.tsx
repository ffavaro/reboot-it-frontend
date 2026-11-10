"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { DataTable, type TableColumn } from "@/components/ui/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { useVehiculos } from "@/hooks/use-vehicles"
import { useRecorridosDeVehiculo } from "@/hooks/use-historial-km"
import { kmLegible } from "@/lib/utils/helpers"
import { diaYHora } from "@/lib/utils/fechas"
import type { RangoFechas, RecorridoKm } from "@/lib/type/historial-km"

const SIN_FILTRO: RangoFechas = { desde: "", hasta: "" }

const recorrido = (r: RecorridoKm) => (r.kmFinal == null ? null : r.kmFinal - r.kmInicial)

const vacio = <span className="italic text-muted-foreground">—</span>

const COLUMNAS: TableColumn<RecorridoKm>[] = [
  { key: "fecha", header: "Inicio", cell: (r) => <span className="tabular-nums">{diaYHora(r.createdAt)}</span> },
  { key: "hoja", header: "Hoja de ruta", cell: (r) => (r.hojaRutaId ? `N.º ${r.hojaRutaId}` : vacio) },
  { key: "inicial", header: "Km al salir", cell: (r) => <span className="tabular-nums">{kmLegible(r.kmInicial)}</span> },
  { key: "final", header: "Km al volver", cell: (r) => (r.kmFinal == null ? vacio : <span className="tabular-nums">{kmLegible(r.kmFinal)}</span>) },
  {
    key: "recorrido",
    header: "Recorrido",
    cell: (r) => {
      const km = recorrido(r)
      return km == null ? vacio : <span className="font-medium tabular-nums">{kmLegible(km)}</span>
    },
  },
  {
    key: "estado",
    header: "Estado",
    cell: (r) => (
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
          r.kmFinal == null
            ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        )}
      >
        {r.kmFinal == null ? "En curso" : "Finalizado"}
      </span>
    ),
  },
]

function Recorridos() {
  const vehiculoId = Number(useSearchParams().get("vehiculo")) || null
  const [rango, setRango] = useState<RangoFechas>(SIN_FILTRO)

  const { vehiculos } = useVehiculos()
  const vehiculo = vehiculos.find((v) => v.id === vehiculoId)

  const rangoInvalido = Boolean(rango.desde && rango.hasta && rango.desde > rango.hasta)
  const { recorridos, cargando, error } = useRecorridosDeVehiculo(vehiculoId, rangoInvalido ? SIN_FILTRO : rango)

  const cerrados = recorridos.filter((r) => r.kmFinal != null)
  const total = cerrados.reduce((suma, r) => suma + (recorrido(r) ?? 0), 0)
  const filtrando = Boolean(rango.desde || rango.hasta)

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-3">
        <Link href="/pages/vehicles" className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "-ml-2 w-fit")}>
          <ArrowLeft className="h-4 w-4" />
          Volver a vehículos
        </Link>
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Historial de kilometraje</h1>
          <p className="text-sm text-muted-foreground">
            {vehiculo ? (
              <>
                <span className="font-mono">{vehiculo.patente}</span> · {vehiculo.marca} {vehiculo.modelo}
                {vehiculo.kilometraje != null && <> · Kilometraje actual: {kmLegible(vehiculo.kilometraje)}</>}
              </>
            ) : (
              "Recorridos del vehículo según sus hojas de ruta."
            )}
          </p>
        </header>
      </div>

      {!vehiculoId ? (
        <p className="text-sm italic text-muted-foreground">
          Elegí un vehículo desde la pantalla de Vehículos para ver su historial.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Desde
              <DatePicker variant="field" clearable value={rango.desde} onChange={(desde) => setRango((r) => ({ ...r, desde }))} className="w-40" />
            </label>
            <label className="flex flex-col gap-1 text-xs text-muted-foreground">
              Hasta
              <DatePicker variant="field" clearable value={rango.hasta} onChange={(hasta) => setRango((r) => ({ ...r, hasta }))} className="w-40" />
            </label>
            {filtrando && (
              <button onClick={() => setRango(SIN_FILTRO)} className="pb-2 text-xs text-muted-foreground hover:text-foreground">
                Limpiar fechas
              </button>
            )}
            <p className="ml-auto pb-2 text-sm text-muted-foreground">
              {cerrados.length === 0
                ? "Sin recorridos finalizados"
                : `${kmLegible(total)} en ${cerrados.length} ${cerrados.length === 1 ? "recorrido finalizado" : "recorridos finalizados"}`}
            </p>
          </div>

          {rangoInvalido && <p className="text-sm text-destructive">La fecha desde no puede ser posterior a la fecha hasta.</p>}

          {error ? (
            <p className="text-sm text-destructive">No se pudo cargar el historial del vehículo.</p>
          ) : (
            <DataTable
              data={recorridos}
              columns={COLUMNAS}
              isLoading={cargando}
              loadingText="Cargando recorridos..."
              emptyText="Este vehículo todavía no salió en ninguna hoja de ruta."
              emptySearchText="No hay recorridos entre esas fechas."
              search={filtrando ? `${rango.desde}-${rango.hasta}` : undefined}
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
      <Recorridos />
    </Suspense>
  )
}
