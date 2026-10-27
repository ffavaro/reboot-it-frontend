"use client"

import { useState, useMemo } from "react"
import { SearchInput } from "@/components/ui/search-input"
import { DatePicker } from "@/components/ui/date-picker"
import { MultiSelect } from "@/components/ui/multi-select"
import { VehiculosUsoChart } from "@/components/vehiculos-uso-chart"
import { TrabajoPendiente, IndicadoresCircuito } from "@/components/dashboard/resumen-circuito"
import { itemsGraficosCircuito } from "@/components/dashboard/graficos-circuito"
import { GrillaGraficos } from "@/components/dashboard/grilla-graficos"
import { etiquetaX, etiquetaY, ALTO_EJE_X } from "@/components/dashboard/ejes"
import { useDashboardResumen } from "@/hooks/use-dashboard"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, Area
} from "recharts"
import { BarChart3, RotateCcw, Table2 } from "lucide-react"
import { useLotes } from "@/hooks/use-lote"
import { useDonantes } from "@/hooks/use-donantes"
import { useDonacionReporte } from "@/hooks/use-donacion"
import { useMateriales, useMaterialReporte } from "@/hooks/use-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { exportToPdf, exportToExcel, type ExportColumn } from "@/lib/utils/export"
import { formatDate } from "@/lib/utils/helpers"
import { esCondicionSinClasificar } from "@/lib/constants/estados"
import { EstadoBadge } from "@/components/ui/estado-badge"
import { ESTADO_LOTE_COLORS, colorPorEstado } from "@/lib/estado-colores"
import {
  type Periodo, PERIODO_LABELS, getRangoFechas, getRangoAnterior,
  getRangoCustom, getRangoAnteriorCustom, getBucketOrder, getBucketKey,
  getBucketOrderCustom, getBucketKeyCustom, clasificarMateriales, pctChange,
} from "@/lib/utils/dashboard"
import type { ReporteDonacionQuery } from "@/lib/type/donacion"
import type { ReporteInventarioQuery } from "@/lib/type/material"

const DONUT_COLORS = ["#639922", "#378ADD", "#E24B4A"]
const DONUT_LABELS = ["Reacondicionamiento / Donación social", "Stock de componentes", "Disposición final / Scrap"]

const RECEPCION_COLORS = ["#378ADD", "#F5A623"]
const RECEPCION_LABELS = ["Entregado en sucursal", "Retirado a domicilio"]

// ── Componente KPI Card ────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend }: {
  label: string; value: string | number; sub?: string; trend?: { text: string; up: boolean }
}) {
  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs text-muted-foreground leading-tight">{label}</p>
      <p className="text-2xl font-medium text-foreground leading-none">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      {trend && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit mt-1 ${trend.up ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}`}>
          {trend.up ? "↑" : "↓"} {trend.text}
        </span>
      )}
    </div>
  )
}

// ── Componente Badge de estado ─────────────────────────────────────────────
const ESTADOS_LOTE = ["En proceso", "Clasificado", "Desechado"] as const
// Colores hex (no Tailwind) porque recharts los necesita como `fill`/`background`, no como className
const ESTADO_COLORS: Record<string, string> = {
  "En proceso":  "#F5A623",
  "Clasificado": "#639922",
  "Desechado":   "#E24B4A",
}

function EstadoLoteBadge({ estado }: { estado: string }) {
  return <EstadoBadge texto={estado} colorClass={colorPorEstado(ESTADO_LOTE_COLORS, estado, "bg-muted text-muted-foreground")} />
}

// Ventana por defecto al entrar al dashboard: últimos 3 meses hasta hoy
function defaultDesde(): string {
  const d = new Date()
  d.setMonth(d.getMonth() - 3)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
function defaultHasta(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// ── Página principal ───────────────────────────────────────────────────────
export default function DashboardPage() {
  // null = rango personalizado (por defecto, últimos 3 meses); si no, el preset queda aplicado
  // y las fechas de customDesde/customHasta solo reflejan su rango para mostrarlas en los inputs
  const [activePreset, setActivePreset] = useState<Periodo | null>(null)
  const [donanteIds, setDonanteIds] = useState<number[]>([])
  // Cambia al restablecer: remonta los gráficos que guardan sus propios filtros
  const [resetKey, setResetKey] = useState(0)
  const [search, setSearch] = useState("")
  const [customDesde, setCustomDesde] = useState(defaultDesde())
  const [customHasta, setCustomHasta] = useState(defaultHasta())
  // Sección "Últimos movimientos de lotes"
  const [lotesVista, setLotesVista] = useState<"grafico" | "tabla">("grafico")
  const [lotesDesde, setLotesDesde] = useState("")
  const [lotesHasta, setLotesHasta] = useState("")
  const [lotesEstado, setLotesEstado] = useState("")
  const [lotesDonanteId, setLotesDonanteId] = useState<number | "">("")

  const usaRangoCustom = activePreset === null

  function elegirPeriodo(p: Periodo) {
    const r = getRangoFechas(p)
    setActivePreset(p)
    setCustomDesde(r.fechaDesde)
    setCustomHasta(r.fechaHasta)
  }

  function handleCustomDesdeChange(v: string) {
    setCustomDesde(v)
    setActivePreset(null)
  }

  function handleCustomHastaChange(v: string) {
    setCustomHasta(v)
    setActivePreset(null)
  }

  function restablecer() {
    limpiarFiltro()
    setDonanteIds([])
    setLotesVista("grafico")
    setLotesDesde("")
    setLotesHasta("")
    setLotesEstado("")
    setLotesDonanteId("")
    setSearch("")
    setResetKey(k => k + 1)
  }

  function limpiarFiltro() {
    setActivePreset(null)
    setCustomDesde(defaultDesde())
    setCustomHasta(defaultHasta())
  }

  // Rango de fechas del período seleccionado y del período anterior (para comparar tendencias)
  const rango = useMemo(
    () => activePreset ? getRangoFechas(activePreset) : getRangoCustom(customDesde, customHasta),
    [activePreset, customDesde, customHasta],
  )
  const rangoAnterior = useMemo(
    () => activePreset ? getRangoAnterior(activePreset) : getRangoAnteriorCustom(customDesde, customHasta),
    [activePreset, customDesde, customHasta],
  )

  // Indicadores y gráficos del circuito (trabajo pendiente, tiempos y gráficos de tres variables): se calculan en el servidor
  const { resumen } = useDashboardResumen({ fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta, donanteIds })

  // ── Datos base ────────────────────────────────────────────────────────
  const { lotes, isLoading: loadingLotes } = useLotes()
  const { donantes, isLoading: loadingDonantes } = useDonantes()
  const { condiciones, isLoading: loadingCondiciones } = useCondicionesMaterial()
  const { materiales: todosMateriales, isLoading: loadingTodosMateriales } = useMateriales()

  const reporteParams: ReporteDonacionQuery = useMemo(() => ({
    fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta,
    ...(donanteIds.length === 1 ? { donanteId: donanteIds[0] } : {}),
  }), [rango, donanteIds])

  const reporteParamsAnterior: ReporteDonacionQuery = useMemo(() => ({
    fechaDesde: rangoAnterior.fechaDesde, fechaHasta: rangoAnterior.fechaHasta,
    ...(donanteIds.length === 1 ? { donanteId: donanteIds[0] } : {}),
  }), [rangoAnterior, donanteIds])

  const { donaciones: donacionesActualesRaw, isLoading: loadingDonacionesActuales } = useDonacionReporte(reporteParams)
  const { donaciones: donacionesAnterioresRaw, isLoading: loadingDonacionesAnteriores } = useDonacionReporte(reporteParamsAnterior)

  // Con varios donantes elegidos el reporte se pide completo y se recorta acá
  const donanteSeleccionado = useMemo(() => new Set(donanteIds), [donanteIds])
  const incluyeDonante = (id?: number | null) => donanteIds.length === 0 || (id != null && donanteSeleccionado.has(id))
  const donacionesActuales = useMemo(() => donacionesActualesRaw.filter(d => incluyeDonante(d.donanteId)), [donacionesActualesRaw, donanteSeleccionado]) // eslint-disable-line react-hooks/exhaustive-deps
  const donacionesAnteriores = useMemo(() => donacionesAnterioresRaw.filter(d => incluyeDonante(d.donanteId)), [donacionesAnterioresRaw, donanteSeleccionado]) // eslint-disable-line react-hooks/exhaustive-deps

  const materialParams: ReporteInventarioQuery = useMemo(() => ({
    fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta,
  }), [rango])

  const materialParamsAnterior: ReporteInventarioQuery = useMemo(() => ({
    fechaDesde: rangoAnterior.fechaDesde, fechaHasta: rangoAnterior.fechaHasta,
  }), [rangoAnterior])

  const { materiales: materialesActualesRaw, isLoading: loadingMaterialesActuales } = useMaterialReporte(materialParams)
  const { materiales: materialesAnterioresRaw, isLoading: loadingMaterialesAnteriores } = useMaterialReporte(materialParamsAnterior)

  const isLoading = loadingLotes || loadingDonantes || loadingCondiciones || loadingTodosMateriales ||
    loadingDonacionesActuales || loadingDonacionesAnteriores || loadingMaterialesActuales || loadingMaterialesAnteriores

  // El endpoint de materiales no filtra por donante: se cruza vía lote → donación → donante
  const loteDonanteMap = useMemo(() => {
    const map = new Map<number, number>()
    lotes.forEach(l => { if (l.donacion) map.set(l.id, l.donacion.donanteId) })
    return map
  }, [lotes])

  const materialesActuales = useMemo(() => (
    donanteIds.length === 0 ? materialesActualesRaw : materialesActualesRaw.filter(m => donanteSeleccionado.has(loteDonanteMap.get(m.loteId ?? -1) ?? -1))
  ), [materialesActualesRaw, loteDonanteMap, donanteIds, donanteSeleccionado])

  const materialesAnteriores = useMemo(() => (
    donanteIds.length === 0 ? materialesAnterioresRaw : materialesAnterioresRaw.filter(m => donanteSeleccionado.has(loteDonanteMap.get(m.loteId ?? -1) ?? -1))
  ), [materialesAnterioresRaw, loteDonanteMap, donanteIds, donanteSeleccionado])

  const condicionPorId = useMemo(() => new Map(condiciones.map(c => [c.id, c.condicion])), [condiciones])
  const opcionesDonantes = useMemo(() => donantes.map(d => ({ value: d.id, label: d.nombre })), [donantes])
  const donantePorId = useMemo(() => new Map(donantes.map(d => [d.id, d.nombre])), [donantes])

  const clasifActual   = useMemo(() => clasificarMateriales(materialesActuales, condicionPorId), [materialesActuales, condicionPorId])
  const clasifAnterior = useMemo(() => clasificarMateriales(materialesAnteriores, condicionPorId), [materialesAnteriores, condicionPorId])

  const totalClasifActual   = clasifActual.reutilizable + clasifActual.reciclable + clasifActual.desecho
  const totalClasifAnterior = clasifAnterior.reutilizable + clasifAnterior.reciclable + clasifAnterior.desecho

  const recuperacionPct         = totalClasifActual > 0 ? Math.round(((clasifActual.reutilizable + clasifActual.reciclable) / totalClasifActual) * 100) : null
  const recuperacionAnteriorPct = totalClasifAnterior > 0 ? Math.round(((clasifAnterior.reutilizable + clasifAnterior.reciclable) / totalClasifAnterior) * 100) : null

  // KPIs con tendencia vs. el período anterior equivalente
  const donacionesTrendPct = pctChange(donacionesActuales.length, donacionesAnteriores.length)
  const trendDonaciones = { text: `${donacionesTrendPct >= 0 ? "+" : ""}${donacionesTrendPct}% vs período anterior`, up: donacionesTrendPct >= 0 }

  const trendRecuperacion = recuperacionPct !== null && recuperacionAnteriorPct !== null
    ? { text: `${recuperacionPct - recuperacionAnteriorPct >= 0 ? "+" : ""}${recuperacionPct - recuperacionAnteriorPct} pts vs período anterior`, up: recuperacionPct - recuperacionAnteriorPct >= 0 }
    : undefined

  // Lotes activos "en laboratorio" es una foto del presente, no depende del rango de fechas

  const lotesFiltrados = useMemo(() => lotes.filter(l => {
    const matchDonante = incluyeDonante(l.donacion?.donanteId)
    const fecha = l.createdAt?.slice(0, 10)
    const matchFecha = !!fecha && fecha >= rango.fechaDesde && fecha <= rango.fechaHasta
    return matchDonante && matchFecha
  }), [lotes, donanteSeleccionado, rango]) // eslint-disable-line react-hooks/exhaustive-deps

  // pesoBrutoKg llega como string desde la columna DECIMAL de MySQL
  const pesoTotalKg = useMemo(() => lotesFiltrados.reduce((acc, l) => acc + Number(l.pesoBrutoKg ?? 0), 0), [lotesFiltrados])

  // Material no registra peso propio: se estima el peso desechado a partir de la proporción de materiales "Desecho" sobre el peso bruto ingresado
  const raeeKg = totalClasifActual > 0 ? Math.round(pesoTotalKg * (clasifActual.desecho / totalClasifActual)) : 0

  const donutData  = DONUT_LABELS.map((label, i) => ({
    name: label,
    value: i === 0 ? clasifActual.reutilizable : i === 1 ? clasifActual.reciclable : clasifActual.desecho,
  }))
  const donutTotal = totalClasifActual

  // ── Gráfico de barras: ingresados vs. clasificados por sub-período ─────
  const bucketKeyOf = (iso: string) =>
    activePreset ? getBucketKey(iso, activePreset) : getBucketKeyCustom(iso, rango.fechaDesde, rango.fechaHasta)

  const barData = useMemo(() => {
    const order = activePreset ? getBucketOrder(activePreset, rango) : getBucketOrderCustom(rango.fechaDesde, rango.fechaHasta)
    const ingresadosPorBucket = new Map<string, number>()
    const clasificadosPorBucket = new Map<string, number>()

    donacionesActuales.forEach(d => {
      const key = bucketKeyOf(d.createdAt)
      ingresadosPorBucket.set(key, (ingresadosPorBucket.get(key) ?? 0) + 1)
    })

    materialesActuales.forEach(m => {
      // "A definir" (o sin condición) = todavía sin clasificar: no cuenta como material clasificado
      if (esCondicionSinClasificar(condicionPorId.get(m.condicionMaterialId ?? -1))) return
      const key = bucketKeyOf(m.createdAt)
      clasificadosPorBucket.set(key, (clasificadosPorBucket.get(key) ?? 0) + 1)
    })

    return order.map(key => ({
      name: key,
      ingresados: ingresadosPorBucket.get(key) ?? 0,
      clasificados: clasificadosPorBucket.get(key) ?? 0,
    }))
  }, [donacionesActuales, materialesActuales, activePreset, rango, condicionPorId])

  // ── Gráfico de dona: modalidad de recepción (sucursal vs. retiro) ──────
  const recepcionData = useMemo(() => {
    let sucursal = 0, retiro = 0
    donacionesActuales.forEach(d => { d.necesitaRetiro ? retiro++ : sucursal++ })
    return RECEPCION_LABELS.map((name, i) => ({ name, value: i === 0 ? sucursal : retiro }))
  }, [donacionesActuales])
  const recepcionTotal = recepcionData[0].value + recepcionData[1].value

  // ── Gráfico combinado (barra + línea + área) por sub-período ───────────
  const comboData = useMemo(() => {
    const pesoPorBucket = new Map<string, number>()
    lotesFiltrados.forEach(l => {
      if (!l.createdAt) return
      const key = bucketKeyOf(l.createdAt)
      pesoPorBucket.set(key, (pesoPorBucket.get(key) ?? 0) + Number(l.pesoBrutoKg ?? 0))
    })
    return barData.map(b => ({
      ...b,
      pesoKg: Math.round((pesoPorBucket.get(b.name) ?? 0) * 10) / 10,
    }))
  }, [barData, lotesFiltrados, activePreset, rango])

  // ── Tabla de movimientos de lotes ───────────────────────────────────────
  const materialesPorLote = useMemo(() => {
    const map = new Map<number, typeof todosMateriales>()
    todosMateriales.forEach(m => {
      const loteId = m.loteId ?? -1
      const arr = map.get(loteId) ?? []
      arr.push(m)
      map.set(loteId, arr)
    })
    return map
  }, [todosMateriales])

  type FilaTabla = { loteId: number; id: string; donanteId: number | null; donante: string; fechaIso: string; fecha: string; pesoKg: number; estado: string }

  // Todos los lotes del donante global (sin recortar por período: la sección tiene su propio filtro de fechas).
  // Más recientes primero; a igual fecha, por número de lote descendente
  const filasTabla: FilaTabla[] = useMemo(() => {
    return lotes
      .filter(l => incluyeDonante(l.donacion?.donanteId))
      .sort((a, b) => (b.createdAt ?? "").slice(0, 10).localeCompare((a.createdAt ?? "").slice(0, 10)) || b.id - a.id)
      .map(l => {
        const materiales = materialesPorLote.get(l.id) ?? []
        const nombres = materiales.map(m => (condicionPorId.get(m.condicionMaterialId ?? -1) ?? "").toLowerCase())
        let estado = "En proceso"
        if (materiales.length > 0 && nombres.every(n => n.includes("desecho"))) estado = "Desechado"
        else if (materiales.length > 0 && nombres.every(n => !esCondicionSinClasificar(n))) estado = "Clasificado"

        return {
          loteId: l.id,
          id: `LOT-${String(l.id).padStart(4, "0")}`,
          donanteId: l.donacion?.donanteId ?? null,
          donante: (l.donacion ? donantePorId.get(l.donacion.donanteId) : undefined) ?? "—",
          fechaIso: (l.createdAt ?? "").slice(0, 10),
          fecha: formatDate(l.createdAt ?? null) ?? "—",
          pesoKg: Number(l.pesoBrutoKg ?? 0),
          estado,
        }
      })
  }, [lotes, donanteSeleccionado, donantePorId, materialesPorLote, condicionPorId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Filtros propios de la sección de lotes. Sin fechas elegidas, se usa el período global;
  // con alguna fecha elegida, se filtra solo por ese rango (permite consultar meses anteriores)
  const usaFechasLotes = !!lotesDesde || !!lotesHasta
  const lotesRangoDesde = usaFechasLotes ? lotesDesde : rango.fechaDesde
  const lotesRangoHasta = usaFechasLotes ? lotesHasta : rango.fechaHasta

  const lotesFiltrosActivos = !!lotesDesde || !!lotesHasta || lotesEstado !== "" || lotesDonanteId !== "" || !!search

  function limpiarFiltrosLotes() {
    setLotesDesde("")
    setLotesHasta("")
    setLotesEstado("")
    setLotesDonanteId("")
    setSearch("")
  }

  const filasBuscadas = useMemo(() => filasTabla.filter(f =>
    !!f.fechaIso &&
    (!lotesRangoDesde || f.fechaIso >= lotesRangoDesde) &&
    (!lotesRangoHasta || f.fechaIso <= lotesRangoHasta) &&
    (lotesEstado === "" || f.estado === lotesEstado) &&
    (lotesDonanteId === "" || f.donanteId === lotesDonanteId) &&
    (!search || f.donante.toLowerCase().includes(search.toLowerCase()))
  ), [filasTabla, lotesRangoDesde, lotesRangoHasta, lotesEstado, lotesDonanteId, search])

  const filasVisibles = useMemo(() => filasBuscadas.slice(0, 25), [filasBuscadas])

  // Donantes que tienen lotes en el período, para el filtro de la sección
  const donantesConLotes = useMemo(() => {
    const ids = new Set(filasTabla.map(f => f.donanteId).filter((id): id is number => id !== null))
    return donantes.filter(d => ids.has(d.id))
  }, [filasTabla, donantes])

  // Gráfico de lotes: cantidad por mes de ingreso, apilada por estado (orden cronológico)
  const lotesChartData = useMemo(() => {
    const porMes = new Map<string, { fecha: string; pesoKg: number } & Record<string, number | string>>()
    filasBuscadas.forEach(f => {
      if (!f.fechaIso) return
      const mes = f.fechaIso.slice(0, 7)
      const [anio, m] = mes.split("-").map(Number)
      const etiqueta = new Date(anio, m - 1, 1).toLocaleDateString("es-AR", { month: "short", year: "2-digit" }).replace(".", "")
      const row = porMes.get(mes) ?? { fecha: etiqueta, pesoKg: 0, "En proceso": 0, "Clasificado": 0, "Desechado": 0 }
      row[f.estado] = (row[f.estado] as number) + 1
      row.pesoKg = Math.round((row.pesoKg + f.pesoKg) * 10) / 10
      porMes.set(mes, row)
    })
    return [...porMes.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, row]) => row)
  }, [filasBuscadas])

  const exportColumns: ExportColumn<FilaTabla>[] = [
    { header: "Fecha ingreso", accessor: f => f.fecha },
    { header: "Nro. Lote", accessor: f => f.id },
    { header: "Donante", accessor: f => f.donante },
    { header: "Peso (kg)", accessor: f => f.pesoKg },
    { header: "Estado actual", accessor: f => f.estado },
  ]

  const handleExportPdf = () => {
    exportToPdf(filasVisibles, exportColumns, {
      fileName: "movimientos-lotes",
      title: "Últimos movimientos de lotes",
    })
  }

  const handleExportExcel = () => {
    exportToExcel(filasVisibles, exportColumns, {
      fileName: "movimientos-lotes",
      sheetName: "Lotes",
    })
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Toolbar global: queda fija debajo de la cabecera al desplazarse */}
      <div className="sticky top-14 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card shadow-md ring-1 ring-foreground/5 p-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">Reboot IT Analytics</h1>
          <p className="text-sm text-muted-foreground">Panel de control operativo — {rango.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["mes", "trimestre", "semestre", "año"] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => elegirPeriodo(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                activePreset === p
                  ? "bg-blue-50 border-blue-400 text-blue-800 font-medium dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {PERIODO_LABELS[p]}
            </button>
          ))}
          <div className={`flex items-center gap-0.5 rounded-lg border px-1 py-0.5 ${usaRangoCustom ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-border"}`}>
            <DatePicker
              value={customDesde}
              onChange={v => v && handleCustomDesdeChange(v)}
              max={customHasta || undefined}
              aria-label="Fecha desde"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <DatePicker
              value={customHasta}
              onChange={v => v && handleCustomHastaChange(v)}
              min={customDesde || undefined}
              aria-label="Fecha hasta"
            />
            {activePreset === null && (customDesde !== defaultDesde() || customHasta !== defaultHasta()) && (
              <button
                onClick={limpiarFiltro}
                className="text-xs text-muted-foreground hover:text-foreground px-1.5"
                title="Volver al rango por defecto (últimos 3 meses)"
              >
                ✕
              </button>
            )}
          </div>
          <MultiSelect
            options={opcionesDonantes}
            value={donanteIds}
            onChange={setDonanteIds}
            placeholder="Todos los donantes"
            pluralLabel="donantes"
            searchPlaceholder="Buscar donante…"
            aria-label="Filtrar por donantes"
          />
          <button
            onClick={restablecer}
            className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            title="Limpia el filtro general y los filtros de cada gráfico"
          >
            <RotateCcw className="size-3" />
            Restablecer
          </button>
        </div>
      </div>

      {/* Trabajo pendiente e indicadores del circuito */}
      <TrabajoPendiente resumen={resumen} />
      <IndicadoresCircuito resumen={resumen} />

      {/* Nivel 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <KpiCard
          label="Total donaciones recibidas"
          value={isLoading ? "…" : donacionesActuales.length}
          trend={isLoading ? undefined : trendDonaciones}
        />
        <KpiCard
          label="Efectividad de recuperación"
          value={isLoading ? "…" : recuperacionPct !== null ? `${recuperacionPct}%` : "—"}
          trend={isLoading ? undefined : trendRecuperacion}
        />
        <KpiCard
          label="Basura electrónica desechada (RAEE)"
          value={isLoading ? "…" : `${raeeKg} kg`}
          sub="estimado según % de descarte sobre el peso bruto ingresado"
        />
      </div>

      {/* Gráficos: cada usuario los acomoda a su gusto */}
      <GrillaGraficos
        items={[
          { id: "destino-materiales", w: 4, h: 11, nodo: (
            <div className="flex h-full flex-col rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
            <p className="text-sm font-medium text-foreground mb-1">Distribución de destino de materiales</p>
            <p className="text-xs text-muted-foreground mb-3">Destino final de los materiales clasificados — {rango.label}</p>
            {donutTotal === 0 ? (
              <div className="min-h-[140px] flex-1 flex items-center justify-center text-xs text-muted-foreground text-center px-6">
                Sin materiales clasificados en este período{donanteIds.length > 0 ? " para los donantes seleccionados" : ""}.
              </div>
            ) : (
              <>
                <div className="relative min-h-[130px] flex-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={donutData}
                        cx="50%" cy="50%"
                        innerRadius="62%" outerRadius="92%"
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {donutData.map((_, i) => (
                          <Cell key={i} fill={DONUT_COLORS[i]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => [`${value ?? 0} materiales`]}
                        contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-medium text-foreground leading-none">{donutTotal}</span>
                    <span className="text-xs text-muted-foreground mt-1">materiales</span>
                  </div>
                </div>
                <div className="mt-2 flex flex-col gap-1.5">
                  {DONUT_LABELS.map((label, i) => {
                    const pct = Math.round(donutData[i].value / donutTotal * 100)
                    return (
                      <div key={i} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex items-center gap-2 text-muted-foreground min-w-0">
                          <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: DONUT_COLORS[i] }}></span>
                          <span className="truncate">{label}</span>
                        </span>
                        <span className="text-muted-foreground tabular-nums flex-shrink-0">
                          {donutData[i].value} <span className="font-medium text-foreground">({pct}%)</span>
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
          ) },
          { id: "ingreso-procesamiento", w: 4, h: 10, nodo: (
            <div className="flex h-full flex-col rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Ingreso vs. procesamiento</p>
          <p className="text-xs text-muted-foreground mb-4">Donaciones ingresadas vs. materiales clasificados por el laboratorio — {rango.label}</p>
          <div className="flex gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-sm inline-block" style={{background:"#378ADD"}}></span>Ingresados
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-sm inline-block" style={{background:"#639922"}}></span>Clasificados
            </span>
          </div>
          <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={150}>
            <BarChart data={barData} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
              <XAxis dataKey="name" height={ALTO_EJE_X} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={etiquetaX("Período")} />
              <YAxis width={48} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} label={etiquetaY("Cantidad")} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
                cursor={{ fill: "rgba(128,128,128,0.07)" }}
              />
              <Bar dataKey="ingresados"  name="Ingresados"  fill="#378ADD" radius={[4,4,0,0]} />
              <Bar dataKey="clasificados" name="Clasificados" fill="#639922" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
          ) },
          { id: "modalidad-recepcion", w: 4, h: 11, nodo: (
            <div className="flex h-full flex-col rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Modalidad de recepción</p>
          <p className="text-xs text-muted-foreground mb-4">Donaciones entregadas en sucursal vs. retiradas a domicilio — {rango.label}</p>
          {recepcionTotal === 0 ? (
            <div className="min-h-[140px] flex-1 flex items-center justify-center text-xs text-muted-foreground text-center px-6">
              Sin donaciones registradas en este período{donanteIds.length > 0 ? " para los donantes seleccionados" : ""}.
            </div>
          ) : (
            <>
              <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={150}>
                <PieChart>
                  <Pie
                    data={recepcionData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={95}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {recepcionData.map((_, i) => (
                      <Cell key={i} fill={RECEPCION_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [`${value ?? 0} donaciones`]}
                    contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-1.5 mt-2">
                {RECEPCION_LABELS.map((label, i) => (
                  <span key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{background: RECEPCION_COLORS[i]}}></span>
                    {label} — {recepcionData[i].value} ({Math.round(recepcionData[i].value / recepcionTotal * 100)}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
          ) },
          { id: "tendencia-combinada", w: 6, h: 10, nodo: (
            <div className="flex h-full flex-col rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
          <p className="text-sm font-medium text-foreground mb-3">Donaciones, materiales clasificados y peso ingresado por mes</p>
          <div className="flex flex-wrap gap-4 mb-3">
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-sm inline-block" style={{background:"#378ADD"}}></span>Donaciones
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-2.5 border-t-2 inline-block" style={{borderColor:"#E24B4A"}}></span>Clasificados
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="w-3 h-3 rounded-sm inline-block opacity-50" style={{background:"#639922"}}></span>Peso ingresado (kg)
            </span>
          </div>
          <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={150}>
            <ComposedChart data={comboData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
              <XAxis dataKey="name" height={ALTO_EJE_X} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={etiquetaX("Mes")} />
              <YAxis yAxisId="left" width={48} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} label={etiquetaY("Cantidad")} />
              <YAxis yAxisId="right" orientation="right" width={52} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={etiquetaY("Peso (kg)", "derecha")} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
                cursor={{ fill: "rgba(128,128,128,0.07)" }}
              />
              <Area yAxisId="right" type="monotone" dataKey="pesoKg" name="Peso ingresado (kg)" fill="#639922" stroke="#639922" fillOpacity={0.18} />
              <Bar yAxisId="left" dataKey="ingresados" name="Donaciones" fill="#378ADD" radius={[4,4,0,0]} />
              <Line yAxisId="left" type="monotone" dataKey="clasificados" name="Clasificados" stroke="#E24B4A" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
          ) },
          { id: "uso-flota", w: 6, h: 11, nodo: <VehiculosUsoChart key={resetKey} /> },
          { id: "ultimos-lotes", w: 6, h: 11, nodo: (
            <div className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3">
            <p className="text-sm font-medium text-foreground">Últimos movimientos de lotes</p>
            <div className="inline-flex rounded-lg border border-border p-0.5" role="group" aria-label="Formato de visualización">
              {([["grafico", "Gráfico", BarChart3], ["tabla", "Tabla", Table2]] as const).map(([key, label, Icon]) => (
                <button
                  key={key}
                  onClick={() => setLotesVista(key)}
                  aria-pressed={lotesVista === key}
                  className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                    lotesVista === key
                      ? "bg-blue-50 text-blue-800 font-medium dark:bg-blue-900/30 dark:text-blue-300"
                      : "text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="size-3.5" />{label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExportPdf}
              disabled={filasVisibles.length === 0}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↓ Exportar PDF
            </button>
            <button
              onClick={handleExportExcel}
              disabled={filasVisibles.length === 0}
              className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ↓ Exportar Excel
            </button>
          </div>
        </div>

        {/* Filtros de la sección */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
          <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background px-1 py-0.5">
            <DatePicker
              value={lotesDesde}
              onChange={setLotesDesde}
              max={lotesHasta || undefined}
              placeholder="Desde"
              clearable
              aria-label="Lotes desde"
            />
            <span className="text-xs text-muted-foreground">→</span>
            <DatePicker
              value={lotesHasta}
              onChange={setLotesHasta}
              min={lotesDesde || undefined}
              placeholder="Hasta"
              clearable
              aria-label="Lotes hasta"
            />
          </div>
          {!usaFechasLotes && (
            <span className="text-xs text-muted-foreground">Período general: {rango.label}</span>
          )}
          <select
            value={lotesEstado}
            onChange={e => setLotesEstado(e.target.value)}
            className="text-xs h-8 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por estado"
          >
            <option value="">Todos los estados</option>
            {ESTADOS_LOTE.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
          <select
            value={lotesDonanteId}
            onChange={e => setLotesDonanteId(e.target.value === "" ? "" : Number(e.target.value))}
            className="text-xs h-8 px-3 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            aria-label="Filtrar por donante"
          >
            <option value="">Todos los donantes</option>
            {donantesConLotes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
          <SearchInput
            placeholder="Buscar donante…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-48"
          />
          {lotesFiltrosActivos && (
            <button onClick={limpiarFiltrosLotes} className="text-xs text-muted-foreground hover:text-foreground px-1">
              ✕ Limpiar filtros
            </button>
          )}
        </div>

        {lotesVista === "grafico" ? (
          <div className="flex min-h-0 flex-1 flex-col p-4">
            {isLoading ? (
              <div className="min-h-[200px] flex-1 flex items-center justify-center text-sm text-muted-foreground">Cargando…</div>
            ) : lotesChartData.length === 0 ? (
              <div className="min-h-[200px] flex-1 flex items-center justify-center text-sm text-muted-foreground">No se encontraron resultados.</div>
            ) : (
              <>
                <div className="flex flex-wrap gap-4 mb-3">
                  {ESTADOS_LOTE.map(e => (
                    <span key={e} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="w-3 h-3 rounded-sm inline-block" style={{ background: ESTADO_COLORS[e] }}></span>{e}
                    </span>
                  ))}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {filasBuscadas.length} lotes · {Math.round(filasBuscadas.reduce((a, f) => a + f.pesoKg, 0) * 10) / 10} kg
                  </span>
                </div>
                <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={200}>
                  <BarChart data={lotesChartData} barCategoryGap="25%">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
                    <XAxis dataKey="fecha" height={ALTO_EJE_X} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={etiquetaX("Mes de ingreso")} />
                    <YAxis width={52} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} label={etiquetaY("Cantidad de lotes")} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
                      cursor={{ fill: "rgba(128,128,128,0.07)" }}
                      formatter={(value, name) => [`${value} lotes`, name]}
                      labelFormatter={(label, payload) => {
                        const peso = payload?.[0]?.payload?.pesoKg
                        return peso !== undefined ? `${label} — ${peso} kg` : label
                      }}
                    />
                    {ESTADOS_LOTE.map((e, i) => (
                      <Bar
                        key={e}
                        dataKey={e}
                        name={e}
                        stackId="estado"
                        fill={ESTADO_COLORS[e]}
                        radius={i === ESTADOS_LOTE.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
                <colgroup>
                  <col style={{ width: "140px" }} />
                  <col style={{ width: "110px" }} />
                  <col style={{ width: "180px" }} />
                  <col style={{ width: "120px" }} />
                  <col style={{ width: "140px" }} />
                </colgroup>
                <thead>
                  <tr className="bg-muted/60 text-xs text-muted-foreground">
                    <th className="px-4 py-2.5 text-left font-medium">Fecha ingreso</th>
                    <th className="px-4 py-2.5 text-left font-medium">Nro. Lote</th>
                    <th className="px-4 py-2.5 text-left font-medium">Donante</th>
                    <th className="px-4 py-2.5 text-left font-medium">Peso (kg)</th>
                    <th className="px-4 py-2.5 text-left font-medium">Estado actual</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {isLoading ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">Cargando…</td></tr>
                  ) : filasVisibles.length === 0 ? (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No se encontraron resultados.</td></tr>
                  ) : (
                    filasVisibles.map(l => (
                      <tr key={l.id} className="hover:bg-muted/30 transition-colors duration-100">
                        <td className="px-4 py-3 text-muted-foreground">{l.fecha}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                        <td className="px-4 py-3 text-foreground">{l.donante}</td>
                        <td className="px-4 py-3 text-muted-foreground">{l.pesoKg.toFixed(1)}</td>
                        <td className="px-4 py-3"><EstadoLoteBadge estado={l.estado} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {filasBuscadas.length > filasVisibles.length && (
              <p className="text-xs text-muted-foreground px-4 py-2 border-t border-border">
                Mostrando {filasVisibles.length} de {filasBuscadas.length} lotes. Ajustá los filtros para acotar la búsqueda.
              </p>
            )}
          </>
        )}
      </div>
          ) },
          ...itemsGraficosCircuito(resumen),
        ]}
      />

    </div>
  )
}
