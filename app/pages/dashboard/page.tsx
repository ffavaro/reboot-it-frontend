"use client"

import { useState, useMemo } from "react"
import { SearchInput } from "@/components/ui/search-input"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, ComposedChart, Line, Area
} from "recharts"
import { useLotes } from "@/hooks/use-lote"
import { useDonantes } from "@/hooks/use-donantes"
import { useDonacionReporte } from "@/hooks/use-donacion"
import { useMateriales, useMaterialReporte } from "@/hooks/use-material"
import { useCondicionesMaterial } from "@/hooks/use-condicion-material"
import { exportToPdf, exportToExcel, type ExportColumn } from "@/lib/utils/export"
import { formatDate } from "@/lib/utils/helpers"
import {
  type Periodo, PERIODO_LABELS, getRangoFechas, getRangoAnterior,
  getBucketOrder, getBucketKey, clasificarMateriales, pctChange,
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
function EstadoBadge({ estado }: { estado: string }) {
  const styles: Record<string, string> = {
    "En proceso":  "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
    "Clasificado": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
    "Desechado":   "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado] ?? "bg-muted text-muted-foreground"}`}>
      {estado}
    </span>
  )
}

// ── Página principal ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [periodo, setPeriodo] = useState<Periodo>("mes")
  const [donanteId, setDonanteId] = useState<number | "">("")
  const [search, setSearch] = useState("")

  // Rango de fechas del período seleccionado y del período anterior (para comparar tendencias)
  const rango = useMemo(() => getRangoFechas(periodo), [periodo])
  const rangoAnterior = useMemo(() => getRangoAnterior(periodo), [periodo])

  // ── Datos base ────────────────────────────────────────────────────────
  const { lotes, isLoading: loadingLotes } = useLotes()
  const { donantes, isLoading: loadingDonantes } = useDonantes()
  const { condiciones, isLoading: loadingCondiciones } = useCondicionesMaterial()
  const { materiales: todosMateriales, isLoading: loadingTodosMateriales } = useMateriales()

  const reporteParams: ReporteDonacionQuery = useMemo(() => ({
    fechaDesde: rango.fechaDesde, fechaHasta: rango.fechaHasta,
    ...(donanteId !== "" ? { donanteId } : {}),
  }), [rango, donanteId])

  const reporteParamsAnterior: ReporteDonacionQuery = useMemo(() => ({
    fechaDesde: rangoAnterior.fechaDesde, fechaHasta: rangoAnterior.fechaHasta,
    ...(donanteId !== "" ? { donanteId } : {}),
  }), [rangoAnterior, donanteId])

  const { donaciones: donacionesActuales, isLoading: loadingDonacionesActuales } = useDonacionReporte(reporteParams)
  const { donaciones: donacionesAnteriores, isLoading: loadingDonacionesAnteriores } = useDonacionReporte(reporteParamsAnterior)

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
    donanteId === "" ? materialesActualesRaw : materialesActualesRaw.filter(m => loteDonanteMap.get(m.loteId) === donanteId)
  ), [materialesActualesRaw, loteDonanteMap, donanteId])

  const materialesAnteriores = useMemo(() => (
    donanteId === "" ? materialesAnterioresRaw : materialesAnterioresRaw.filter(m => loteDonanteMap.get(m.loteId) === donanteId)
  ), [materialesAnterioresRaw, loteDonanteMap, donanteId])

  const condicionPorId = useMemo(() => new Map(condiciones.map(c => [c.id, c.condicion])), [condiciones])
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
  const labCount = useMemo(() => lotes.filter(l => l.isActive && (donanteId === "" || l.donacion?.donanteId === donanteId)).length, [lotes, donanteId])

  const lotesFiltrados = useMemo(() => lotes.filter(l => {
    const matchDonante = donanteId === "" || l.donacion?.donanteId === donanteId
    const fecha = l.createdAt?.slice(0, 10)
    const matchFecha = !!fecha && fecha >= rango.fechaDesde && fecha <= rango.fechaHasta
    return matchDonante && matchFecha
  }), [lotes, donanteId, rango])

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
  const barData = useMemo(() => {
    const order = getBucketOrder(periodo, rango)
    const ingresadosPorBucket = new Map<string, number>()
    const clasificadosPorBucket = new Map<string, number>()

    donacionesActuales.forEach(d => {
      const key = getBucketKey(d.createdAt, periodo)
      ingresadosPorBucket.set(key, (ingresadosPorBucket.get(key) ?? 0) + 1)
    })

    materialesActuales.forEach(m => {
      const nombre = (condicionPorId.get(m.condicionMaterialId) ?? "").toLowerCase()
      if (!nombre || nombre.includes("pendiente")) return
      const key = getBucketKey(m.createdAt, periodo)
      clasificadosPorBucket.set(key, (clasificadosPorBucket.get(key) ?? 0) + 1)
    })

    return order.map(key => ({
      name: key,
      ingresados: ingresadosPorBucket.get(key) ?? 0,
      clasificados: clasificadosPorBucket.get(key) ?? 0,
    }))
  }, [donacionesActuales, materialesActuales, periodo, rango, condicionPorId])

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
      const key = getBucketKey(l.createdAt, periodo)
      pesoPorBucket.set(key, (pesoPorBucket.get(key) ?? 0) + Number(l.pesoBrutoKg ?? 0))
    })
    return barData.map(b => ({
      ...b,
      pesoKg: Math.round((pesoPorBucket.get(b.name) ?? 0) * 10) / 10,
    }))
  }, [barData, lotesFiltrados, periodo])

  // ── Tabla de movimientos de lotes ───────────────────────────────────────
  const materialesPorLote = useMemo(() => {
    const map = new Map<number, typeof todosMateriales>()
    todosMateriales.forEach(m => {
      const arr = map.get(m.loteId) ?? []
      arr.push(m)
      map.set(m.loteId, arr)
    })
    return map
  }, [todosMateriales])

  type FilaTabla = { id: string; donante: string; fecha: string; pesoKg: number; estado: string }

  const filasTabla: FilaTabla[] = useMemo(() => {
    return [...lotesFiltrados]
      .sort((a, b) => (b.createdAt ?? "").localeCompare(a.createdAt ?? ""))
      .map(l => {
        const materiales = materialesPorLote.get(l.id) ?? []
        const nombres = materiales.map(m => (condicionPorId.get(m.condicionMaterialId) ?? "").toLowerCase())
        let estado = "En proceso"
        if (materiales.length > 0 && nombres.every(n => n.includes("desecho"))) estado = "Desechado"
        else if (materiales.length > 0 && nombres.every(n => n && !n.includes("pendiente"))) estado = "Clasificado"

        return {
          id: `LOT-${String(l.id).padStart(4, "0")}`,
          donante: (l.donacion ? donantePorId.get(l.donacion.donanteId) : undefined) ?? "—",
          fecha: formatDate(l.createdAt ?? null) ?? "—",
          pesoKg: Number(l.pesoBrutoKg ?? 0),
          estado,
        }
      })
  }, [lotesFiltrados, donantePorId, materialesPorLote, condicionPorId])

  const filasBuscadas = useMemo(() => (
    search ? filasTabla.filter(f => f.donante.toLowerCase().includes(search.toLowerCase())) : filasTabla
  ), [filasTabla, search])

  const filasVisibles = useMemo(() => filasBuscadas.slice(0, 25), [filasBuscadas])

  const exportColumns: ExportColumn<FilaTabla>[] = [
    { header: "ID Lote", accessor: f => f.id },
    { header: "Donante", accessor: f => f.donante },
    { header: "Fecha ingreso", accessor: f => f.fecha },
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

      {/* Toolbar global */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
        <div>
          <h1 className="text-xl font-medium text-foreground">RebootIT Analytics</h1>
          <p className="text-sm text-muted-foreground">Panel de control operativo — {rango.label}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["mes", "trimestre", "semestre", "año"] as Periodo[]).map(p => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                periodo === p
                  ? "bg-blue-50 border-blue-400 text-blue-800 font-medium dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {PERIODO_LABELS[p]}
            </button>
          ))}
          <select
            value={donanteId}
            onChange={e => setDonanteId(e.target.value === "" ? "" : Number(e.target.value))}
            className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los donantes</option>
            {donantes.map(d => <option key={d.id} value={d.id}>{d.nombre}</option>)}
          </select>
        </div>
      </div>

      {/* Nivel 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total donaciones recibidas"
          value={isLoading ? "…" : donacionesActuales.length}
          trend={isLoading ? undefined : trendDonaciones}
        />
        <KpiCard
          label="Hardware en laboratorio"
          value={isLoading ? "…" : labCount}
          sub="lotes activos pendientes de clasificación"
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

      {/* Nivel 2 — Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Gráfico de barras */}
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
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
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData} barCategoryGap="30%" barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
                cursor={{ fill: "rgba(128,128,128,0.07)" }}
              />
              <Bar dataKey="ingresados"  name="Ingresados"  fill="#378ADD" radius={[4,4,0,0]} />
              <Bar dataKey="clasificados" name="Clasificados" fill="#639922" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de dona */}
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Distribución de destino de materiales</p>
          <p className="text-xs text-muted-foreground mb-4">Destino final de los materiales clasificados — {rango.label}</p>
          {donutTotal === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground text-center px-6">
              Sin materiales clasificados en este período{donanteId !== "" ? " para el donante seleccionado" : ""}.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%" cy="50%"
                    innerRadius={60} outerRadius={95}
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
              <div className="flex flex-col gap-1.5 mt-2">
                {DONUT_LABELS.map((label, i) => (
                  <span key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{background: DONUT_COLORS[i]}}></span>
                    {label} — {donutData[i].value} ({Math.round(donutData[i].value / donutTotal * 100)}%)
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Nivel 2.5 — Recepción y tendencia combinada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Gráfico de dona: sucursal vs. retiro */}
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Modalidad de recepción</p>
          <p className="text-xs text-muted-foreground mb-4">Donaciones entregadas en sucursal vs. retiradas a domicilio — {rango.label}</p>
          {recepcionTotal === 0 ? (
            <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground text-center px-6">
              Sin donaciones registradas en este período{donanteId !== "" ? " para el donante seleccionado" : ""}.
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
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

        {/* Gráfico combinado: barra + línea + área */}
        <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
          <p className="text-sm font-medium text-foreground mb-1">Tendencia combinada</p>
          <p className="text-xs text-muted-foreground mb-4">Donaciones, materiales clasificados y peso ingresado por sub-período — {rango.label}</p>
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
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={comboData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
      </div>

      {/* Nivel 3 — Tabla */}
      <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Últimos movimientos de lotes</p>
          <div className="flex flex-wrap gap-2">
            <SearchInput
              placeholder="Buscar donante…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-48"
            />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "100px" }} />
              <col style={{ width: "180px" }} />
              <col style={{ width: "140px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "140px" }} />
            </colgroup>
            <thead>
              <tr className="bg-muted/60 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">ID Lote</th>
                <th className="px-4 py-2.5 text-left font-medium">Donante</th>
                <th className="px-4 py-2.5 text-left font-medium">Fecha ingreso</th>
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
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                    <td className="px-4 py-3 text-foreground">{l.donante}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.fecha}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.pesoKg.toFixed(1)}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={l.estado} /></td>
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
      </div>

    </div>
  )
}
