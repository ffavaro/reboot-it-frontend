"use client"

import { useState, useMemo } from "react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"
import { useLotes } from "@/hooks/use-lote"
import { useDonantes } from "@/hooks/use-donantes"

// ── Tipos ──────────────────────────────────────────────────────────────────
type RangoFecha = "hoy" | "semana" | "mes" | "año"

// ── Datos mock hasta conectar con el back ─────────────────────────────────
const BAR_DATA: Record<RangoFecha, { name: string; ingresados: number; clasificados: number }[]> = {
  hoy:    [{ name: "Hoy", ingresados: 3, clasificados: 2 }],
  semana: ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"].map((d,i) => ({ name: d, ingresados: [3,4,2,5,2,1,1][i], clasificados: [2,3,2,4,1,1,1][i] })),
  mes:    ["Sem 1","Sem 2","Sem 3","Sem 4"].map((d,i) => ({ name: d, ingresados: [18,22,16,18][i], clasificados: [15,19,14,17][i] })),
  año:    ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((d,i) => ({
    name: d,
    ingresados:  [38,44,41,35,48,52,49,47,51,55,30,22][i],
    clasificados:[32,38,36,30,41,46,44,42,47,50,26,18][i],
  })),
}

const DONUT_COLORS = ["#639922", "#378ADD", "#E24B4A"]
const DONUT_LABELS = ["Reacondicionamiento / Donación social", "Stock de componentes", "Disposición final / Scrap"]

const KPI_RANGE: Record<RangoFecha, { donaciones: number; raee: string; recuperacion: string }> = {
  hoy:    { donaciones: 3,   raee: "124 kg", recuperacion: "67%" },
  semana: { donaciones: 18,  raee: "380 kg", recuperacion: "71%" },
  mes:    { donaciones: 74,  raee: "1.2 t",  recuperacion: "73%" },
  año:    { donaciones: 512, raee: "8.4 t",  recuperacion: "73%" },
}

const RANGO_LABELS: Record<RangoFecha, string> = {
  hoy: "Hoy", semana: "Últimos 7 días", mes: "Este mes", año: "Año actual"
}

// ── Componente KPI Card ────────────────────────────────────────────────────
function KpiCard({ label, value, sub, trend }: {
  label: string; value: string | number; sub?: string; trend?: { text: string; up: boolean }
}) {
  return (
    <div className="rounded-xl bg-muted/50 p-4 flex flex-col gap-1 min-w-0">
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
    "Certificado": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado] ?? "bg-muted text-muted-foreground"}`}>
      {estado}
    </span>
  )
}

// ── Página principal ───────────────────────────────────────────────────────
export default function DashboardPage() {
  const [rango, setRango] = useState<RangoFecha>("mes")
  const [empresaFiltro, setEmpresaFiltro] = useState("")
  const [search, setSearch] = useState("")

  // Datos reales del back
  const { lotes, isLoading: loadingLotes } = useLotes()
  const { donantes } = useDonantes()

  // KPIs derivados de datos reales
  const labCount   = useMemo(() => lotes.filter(l => l.isActive).length, [lotes])
  const raeeKg     = useMemo(() => lotes.reduce((acc, l) => acc + (l.pesoBrutoKg ?? 0), 0), [lotes])
  const kpi        = KPI_RANGE[rango]
  const barData    = BAR_DATA[rango]

  const donutData  = [
    { name: DONUT_LABELS[0], value: 33 },
    { name: DONUT_LABELS[1], value: 22 },
    { name: DONUT_LABELS[2], value: 19 },
  ]

  // Tabla de lotes enriquecida (mock de técnico y estado hasta que el back lo exponga)
  const MOCK_DETALLE = [
    { id: "LOT-0091", donante: "TechCorp SA",   fecha: "09/06/2026", tecnico: "M. Fernández", estado: "En proceso"  },
    { id: "LOT-0090", donante: "Banco Nación",  fecha: "08/06/2026", tecnico: "R. Gómez",     estado: "Clasificado" },
    { id: "LOT-0089", donante: "UNC",           fecha: "07/06/2026", tecnico: "L. Ríos",      estado: "Certificado" },
    { id: "LOT-0088", donante: "Municipalidad", fecha: "06/06/2026", tecnico: "M. Fernández", estado: "Desechado"   },
    { id: "LOT-0087", donante: "Particular",    fecha: "05/06/2026", tecnico: "R. Gómez",     estado: "Clasificado" },
    { id: "LOT-0086", donante: "TechCorp SA",   fecha: "04/06/2026", tecnico: "L. Ríos",      estado: "En proceso"  },
  ]

  const empresas = [...new Set(MOCK_DETALLE.map(l => l.donante))]

  const filteredLotes = MOCK_DETALLE.filter(l => {
    const matchSearch  = !search || l.donante.toLowerCase().includes(search.toLowerCase()) || l.tecnico.toLowerCase().includes(search.toLowerCase())
    const matchEmpresa = !empresaFiltro || l.donante === empresaFiltro
    return matchSearch && matchEmpresa
  })

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">

      {/* Toolbar global */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-medium text-foreground">RebootIT Analytics</h1>
          <p className="text-sm text-muted-foreground">Panel de control operativo — {RANGO_LABELS[rango]}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["hoy","semana","mes","año"] as RangoFecha[]).map(r => (
            <button
              key={r}
              onClick={() => setRango(r)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all duration-150 ${
                rango === r
                  ? "bg-blue-50 border-blue-400 text-blue-800 font-medium dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              {RANGO_LABELS[r]}
            </button>
          ))}
          <select
            value={empresaFiltro}
            onChange={e => setEmpresaFiltro(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg border border-border bg-background text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Todos los donantes</option>
            {empresas.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Nivel 1 — KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard
          label="Total donaciones recibidas"
          value={kpi.donaciones}
          trend={{ text: "+12% vs mes anterior", up: true }}
        />
        <KpiCard
          label="Hardware en laboratorio"
          value={loadingLotes ? "…" : labCount}
          sub="lotes pendientes de clasificación"
        />
        <KpiCard
          label="Efectividad de recuperación"
          value={kpi.recuperacion}
          trend={{ text: "+3.2% vs mes anterior", up: true }}
        />
        <KpiCard
          label="Basura electrónica desechada (RAEE)"
          value={loadingLotes ? "…" : raeeKg > 0 ? `${raeeKg.toFixed(0)} kg` : kpi.raee}
          sub="derivados a disposición final certificada"
        />
      </div>

      {/* Nivel 2 — Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        {/* Gráfico de barras */}
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-1">Ingreso vs. procesamiento mensual</p>
          <p className="text-xs text-muted-foreground mb-4">Equipos ingresados por donación vs. clasificados por el laboratorio</p>
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
              <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-medium text-foreground mb-1">Distribución de destino de materiales</p>
          <p className="text-xs text-muted-foreground mb-4">Destino final de los materiales procesados</p>
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
                formatter={(value) => [`${value ?? 0} lotes`]}
                contentStyle={{ borderRadius: 8, border: "0.5px solid rgba(128,128,128,0.2)", fontSize: 12 }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-1.5 mt-2">
            {DONUT_LABELS.map((label, i) => (
              <span key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{background: DONUT_COLORS[i]}}></span>
                {label} — {donutData[i].value} lotes ({Math.round(donutData[i].value / donutData.reduce((a,b)=>a+b.value,0) * 100)}%)
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Nivel 3 — Tabla */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-border">
          <p className="text-sm font-medium text-foreground">Últimos movimientos de lotes</p>
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Buscar técnico o donante…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="text-xs px-3 py-1.5 pl-8 rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring w-48"
              style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.35-4.35'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "10px center" }}
            />
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
              ↓ Exportar PDF
            </button>
            <button className="text-xs px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted transition-colors flex items-center gap-1.5">
              ↓ Exportar Excel
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "100px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "160px" }} />
              <col style={{ width: "140px" }} />
            </colgroup>
            <thead>
              <tr className="bg-muted/50 text-xs text-muted-foreground">
                <th className="px-4 py-2.5 text-left font-medium">ID Lote</th>
                <th className="px-4 py-2.5 text-left font-medium">Donante</th>
                <th className="px-4 py-2.5 text-left font-medium">Fecha ingreso</th>
                <th className="px-4 py-2.5 text-left font-medium">Técnico responsable</th>
                <th className="px-4 py-2.5 text-left font-medium">Estado actual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLotes.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-muted-foreground">No se encontraron resultados.</td></tr>
              ) : (
                filteredLotes.map(l => (
                  <tr key={l.id} className="hover:bg-muted/30 transition-colors duration-100">
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{l.id}</td>
                    <td className="px-4 py-3 text-foreground">{l.donante}</td>
                    <td className="px-4 py-3 text-muted-foreground">{l.fecha}</td>
                    <td className="px-4 py-3 text-foreground">{l.tecnico}</td>
                    <td className="px-4 py-3"><EstadoBadge estado={l.estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}

