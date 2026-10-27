"use client"

import { useMemo } from "react"
import {
  Bar, BarChart, CartesianGrid, Legend, LabelList, PolarAngleAxis, RadialBar, RadialBarChart, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts"
import type { DashboardResumen } from "@/lib/type/dashboard"
import type { ItemGrilla } from "@/components/dashboard/grilla-graficos"
import { etiquetaX, etiquetaY, ALTO_EJE_X } from "@/components/dashboard/ejes"

type Graficos = DashboardResumen["graficos"]

const num = (n: number) => n.toLocaleString("es-AR")
const dec = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 })
const PALETA = ["#378ADD", "#639922", "#F5A623", "#E24B4A", "#8B5CF6", "#14B8A6", "#EC4899"]
const textoLeyenda = (valor: string) => <span className="text-foreground">{valor}</span>
const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

const nombreMes = (mes: string, conAnio: boolean) => {
  const [anio, m] = mes.split("-").map(Number)
  const nombre = new Date(anio, m - 1, 1).toLocaleDateString("es-AR", { month: "long" })
  const capital = nombre.charAt(0).toUpperCase() + nombre.slice(1)
  return conAnio ? `${capital} ${anio}` : capital
}

type PropsEtiqueta = { x?: number | string; y?: number | string; width?: number | string; height?: number | string; index?: number; value?: number | string }

function Panel({ titulo, subtitulo, children, vacio }: { titulo: string; subtitulo?: string; children?: React.ReactNode; vacio?: string }) {
  return (
    <div className="flex h-full min-w-0 flex-col rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4">
      <p className="text-sm font-medium text-foreground">{titulo}</p>
      {subtitulo && <p className="mb-3 mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>}
      {vacio ? (
        <div className="flex min-h-[120px] flex-1 items-center justify-center px-6 text-center text-xs text-muted-foreground">{vacio}</div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">{children}</div>
      )}
    </div>
  )
}

// ── 1. Tiempo de espera por etapa (barras radiales) ───────────────────────────
const ETAPAS = [
  { key: "espera", nombre: "Espera de retiro", color: "#F5A623" },
  { key: "clasificacion", nombre: "Clasificación", color: "#639922" },
  { key: "destruccionPallet", nombre: "Destrucción y pallet", color: "#8B5CF6" },
  { key: "certificacion", nombre: "Certificación", color: "#378ADD" },
] as const

export function CicloPorEtapaChart({ datos, promedioCiclo }: { datos: Graficos["cicloPorEtapa"]; promedioCiclo?: number | null }) {
  if (!datos || datos.meses.length === 0) {
    return <Panel titulo="Tiempo de espera por etapa" subtitulo="Etapa × días promedio" vacio="Todavía no hay donaciones con certificado emitido en el período." />
  }
  const filas = ETAPAS.map((e) => ({ nombre: e.nombre, dias: datos.promedio[e.key], fill: e.color }))
  const maxDias = Math.max(1, ...filas.map((x) => x.dias))
  const total = promedioCiclo ?? filas.reduce((sum, x) => sum + x.dias, 0)
  const larga = filas.reduce((x, y) => (y.dias > x.dias ? y : x))
  return (
    <Panel
      titulo="Tiempo de espera por etapa"
      subtitulo={`Días promedio por etapa · ${larga.nombre.toLowerCase()} es la más larga: ${dec(larga.dias)} de ${dec(total)} días en promedio (${num(datos.donaciones)} donaciones)`}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <ResponsiveContainer className="min-h-[190px]" width="100%" height="100%" minHeight={190}>
          <RadialBarChart data={filas} innerRadius="22%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={14}>
            <PolarAngleAxis type="number" domain={[0, maxDias * 1.15]} tick={false} />
            <RadialBar dataKey="dias" background cornerRadius={7} />
            <Tooltip formatter={(v, _n, p) => [`${dec(Number(v))} días`, String(p?.payload?.nombre ?? "")]} />
          </RadialBarChart>
        </ResponsiveContainer>
        <ul className="flex flex-col gap-2 text-xs">
          {filas.map((x) => (
            <li key={x.nombre} className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-sm" style={{ background: x.fill }} aria-hidden />
              <span className="text-foreground">{x.nombre}</span>
              <span className="ml-auto pl-3 font-medium tabular-nums text-foreground">{dec(x.dias)} d</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Etapas: registro hasta el retiro (o el turno, si se entrega en sucursal), retiro hasta la clasificación, clasificación hasta el pallet y pallet hasta el certificado.
      </p>
    </Panel>
  )
}

// ── 2. Destino por tipo de material (barras al 100 %) ─────────────────────────
export function DestinoPorTipoChart({ datos }: { datos: Graficos["destinoPorTipo"] }) {
  const { filas, pctTotal, totalMateriales, top } = useMemo(() => {
    const totalMateriales = datos.reduce((s, x) => s + x.total, 0)
    const reut = datos.reduce((s, x) => s + x.reutilizable, 0)
    const filas = datos.map((x) => ({ ...x, etiqueta: `${x.tipo} (${x.total})`, pct: x.reutilizable / x.total }))
    const top = [...datos].filter((x) => x.total >= 5).sort((a, b) => b.reutilizable / b.total - a.reutilizable / a.total).slice(0, 3).map((x) => x.tipo)
    return { filas, pctTotal: totalMateriales > 0 ? reut / totalMateriales : 0, totalMateriales, top }
  }, [datos])

  if (filas.length === 0) {
    return <Panel titulo="Destino por tipo de material" subtitulo="Tipo × condición × cantidad" vacio="Sin materiales clasificados en el período." />
  }
  return (
    <Panel
      titulo="Promedio de reutilización de materiales"
      subtitulo={`Destino de ${num(totalMateriales)} materiales clasificados, por tipo · ${Math.round(pctTotal * 100)} % reutilizable en total${top.length > 0 ? ` · lo más reutilizable: ${top.join(", ")}` : ""}`}
    >
      <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={Math.max(180, filas.length * 26 + 60)}>
        <BarChart data={filas} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="22%">
          <XAxis type="number" domain={[0, 1]} height={ALTO_EJE_X} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) * 100)} %`} label={etiquetaX("% de materiales")} />
          <YAxis type="category" dataKey="etiqueta" width={176} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval={0} label={etiquetaY("Tipo de material (cantidad)")} />
          <Tooltip formatter={(v, nombre) => [`${v} materiales`, String(nombre)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={textoLeyenda} />
          <ReferenceLine x={pctTotal} stroke="#71716a" strokeDasharray="4 3" />
          <Bar dataKey="reutilizable" name="Reutilizable" stackId="destino" fill="#7acc7d">
            <LabelList
              dataKey="reutilizable"
              content={(props: object) => {
                const p = props as PropsEtiqueta
                const fila = filas[p.index ?? 0]
                if (!fila || fila.pct < 0.08) return null
                return (
                  <text x={Number(p.x) + 6} y={Number(p.y) + Number(p.height) / 2} dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#1d4d1f">
                    {Math.round(fila.pct * 100)} %
                  </text>
                )
              }}
            />
          </Bar>
          <Bar dataKey="reciclable" name="Reciclable" stackId="destino" fill="#b5b3a8" />
          <Bar dataKey="desecho" name="Desecho" stackId="destino" fill="#e89a98" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-muted-foreground">Línea punteada: promedio de reutilización. Entre paréntesis, la cantidad de materiales de cada tipo.</p>
    </Panel>
  )
}

// ── 3. Demanda de turnos (mapa de calor día × hora) ───────────────────────────
export function DemandaTurnosChart({ datos }: { datos: Graficos["demandaTurnos"] }) {
  const { horas, celdas, totalesDia, totalesHora, max, total } = useMemo(() => {
    const habiles = datos.filter((x) => x.dia >= 1 && x.dia <= 5)
    const minH = Math.min(8, ...habiles.map((x) => x.hora))
    const maxH = Math.max(16, ...habiles.map((x) => x.hora))
    const horas = Array.from({ length: maxH - minH + 1 }, (_, i) => minH + i)
    const celdas = new Map(habiles.map((x) => [`${x.dia}-${x.hora}`, x.cantidad]))
    const totalesDia = DIAS.map((_, i) => habiles.filter((x) => x.dia === i + 1).reduce((s, x) => s + x.cantidad, 0))
    const totalesHora = horas.map((h) => habiles.filter((x) => x.hora === h).reduce((s, x) => s + x.cantidad, 0))
    return { horas, celdas, totalesDia, totalesHora, max: Math.max(1, ...habiles.map((x) => x.cantidad)), total: totalesDia.reduce((s, v) => s + v, 0) }
  }, [datos])

  if (total === 0) {
    return <Panel titulo="Demanda de turnos" subtitulo="Día de la semana × hora × cantidad de turnos" vacio="Sin turnos agendados en el período." />
  }
  const diaTop = totalesDia.indexOf(Math.max(...totalesDia))
  const pctTop = Math.round((totalesDia[diaTop] / total) * 100)
  const horaTop = horas[totalesHora.indexOf(Math.max(...totalesHora))]
  return (
    <Panel
      titulo="Concentración de turnos por día/hora"
      subtitulo={`El día más concentrado es el ${DIAS[diaTop].toLowerCase()}, con el ${pctTop} % de los turnos · ${num(total)} turnos por día y hora de inicio · la franja de las ${horaTop} h es la más pedida de la semana`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs" aria-label="Turnos por día y hora">
          <thead>
            <tr>
              <th className="w-20 text-left text-[10px] font-normal text-muted-foreground">Día ↓ / Hora →</th>
              {horas.map((h) => <th key={h} className="font-normal text-muted-foreground">{h} h</th>)}
              <th className="font-normal text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {DIAS.map((dia, i) => (
              <tr key={dia}>
                <th scope="row" className={`pr-2 text-right ${i === diaTop ? "font-semibold text-foreground" : "font-normal text-muted-foreground"}`}>{dia}</th>
                {horas.map((h) => {
                  const n = celdas.get(`${i + 1}-${h}`) ?? 0
                  return (
                    <td
                      key={h}
                      title={`${dia} ${h} h: ${n} turno${n !== 1 ? "s" : ""}`}
                      className="h-9 min-w-9 rounded-md text-center tabular-nums"
                      style={n > 0 ? { backgroundColor: `rgba(55,138,221,${0.15 + 0.75 * (n / max)})`, color: n / max > 0.55 ? "#fff" : "inherit" } : { backgroundColor: "rgba(0,0,0,0.03)" }}
                    >
                      {n > 0 ? n : ""}
                    </td>
                  )
                })}
                <td className={`text-center tabular-nums ${i === diaTop ? "font-semibold" : "text-muted-foreground"}`}>{totalesDia[i]}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="pr-2 text-right font-normal text-muted-foreground">Total</th>
              {totalesHora.map((t, i) => <td key={horas[i]} className="text-center tabular-nums text-muted-foreground">{t}</td>)}
              <td className="text-center font-semibold tabular-nums">{total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Color más intenso = más turnos en esa franja · celda vacía = sin turnos.</p>
    </Panel>
  )
}

// ── 4. Mapa de donantes (burbujas) ────────────────────────────────────────────
export function MapaDonantesChart({ datos }: { datos: Graficos["mapaDonantes"] }) {
  const { grupos, mejor } = useMemo(() => {
    const porTipo = new Map<string, { id: number; nombre: string; tipo: string; donaciones: number; kg: number; pctReutilizable: number | null; z: number }[]>()
    for (const d of datos) {
      const lista = porTipo.get(d.tipo) ?? []
      lista.push({ ...d, z: (d.pctReutilizable ?? 0) + 5 })
      porTipo.set(d.tipo, lista)
    }
    const mejor = [...datos].sort((a, b) => b.kg - a.kg)[0]
    return { grupos: [...porTipo.entries()], mejor }
  }, [datos])

  if (datos.length === 0) {
    return <Panel titulo="Mapa de donantes" subtitulo="Donaciones × kg × % reutilizable × tipo de donante" vacio="Sin donaciones en el período." />
  }
  return (
    <Panel
      titulo="Principales Donantes"
      subtitulo={`Cada burbuja es un donante: ${mejor ? `${mejor.nombre} es el de mayor volumen (${num(mejor.kg)} kg). ` : ""}Tamaño = % de lo que traen que es reutilizable; color = tipo de donante`}
    >
      <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={200}>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
          <XAxis type="number" dataKey="donaciones" name="Donaciones" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} height={ALTO_EJE_X} label={etiquetaX("Cantidad de donaciones")} />
          <YAxis type="number" dataKey="kg" name="Kg" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={64} label={etiquetaY("Kg donados")} />
          <ZAxis type="number" dataKey="z" range={[70, 520]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              const d = payload?.[0]?.payload as { nombre: string; tipo: string; donaciones: number; kg: number; pctReutilizable: number | null } | undefined
              if (!d) return null
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium">{d.nombre}</p>
                  <p className="text-muted-foreground">{d.tipo}</p>
                  <p>{num(d.donaciones)} donaciones · {dec(d.kg)} kg</p>
                  <p>{d.pctReutilizable !== null ? `${d.pctReutilizable} % reutilizable` : "Sin materiales clasificados"}</p>
                </div>
              )
            }}
          />
          <Legend iconType="circle" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} formatter={textoLeyenda} />
          {grupos.map(([tipo, lista], i) => (
            <Scatter key={tipo} name={tipo} data={lista} fill={PALETA[i % PALETA.length]} fillOpacity={0.6} stroke={PALETA[i % PALETA.length]} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Panel>
  )
}

// ── 5. Kg por mes y tipo de donante (barras apiladas) ─────────────────────────
export function KgPorMesChart({ datos }: { datos: Graficos["kgPorMesYTipo"] }) {
  const { filas, tipos } = useMemo(() => {
    const tipos = [...new Set(datos.map((x) => x.tipo))]
    const meses = [...new Set(datos.map((x) => x.mes))].sort()
    const variosAnios = new Set(meses.map((m) => m.slice(0, 4))).size > 1
    const filas = meses.map((mes) => {
      const fila: Record<string, number | string> = { mes, etiqueta: nombreMes(mes, variosAnios) }
      for (const t of tipos) fila[t] = datos.filter((x) => x.mes === mes && x.tipo === t).reduce((s, x) => s + x.kg, 0)
      return fila
    })
    return { filas, tipos }
  }, [datos])

  if (filas.length === 0) {
    return <Panel titulo="Kg por mes y tipo de donante" subtitulo="Mes × kg × particular / empresa / organismo" vacio="Sin lotes pesados en el período." />
  }
  return (
    <Panel titulo="Kg de lotes pesados por mes, según el tipo de donante">
      <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={190}>
        <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
          <XAxis dataKey="etiqueta" height={ALTO_EJE_X} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} label={etiquetaX("Mes")} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={80} tickFormatter={(v) => `${num(Number(v))} kg`} label={etiquetaY("Kilogramos")} />
          <Tooltip formatter={(v, nombre) => [`${dec(Number(v))} kg`, String(nombre)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={textoLeyenda} />
          {tipos.map((t, i) => <Bar key={t} dataKey={t} name={t} stackId="kg" fill={PALETA[i % PALETA.length]} />)}
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}

// ── 6. Destrucción por método y medio (matriz) ────────────────────────────────
// La desmagnetización no sirve en medios de estado sólido (NIST SP 800-88)
const METODO_MAGNETICO = /desmagnet|degauss/i
const MEDIO_SOLIDO = /ssd|nvme|flash|usb|sd\b|estado s[oó]lido/i

export function DestruccionMatrizChart({ datos }: { datos: Graficos["destruccionPorMetodoYMedio"] }) {
  const { metodos, medios, cant, incorrectos, total } = useMemo(() => {
    const metodos = [...new Set(datos.map((x) => x.metodo))]
    const medios = [...new Set(datos.map((x) => x.medio))]
    const cant = new Map(datos.map((x) => [`${x.metodo}|${x.medio}`, x.cantidad]))
    const incorrectos = datos.filter((x) => METODO_MAGNETICO.test(x.metodo) && MEDIO_SOLIDO.test(x.medio)).reduce((s, x) => s + x.cantidad, 0)
    return { metodos, medios, cant, incorrectos, total: datos.reduce((s, x) => s + x.cantidad, 0) }
  }, [datos])

  if (total === 0) {
    return <Panel titulo="Destrucción por método y medio" subtitulo="Método × tipo de medio × cantidad" vacio="Sin procesos de destrucción en el período." />
  }
  return (
    <Panel
      titulo="Media de procesos de destrucción"
      subtitulo={`${num(total)} procesos de destrucción · ${incorrectos > 0 ? `${incorrectos} con un método que no corresponde al medio` : "cada medio se destruyó con un método adecuado"} · la desmagnetización no sirve en SSD ni NVMe (NIST SP 800-88)`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs" aria-label="Procesos de destrucción por método y tipo de medio">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-normal text-muted-foreground">Método ↓ / Medio →</th>
              {medios.map((m) => <th key={m} className="font-normal text-muted-foreground">{m}</th>)}
            </tr>
          </thead>
          <tbody>
            {metodos.map((metodo) => (
              <tr key={metodo}>
                <th scope="row" className="pr-2 text-left font-medium">{metodo}</th>
                {medios.map((medio) => {
                  const n = cant.get(`${metodo}|${medio}`) ?? 0
                  const mal = n > 0 && METODO_MAGNETICO.test(metodo) && MEDIO_SOLIDO.test(medio)
                  return (
                    <td
                      key={medio}
                      className={`h-9 min-w-12 rounded-md text-center tabular-nums ${mal ? "bg-red-100 font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300" : n > 0 ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200" : "bg-muted/30"}`}
                      title={mal ? "Método no adecuado para este medio" : undefined}
                    >
                      {n > 0 ? n : ""}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {incorrectos > 0 && <p className="mt-2 text-[11px] text-red-700 dark:text-red-400">En rojo: combinaciones que conviene revisar.</p>}
    </Panel>
  )
}

// ── 7. Eficiencia de rutas (dispersión paradas × km por transportista) ────────
const MAX_HOJAS_RADAR = 12

// Tope "redondo" (1, 2, 2.5, 5 × 10^n) algo por encima del máximo: el dominio queda fijo y el perímetro de la grilla se ve completo
function topeRedondo(maximo: number) {
  const objetivo = Math.max(maximo, 1) * 1.15
  const potencia = 10 ** Math.floor(Math.log10(objetivo))
  const multiplo = [1, 2, 2.5, 5, 10].find((m) => potencia * m >= objetivo) ?? 10
  return potencia * multiplo
}

export function EficienciaRutasChart({ datos }: { datos: Graficos["eficienciaRutas"] }) {
  const { filas, topeKm, topeParadas, kmPorParada, recortado } = useMemo(() => {
    const ordenadas = [...datos].sort((x, y) => x.fecha.localeCompare(y.fecha) || x.id - y.id)
    const ultimas = ordenadas.slice(-MAX_HOJAS_RADAR)
    // Las paradas van como valor negativo para dibujarse hacia la izquierda; el tooltip y las marcas muestran el valor real
    const filas = ultimas.map((h) => ({ ...h, paradasIzq: -h.paradas, etiqueta: `#${h.id} · ${h.fecha.slice(8, 10)}/${h.fecha.slice(5, 7)}` }))
    const paradas = datos.reduce((sum, h) => sum + h.paradas, 0)
    const km = datos.reduce((sum, h) => sum + h.km, 0)
    return {
      filas,
      topeKm: topeRedondo(Math.max(...filas.map((h) => h.km))),
      topeParadas: topeRedondo(Math.max(...filas.map((h) => h.paradas))),
      kmPorParada: paradas > 0 ? km / paradas : null,
      recortado: ordenadas.length > ultimas.length,
    }
  }, [datos])

  if (datos.length === 0) {
    return <Panel titulo="Paradas vs km por hoja de ruta" subtitulo="Paradas por hoja × km × transportista" vacio="Sin hojas de ruta finalizadas con km en el período." />
  }
  return (
    <Panel
      titulo="Paradas vs km por hoja de ruta"
      subtitulo={`Cada fila es una hoja de ruta finalizada${recortado ? ` (las ${MAX_HOJAS_RADAR} más recientes)` : ""}: paradas a la izquierda y km a la derecha, cada lado con su propia escala${kmPorParada !== null ? ` · promedio ${dec(kmPorParada)} km por parada` : ""}. Agrupar retiros por zona baja los km`}
    >
      <ResponsiveContainer className="flex-1" width="100%" height="100%" minHeight={200}>
        <BarChart data={filas} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }} barCategoryGap="14%">
          <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.4} />
          <XAxis
            xAxisId="paradas"
            type="number"
            orientation="top"
            domain={[-topeParadas, topeParadas]}
            ticks={[-topeParadas, -topeParadas / 2, 0]}
            tickFormatter={(v) => String(Math.abs(Number(v)))}
            height={ALTO_EJE_X}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ ...etiquetaX("Paradas"), position: "insideTop" }}
          />
          <XAxis
            xAxisId="km"
            type="number"
            orientation="bottom"
            domain={[-topeKm, topeKm]}
            ticks={[0, topeKm / 2, topeKm]}
            tickFormatter={(v) => dec(Number(v))}
            height={ALTO_EJE_X}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={etiquetaX("Kilómetros recorridos")}
          />
          <YAxis type="category" dataKey="etiqueta" width={96} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} label={etiquetaY("Hoja de ruta")} />
          <ReferenceLine xAxisId="km" x={0} stroke="#71716a" />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={({ payload }) => {
              const h = payload?.[0]?.payload as { transportista: string; fecha: string; paradas: number; km: number } | undefined
              if (!h) return null
              return (
                <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
                  <p className="font-medium">{h.transportista}</p>
                  <p className="text-muted-foreground">{h.fecha.split("-").reverse().join("/")}</p>
                  <p>{h.paradas} parada{h.paradas !== 1 ? "s" : ""} · {dec(h.km)} km</p>
                </div>
              )
            }}
          />
          <Legend iconType="square" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} formatter={textoLeyenda} />
          {/* Mismo stackId: las dos barras comparten la fila, una a cada lado del centro */}
          <Bar xAxisId="paradas" stackId="hoja" dataKey="paradasIzq" name="Paradas" fill={PALETA[2]} radius={[4, 0, 0, 4]}>
            <LabelList dataKey="paradas" position="left" style={{ fontSize: 9, fill: "currentColor" }} />
          </Bar>
          <Bar xAxisId="km" stackId="hoja" dataKey="km" name="Km recorridos" fill={PALETA[0]} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="km" position="right" formatter={(v) => dec(Number(v))} style={{ fontSize: 9, fill: "currentColor" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}

// ── Conjunto: lo que cada rol ve, como ítems de la grilla del dashboard ───────
export function itemsGraficosCircuito(resumen?: DashboardResumen): ItemGrilla[] {
  if (!resumen) return []
  const g = resumen.graficos
  const items: ItemGrilla[] = []
  if (resumen.completo) items.push({ id: "ciclo-por-etapa", w: 6, h: 11, nodo: <CicloPorEtapaChart datos={g.cicloPorEtapa} promedioCiclo={resumen.ciclo?.promedio} /> })
  items.push({ id: "destino-por-tipo", w: 6, h: 12, nodo: <DestinoPorTipoChart datos={g.destinoPorTipo} /> })
  if (resumen.completo) {
    items.push({ id: "demanda-turnos", w: 6, h: 12, nodo: <DemandaTurnosChart datos={g.demandaTurnos} /> })
    items.push({ id: "mapa-donantes", w: 6, h: 12, nodo: <MapaDonantesChart datos={g.mapaDonantes} /> })
    items.push({ id: "kg-por-mes", w: 6, h: 11, nodo: <KgPorMesChart datos={g.kgPorMesYTipo} /> })
  }
  items.push({ id: "destruccion-matriz", w: 6, h: 12, nodo: <DestruccionMatrizChart datos={g.destruccionPorMetodoYMedio} /> })
  if (resumen.completo) items.push({ id: "eficiencia-rutas", w: 6, h: 13, nodo: <EficienciaRutasChart datos={g.eficienciaRutas} /> })
  return items
}
