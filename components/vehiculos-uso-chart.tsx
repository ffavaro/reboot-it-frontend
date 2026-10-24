"use client"

import { useMemo, useState } from "react"
import { CartesianGrid, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts"
import { DatePicker } from "@/components/ui/date-picker"
import { useUsoVehiculos } from "@/hooks/use-historial-km"
import { formatKm } from "@/lib/utils/helpers"
import type { UsoVehiculo } from "@/lib/type/historial-km"

const TOP_OPTIONS = [5, 10, 20, 0] // 0 = todos
const TOP_DEFAULT = 10

function pad(n: number) {
  return String(n).padStart(2, "0")
}

// Mes en curso: del primer al último día
function rangoMesActual() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const ultimo = new Date(y, m + 1, 0).getDate()
  return { desde: `${y}-${pad(m + 1)}-01`, hasta: `${y}-${pad(m + 1)}-${pad(ultimo)}` }
}

function UsoTooltip({ active, payload }: { active?: boolean; payload?: { payload: UsoVehiculo }[] }) {
  if (!active || !payload?.length) return null
  const v = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium text-foreground">{v.patente} · {v.marca} {v.modelo}</p>
      <p className="mt-1 text-muted-foreground">Km recorridos: <span className="font-medium text-foreground">{formatKm(v.kmTotales)}</span></p>
      <p className="text-muted-foreground">
        Recorridos: <span className="font-medium text-foreground">{v.cantidadRecorridos}</span>
      </p>
      {v.cantidadRecorridos > 0 && (
        <p className="text-muted-foreground">
          Km por recorrido: <span className="font-medium text-foreground">{formatKm(v.kmTotales / v.cantidadRecorridos)}</span>
        </p>
      )}
    </div>
  )
}

// Suma de (km_final - km_inicial) de los recorridos finalizados de cada vehículo en el período
export function VehiculosUsoChart() {
  const inicial = useMemo(() => rangoMesActual(), [])
  const [desde, setDesde] = useState(inicial.desde)
  const [hasta, setHasta] = useState(inicial.hasta)
  const [top, setTop] = useState(TOP_DEFAULT)

  const { uso, isLoading, error } = useUsoVehiculos({
    fechaDesde: desde,
    fechaHasta: hasta,
    limit: top || undefined,
  })

  const fueraDelMes = desde !== inicial.desde || hasta !== inicial.hasta
  const totalKm = uso.reduce((acc, v) => acc + v.kmTotales, 0)
  // Burbujas: cada vehículo es un punto (recorridos × km totales) y el tamaño es cuántos km hace en cada recorrido
  const puntos = useMemo(
    () => uso.map((v) => ({ ...v, kmPorRecorrido: v.cantidadRecorridos > 0 ? v.kmTotales / v.cantidadRecorridos : 0 })),
    [uso],
  )

  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground mb-1">Vehículos más utilizados</p>
          <p className="text-xs text-muted-foreground">
            Cada burbuja es un vehículo: más a la derecha, más recorridos; más arriba, más km; más grande, más km por recorrido. Hojas de ruta finalizadas
            {uso.length > 0 && <> — {formatKm(totalKm)} en total</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
            <DatePicker
              value={desde}
              onChange={(v) => v && setDesde(v)}
              max={hasta}
              aria-label="Vehículos más utilizados: desde"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <DatePicker
              value={hasta}
              onChange={(v) => v && setHasta(v)}
              min={desde}
              aria-label="Vehículos más utilizados: hasta"
            />
          </div>
          <select
            value={top}
            onChange={(e) => setTop(Number(e.target.value))}
            className="h-8 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Cantidad de vehículos"
          >
            {TOP_OPTIONS.map((n) => (
              <option key={n} value={n}>{n === 0 ? "Todos" : `Top ${n}`}</option>
            ))}
          </select>
          {fueraDelMes && (
            <button
              onClick={() => { setDesde(inicial.desde); setHasta(inicial.hasta) }}
              className="px-1 text-xs text-muted-foreground hover:text-foreground"
              title="Volver al mes en curso"
            >
              ✕ Mes actual
            </button>
          )}
        </div>
      </div>

      {error ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-destructive">
          No se pudieron cargar los datos de uso de vehículos.
        </div>
      ) : isLoading ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground">Cargando…</div>
      ) : uso.length === 0 ? (
        <div className="h-[260px] flex items-center justify-center text-xs text-muted-foreground text-center px-6">
          No hay hojas de ruta finalizadas en este período.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
            <XAxis
              type="number"
              dataKey="cantidadRecorridos"
              name="Recorridos"
              allowDecimals={false}
              tick={{ fontSize: 11 }}
              tickLine={false}
              domain={[0, (max: number) => Math.max(2, Math.ceil(max * 1.15))]}
              label={{ value: "Recorridos", position: "insideBottom", offset: -12, fontSize: 11 }}
            />
            <YAxis
              type="number"
              dataKey="kmTotales"
              name="Km recorridos"
              tick={{ fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              unit=" km"
              width={64}
              domain={[0, (max: number) => Math.ceil(max * 1.15)]}
            />
            <ZAxis type="number" dataKey="kmPorRecorrido" range={[90, 600]} />
            <Tooltip content={<UsoTooltip />} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={puntos} fill="#378ADD" fillOpacity={0.55} stroke="#378ADD">
              <LabelList dataKey="patente" position="top" style={{ fontSize: 11, fill: "currentColor" }} />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
