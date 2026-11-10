"use client"

import { useMemo, useState } from "react"
import { ArrowDownRight, ArrowUpRight, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { DatePicker } from "@/components/ui/date-picker"
import { SelectorDonantes } from "@/components/dashboard/selector-donantes"
import { IndicadoresCircuito, TrabajoPendiente } from "@/components/dashboard/resumen"
import { Tablero } from "@/components/dashboard/tablero"
import { tarjetasOperativas } from "@/components/dashboard/graficos/operacion"
import { tarjetasDelCircuito } from "@/components/dashboard/graficos/circuito"
import { UsoDeFlota } from "@/components/dashboard/graficos/flota"
import { MovimientosDeLotes } from "@/components/dashboard/graficos/lotes"
import { useResumenCircuito } from "@/hooks/use-dashboard"
import { useTableroOperativo } from "@/hooks/use-tablero-operativo"
import { entero, mesesAtras } from "@/lib/utils/formato"
import { dia, isoDe } from "@/lib/utils/fechas"  
import {
  PERIODO_LABELS,
  getRangoAnterior,
  getRangoAnteriorCustom,
  getRangoCustom,
  getRangoFechas,
  type Periodo,
} from "@/lib/utils/formato"
import { Tarjeta } from "@/lib/type/dashboard"

const PRESETS: Periodo[] = ["mes", "trimestre", "semestre", "año"]

const rangoInicial = () => ({ desde: mesesAtras(3), hasta: isoDe(new Date()) })

function Kpi({ etiqueta, valor, nota, variacion }: { etiqueta: string; valor: string; nota?: string; variacion?: { texto: string; sube: boolean } | null }) {
  return (
    <div className="flex min-w-0 flex-col gap-1 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/5">
      <span className="text-xs leading-tight text-muted-foreground">{etiqueta}</span>
      <span className="text-2xl font-medium leading-none tabular-nums">{valor}</span>
      {nota && <span className="text-xs text-muted-foreground">{nota}</span>}
      {variacion && (
        <span
          className={cn(
            "mt-1 inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
            variacion.sube ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
          )}
        >
          {variacion.sube ? <ArrowUpRight className="size-3" /> : <ArrowDownRight className="size-3" />}
          {variacion.texto}
        </span>
      )}
    </div>
  )
}

const conSigno = (n: number) => `${n >= 0 ? "+" : ""}${n}`

export default function DashboardPage() {
  const [preset, setPreset] = useState<Periodo | null>(null)
  const [libre, setLibre] = useState(rangoInicial)
  const [donanteIds, setDonanteIds] = useState<number[]>([])
  const [version, setVersion] = useState(0)

  const { rango, anterior } = useMemo(
    () =>
      preset
        ? { rango: getRangoFechas(preset), anterior: getRangoAnterior(preset) }
        : { rango: getRangoCustom(libre.desde, libre.hasta), anterior: getRangoAnteriorCustom(libre.desde, libre.hasta) },
    [preset, libre],
  )

  const etiqueta = preset ? rango.label : `${dia(rango.fechaDesde)} al ${dia(rango.fechaHasta)}`

  const { resumen } = useResumenCircuito({ fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta, donanteIds })
  const operativo = useTableroOperativo({ rango, anterior, preset, donanteIds })
  const { kpis, cargando } = operativo

  function elegirPreset(p: Periodo) {
    const r = getRangoFechas(p)
    setPreset(p)
    setLibre({ desde: r.fechaDesde, hasta: r.fechaHasta })
  }

  function cambiarFecha(campo: "desde" | "hasta", valor: string) {
    if (!valor) return
    setPreset(null)
    setLibre((l) => ({ ...l, [campo]: valor }))
  }

  function restablecer() {
    setPreset(null)
    setLibre(rangoInicial())
    setDonanteIds([])
    setVersion((v) => v + 1)
  }

  const tarjetas: Tarjeta[] = useMemo(
    () => [
      ...tarjetasOperativas(operativo, etiqueta, donanteIds.length > 0),
      { id: "uso-flota", ancho: 6, alto: 11, contenido: <UsoDeFlota key={`flota-${version}`} /> },
      {
        id: "movimientos-lotes",
        ancho: 6,
        alto: 12,
        contenido: <MovimientosDeLotes key={`lotes-${version}`} filas={operativo.filasLotes} periodo={rango} cargando={cargando} />,
      },
      ...tarjetasDelCircuito(resumen),
    ],
    [operativo, etiqueta, rango, donanteIds.length, version, cargando, resumen],
  )

  const inicial = rangoInicial()
  const fueraDeLoInicial = !preset && (libre.desde !== inicial.desde || libre.hasta !== inicial.hasta)

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 p-6">
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card p-4 shadow-md ring-1 ring-foreground/5">
        <div>
          <h1 className="text-xl font-medium">Reboot IT Analytics</h1>
          <p className="text-sm text-muted-foreground">Panel de control operativo · {etiqueta}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={preset === p}
              onClick={() => elegirPreset(p)}
              className={cn(
                "rounded-lg border px-3 py-1.5 text-xs transition-colors",
                preset === p
                  ? "border-blue-400 bg-blue-50 font-medium text-blue-800 dark:border-blue-500 dark:bg-blue-900/30 dark:text-blue-300"
                  : "border-border text-muted-foreground hover:bg-muted",
              )}
            >
              {PERIODO_LABELS[p]}
            </button>
          ))}
          <div className={cn("flex items-center gap-1 rounded-lg border px-1 py-0.5", !preset ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-border")}>
            <DatePicker value={libre.desde} onChange={(v) => cambiarFecha("desde", v)} placeholder="Desde" aria-label="Fecha desde" />
            <span className="text-xs text-muted-foreground">a</span>
            <DatePicker value={libre.hasta} onChange={(v) => cambiarFecha("hasta", v)} placeholder="Hasta" aria-label="Fecha hasta" />
          </div>
          <SelectorDonantes opciones={operativo.donantes.map((d) => ({ id: d.id, nombre: d.nombre }))} elegidos={donanteIds} onCambio={setDonanteIds} />
          <button
            type="button"
            onClick={restablecer}
            title="Vuelve a los últimos 3 meses, todos los donantes y los filtros de cada gráfico"
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              (preset || fueraDeLoInicial || donanteIds.length) && "border-foreground/30 text-foreground",
            )}
          >
            <RotateCcw className="size-3" />
            Restablecer
          </button>
        </div>
      </div>

      <TrabajoPendiente resumen={resumen} />
      <IndicadoresCircuito resumen={resumen} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Kpi
          etiqueta="Donaciones recibidas"
          valor={cargando ? "…" : entero(kpis.donaciones)}
          variacion={cargando ? null : { texto: `${conSigno(kpis.variacionDonaciones)} % vs. período anterior`, sube: kpis.variacionDonaciones >= 0 }}
        />
        <Kpi
          etiqueta="Efectividad de recuperación"
          valor={cargando ? "…" : kpis.recuperacion !== null ? `${kpis.recuperacion} %` : ""}
          variacion={
            cargando || kpis.variacionRecuperacion === null
              ? null
              : { texto: `${conSigno(kpis.variacionRecuperacion)} pts vs. período anterior`, sube: kpis.variacionRecuperacion >= 0 }
          }
        />
        <Kpi
          etiqueta="Basura electrónica desechada (RAEE)"
          valor={cargando ? "…" : `${entero(kpis.raeeKg)} kg`}
          nota="Estimado con el % de descarte sobre el peso bruto ingresado"
        />
      </div>

      <Tablero tarjetas={tarjetas} />
    </div>
  )
}
