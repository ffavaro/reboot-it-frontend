"use client"

import { useMemo, useState } from "react"
import { CartesianGrid, LabelList, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis } from "recharts"
import { DatePicker } from "@/components/ui/date-picker"
import { Panel } from "@/components/dashboard/panel"
import { useUsoDeVehiculos } from "@/hooks/use-dashboard"
import { ALTO_EJE_X, COLOR, GRILLA, MARCAS, tituloX, tituloY } from "../estilo"
import { kilometros, mesEnCurso } from "@/lib/utils/formato"
import type { UsoDeVehiculo } from "@/lib/type/dashboard"

const CANTIDADES = [5, 10, 20, 0]

export function UsoDeFlota() {
  const mes = useMemo(() => mesEnCurso(), [])
  const [rango, setRango] = useState(mes)
  const [cantidad, setCantidad] = useState(10)
  const { uso, isLoading, error } = useUsoDeVehiculos({ fechaDesde: rango.desde, fechaHasta: rango.hasta, limit: cantidad || undefined })

  const puntos = useMemo(
    () => uso.map((v) => ({ ...v, porRecorrido: v.cantidadRecorridos ? v.kmTotales / v.cantidadRecorridos : 0 })),
    [uso],
  )
  const total = uso.reduce((s, v) => s + v.kmTotales, 0)
  const otroPeriodo = rango.desde !== mes.desde || rango.hasta !== mes.hasta
  const estado = error ? "No se pudo cargar el uso de los vehículos." : isLoading ? "Cargando…" : !uso.length ? "No hay hojas de ruta finalizadas en el período." : false

  const filtros = (
    <div className="flex flex-wrap items-center gap-2">
      <DatePicker variant="field" value={rango.desde} onChange={(v) => v && setRango((r) => ({ ...r, desde: v }))} className="h-8 w-36 text-xs" aria-label="Flota desde" />
      <span className="text-xs text-muted-foreground">a</span>
      <DatePicker variant="field" value={rango.hasta} onChange={(v) => v && setRango((r) => ({ ...r, hasta: v }))} className="h-8 w-36 text-xs" aria-label="Flota hasta" />
      <select
        value={cantidad}
        onChange={(e) => setCantidad(Number(e.target.value))}
        className="h-8 rounded-lg border border-border bg-background px-2 text-xs"
        aria-label="Cantidad de vehículos"
      >
        {CANTIDADES.map((n) => (
          <option key={n} value={n}>
            {n ? `Top ${n}` : "Todos"}
          </option>
        ))}
      </select>
      {otroPeriodo && (
        <button type="button" onClick={() => setRango(mes)} className="text-xs text-muted-foreground hover:text-foreground">
          Mes actual
        </button>
      )}
    </div>
  )

  return (
    <Panel
      titulo="Vehículos más utilizados"
      bajada={`Más a la derecha, más recorridos; más arriba, más km; más grande, más km por recorrido${uso.length ? ` · ${kilometros(total)} en total` : ""}.`}
      acciones={filtros}
      vacio={estado}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <ScatterChart margin={{ top: 16, right: 24, left: 0, bottom: 4 }}>
          <CartesianGrid {...GRILLA} />
          <XAxis
            type="number"
            dataKey="cantidadRecorridos"
            allowDecimals={false}
            tick={MARCAS}
            tickLine={false}
            domain={[0, (max: number) => Math.max(2, Math.ceil(max * 1.15))]}
            height={ALTO_EJE_X}
            label={tituloX("Cantidad de recorridos")}
          />
          <YAxis
            type="number"
            dataKey="kmTotales"
            unit=" km"
            width={84}
            tick={MARCAS}
            tickLine={false}
            axisLine={false}
            domain={[0, (max: number) => Math.ceil(max * 1.15)]}
            label={tituloY("Km recorridos")}
          />
          <ZAxis type="number" dataKey="porRecorrido" range={[90, 600]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              const v = payload?.[0]?.payload as (UsoDeVehiculo & { porRecorrido: number }) | undefined
              if (!v) return null
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium">
                    {v.patente} · {v.marca} {v.modelo}
                  </p>
                  <p className="text-muted-foreground">{kilometros(v.kmTotales)} en {v.cantidadRecorridos} recorridos</p>
                  {v.cantidadRecorridos > 0 && <p className="text-muted-foreground">{kilometros(v.porRecorrido)} por recorrido</p>}
                </div>
              )
            }}
          />
          <Scatter data={puntos} fill={COLOR.azul} fillOpacity={0.55} stroke={COLOR.azul}>
            <LabelList dataKey="patente" position="top" style={{ fontSize: 11, fill: "currentColor" }} />
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </Panel>
  )
}
