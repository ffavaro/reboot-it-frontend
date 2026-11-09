"use client"

import { useState } from "react"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { DatePicker } from "@/components/ui/date-picker"
import { EstadoHojaBadge } from "@/components/ui/estado-hoja-badge"
import { useHojasRutaHistorico } from "@/hooks/use-hoja-ruta"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { useVehiculos } from "@/hooks/use-vehicles"
import { dia, diaYHora } from "@/lib/utils/fechas"
import { kilometros } from "@/lib/utils/formato"
import { ESTILO_SELECT } from "@/lib/utils/hoja-ruta"
import type { HojaRutaHistorico } from "@/lib/type/hoja-ruta"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import type { Vehiculo } from "@/lib/type/vehicle"

const Vacio = () => <span className="italic text-muted-foreground"></span>

const COLUMNAS: TableColumn<HojaRutaHistorico>[] = [
  {
    key: "cierre",
    header: "Fecha de cierre",
    cell: (h) => (
      <span className="tabular-nums">{h.fechaFin ? diaYHora(h.fechaFin) : dia(h.fecha)}</span>
    ),
  },
  {
    key: "fecha",
    header: "Fecha pactada",
    cell: (h) => <span className="tabular-nums text-muted-foreground">{dia(h.fecha)}</span>,
  },
  {
    key: "transportista",
    header: "Transportista",
    cell: (h) => <span className="font-medium">{h.transportista}</span>,
  },
  {
    key: "vehiculo",
    header: "Vehículo",
    cell: (h) =>
      h.vehiculo ? (
        <span className="text-muted-foreground">
          <span className="font-mono text-xs">{h.vehiculo.patente}</span> · {h.vehiculo.marca} {h.vehiculo.modelo}
        </span>
      ) : (
        <Vacio />
      ),
  },
  {
    key: "cantidadPedidos",
    header: "Pedidos",
    cell: (h) => <span className="tabular-nums">{h.cantidadPedidos}</span>,
  },
  {
    key: "kmEstimados",
    header: "Km estimados (Maps)",
    cell: (h) =>
      h.kmEstimados !== null ? (
        <span className="tabular-nums text-muted-foreground">{kilometros(h.kmEstimados)}</span>
      ) : (
        <Vacio />
      ),
  },
  {
    key: "kmReales",
    header: "Km reales",
    cell: (h) =>
      h.kmReales !== null ? <span className="tabular-nums font-medium">{kilometros(h.kmReales)}</span> : <Vacio />,
  },
  {
    key: "estado",
    header: "Estado",
    cell: (h) => <EstadoHojaBadge estado={h.estado} />,
  },
]

export function HistoricoTab() {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [transportistaId, setTransportistaId] = useState("")
  const [vehiculoId, setVehiculoId] = useState("")

  const { transportistas } = useEmpleadosTransportistas()
  const { vehiculos } = useVehiculos()
  const { hojas, isLoading } = useHojasRutaHistorico({
    fechaDesde: desde || undefined,
    fechaHasta: hasta || undefined,
    empleadoTransportistaId: transportistaId ? Number(transportistaId) : undefined,
    vehiculoId: vehiculoId ? Number(vehiculoId) : undefined,
  })

  const hayFiltros = !!(desde || hasta || transportistaId || vehiculoId)

  function limpiar() {
    setDesde("")
    setHasta("")
    setTransportistaId("")
    setVehiculoId("")
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
          <DatePicker value={desde} onChange={setDesde} max={hasta || undefined} placeholder="Desde" clearable aria-label="Fecha desde" />
          <span className="text-xs text-muted-foreground">→</span>
          <DatePicker value={hasta} onChange={setHasta} min={desde || undefined} placeholder="Hasta" clearable aria-label="Fecha hasta" />
        </div>
        <select
          value={transportistaId}
          onChange={(e) => setTransportistaId(e.target.value)}
          className={ESTILO_SELECT}
          aria-label="Filtrar por transportista"
        >
          <option value="">Todos los transportistas</option>
          {transportistas.map((t: EmpleadoTransportista) => (
            <option key={t.id} value={t.id}>
              {t.empleado ? `${t.empleado.nombre} ${t.empleado.apellido}` : `Transportista #${t.id}`}
            </option>
          ))}
        </select>
        <select
          value={vehiculoId}
          onChange={(e) => setVehiculoId(e.target.value)}
          className={ESTILO_SELECT}
          aria-label="Filtrar por vehículo"
        >
          <option value="">Todos los vehículos</option>
          {vehiculos.map((v: Vehiculo) => (
            <option key={v.id} value={v.id}>{v.patente}  {v.marca} {v.modelo}</option>
          ))}
        </select>
        {hayFiltros && (
          <button onClick={limpiar} className="px-1 text-xs text-muted-foreground hover:text-foreground">
            ✕ Limpiar filtros
          </button>
        )}
        <span className="ml-auto text-sm text-muted-foreground">
          {hojas.length} hoja{hojas.length !== 1 ? "s" : ""} finalizada{hojas.length !== 1 ? "s" : ""}
        </span>
      </div>

      <DataTable
        data={hojas}
        columns={COLUMNAS}
        isLoading={isLoading}
        loadingText="Cargando histórico..."
        emptyText="Todavía no hay hojas de ruta finalizadas."
        emptySearchText="No se encontraron hojas de ruta con esos filtros."
        search={[desde, hasta, transportistaId, vehiculoId].join("|")}
      />
    </div>
  )
}