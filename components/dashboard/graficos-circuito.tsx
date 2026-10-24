"use client"

import { useMemo } from "react"
import {
  Bar, BarChart, CartesianGrid, Legend, LabelList, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis,
} from "recharts"
import type { DashboardResumen } from "@/lib/type/dashboard"

type Graficos = DashboardResumen["graficos"]

const num = (n: number) => n.toLocaleString("es-AR")
const dec = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 })
const PALETA = ["#378ADD", "#639922", "#F5A623", "#E24B4A", "#8B5CF6", "#14B8A6", "#EC4899"]
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
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-5 min-w-0">
      <p className="text-base font-medium text-foreground">{titulo}</p>
      {subtitulo && <p className="mb-4 mt-0.5 text-xs text-muted-foreground">{subtitulo}</p>}
      {vacio ? (
        <div className="flex h-[200px] items-center justify-center px-6 text-center text-xs text-muted-foreground">{vacio}</div>
      ) : children}
    </div>
  )
}

// ── 1. Tiempo de ciclo por etapa y mes (barras apiladas) ──────────────────────
const ETAPAS = [
  { key: "espera", nombre: "Espera de retiro", color: "#c9c7bd" },
  { key: "clasificacion", nombre: "Clasificación", color: "#dad9d0" },
  { key: "destruccionPallet", nombre: "Destrucción y pallet", color: "#e8e7e1" },
  { key: "certificacion", nombre: "Certificación", color: "#378ADD" },
] as const

export function CicloPorEtapaChart({ datos }: { datos: Graficos["cicloPorEtapa"] }) {
  const filas = useMemo(() => {
    const meses = datos?.meses ?? []
    const variosAnios = new Set(meses.map((m) => m.mes.slice(0, 4))).size > 1
    return meses.map((m) => ({ ...m, etiqueta: nombreMes(m.mes, variosAnios) }))
  }, [datos])

  if (!datos || filas.length === 0) {
    return <Panel titulo="Tiempo de ciclo por etapa" subtitulo="Mes × etapa × días promedio" vacio="Todavía no hay donaciones con certificado emitido en el período." />
  }
  const total = ETAPAS.reduce((s, e) => s + datos.promedio[e.key], 0)
  const larga = ETAPAS.reduce((a, b) => (datos.promedio[b.key] > datos.promedio[a.key] ? b : a))
  return (
    <Panel
      titulo={`${larga.nombre} es la etapa más larga del ciclo`}
      subtitulo={`Días promedio por etapa · ${larga.nombre.toLowerCase()} ${dec(datos.promedio[larga.key])} de ${dec(total)} días en promedio (${num(datos.donaciones)} donaciones)`}
    >
      <ResponsiveContainer width="100%" height={Math.max(220, filas.length * 52 + 70)}>
        <BarChart data={filas} layout="vertical" margin={{ top: 4, right: 56, left: 8, bottom: 4 }} barCategoryGap="28%">
          <CartesianGrid horizontal={false} strokeDasharray="3 3" opacity={0.4} />
          <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v} d`} />
          <YAxis type="category" dataKey="etiqueta" width={96} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          <Tooltip formatter={(v) => `${dec(Number(v))} días`} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
          {ETAPAS.map((e, i) => (
            <Bar key={e.key} dataKey={e.key} name={e.nombre} stackId="ciclo" fill={e.color}>
              <LabelList
                dataKey={e.key}
                position="center"
                formatter={(v) => (Number(v) >= 1.5 ? dec(Number(v)) : "")}
                style={{ fontSize: 11, fill: i === ETAPAS.length - 1 ? "#ffffff" : "#44443c" }}
              />
              {i === ETAPAS.length - 1 && (
                <LabelList
                  dataKey="total"
                  content={(props: object) => {
                    const p = props as PropsEtiqueta
                    const fila = filas[p.index ?? 0]
                    return (
                      <text x={Number(p.x) + Number(p.width) + 8} y={Number(p.y) + Number(p.height) / 2} dominantBaseline="middle" fontSize={12} fontWeight={600} fill="currentColor">
                        {fila ? `${dec(fila.total)} d` : ""}
                      </text>
                    )
                  }}
                />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
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
      titulo={top.length > 0 ? `Lo más reutilizable: ${top.join(", ")}` : "Destino por tipo de material"}
      subtitulo={`Destino de ${num(totalMateriales)} materiales clasificados, por tipo · ${Math.round(pctTotal * 100)} % reutilizable en total`}
    >
      <ResponsiveContainer width="100%" height={Math.max(240, filas.length * 30 + 70)}>
        <BarChart data={filas} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="22%">
          <XAxis type="number" domain={[0, 1]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `${Math.round(Number(v) * 100)} %`} />
          <YAxis type="category" dataKey="etiqueta" width={150} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval={0} />
          <Tooltip formatter={(v, nombre) => [`${v} materiales`, String(nombre)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
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
          <Bar dataKey="reciclable" name="Reciclable" stackId="destino" fill="#d4d3cc" />
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
      titulo={`${DIAS[diaTop]} concentra el ${pctTop} % de los turnos`}
      subtitulo={`${num(total)} turnos por día y hora de inicio · la franja de las ${horaTop} h es la más pedida de la semana`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs" aria-label="Turnos por día y hora">
          <thead>
            <tr>
              <th className="w-20" />
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
      titulo="Quiénes son los donantes clave"
      subtitulo={`Cada burbuja es un donante: ${mejor ? `${mejor.nombre} es el de mayor volumen (${num(mejor.kg)} kg). ` : ""}Tamaño = % de lo que traen que es reutilizable; color = tipo de donante`}
    >
      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
          <XAxis type="number" dataKey="donaciones" name="Donaciones" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} label={{ value: "Donaciones", position: "insideBottom", offset: -12, fontSize: 11 }} />
          <YAxis type="number" dataKey="kg" name="Kg" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={52} label={{ value: "kg", angle: -90, position: "insideLeft", fontSize: 11 }} />
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
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
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
    <Panel titulo="Crece el volumen y quién lo trae" subtitulo="Kg de lotes pesados por mes, según el tipo de donante">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} strokeDasharray="3 3" opacity={0.4} />
          <XAxis dataKey="etiqueta" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={56} tickFormatter={(v) => `${num(Number(v))} kg`} />
          <Tooltip formatter={(v, nombre) => [`${dec(Number(v))} kg`, String(nombre)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
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
      titulo={incorrectos > 0 ? `${incorrectos} proceso${incorrectos !== 1 ? "s" : ""} con un método que no corresponde al medio` : "Cada medio se destruyó con un método adecuado"}
      subtitulo={`${num(total)} procesos de destrucción · la desmagnetización no sirve en SSD ni NVMe (NIST SP 800-88)`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs" aria-label="Procesos de destrucción por método y tipo de medio">
          <thead>
            <tr>
              <th className="text-left font-normal text-muted-foreground">Método</th>
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
export function EficienciaRutasChart({ datos }: { datos: Graficos["eficienciaRutas"] }) {
  const { grupos, kmPorParada } = useMemo(() => {
    const porTransportista = new Map<string, Graficos["eficienciaRutas"]>()
    for (const h of datos) porTransportista.set(h.transportista, [...(porTransportista.get(h.transportista) ?? []), h])
    const paradas = datos.reduce((s, h) => s + h.paradas, 0)
    const km = datos.reduce((s, h) => s + h.km, 0)
    return { grupos: [...porTransportista.entries()], kmPorParada: paradas > 0 ? km / paradas : null }
  }, [datos])

  if (datos.length === 0) {
    return <Panel titulo="Eficiencia de rutas" subtitulo="Paradas por hoja × km × transportista" vacio="Sin hojas de ruta finalizadas con km en el período." />
  }
  return (
    <Panel
      titulo="Paradas y km de cada hoja de ruta"
      subtitulo={`Cada punto es una hoja de ruta finalizada${kmPorParada !== null ? ` · promedio ${dec(kmPorParada)} km por parada` : ""}. Agrupar retiros por zona baja los km`}
    >
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 24 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.4} />
          <XAxis type="number" dataKey="paradas" name="Paradas" allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} label={{ value: "Paradas por hoja", position: "insideBottom", offset: -12, fontSize: 11 }} />
          <YAxis type="number" dataKey="km" name="Km" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={48} label={{ value: "km", angle: -90, position: "insideLeft", fontSize: 11 }} />
          <ZAxis range={[70, 70]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
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
          <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
          {grupos.map(([nombre, lista], i) => (
            <Scatter key={nombre} name={nombre} data={lista} fill={PALETA[i % PALETA.length]} fillOpacity={0.7} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Panel>
  )
}

// ── Conjunto: lo que cada rol ve ──────────────────────────────────────────────
export function GraficosCircuito({ resumen }: { resumen?: DashboardResumen }) {
  if (!resumen) return null
  const g = resumen.graficos
  return (
    <section aria-labelledby="titulo-analisis" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-analisis" className="text-base font-medium text-foreground">Análisis del circuito</h2>
        <p className="text-xs text-muted-foreground">Gráficos que cruzan tres o más variables; cada uno responde una pregunta de gestión.</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {resumen.completo && <div className="xl:col-span-2"><CicloPorEtapaChart datos={g.cicloPorEtapa} /></div>}
        <DestinoPorTipoChart datos={g.destinoPorTipo} />
        {resumen.completo && <DemandaTurnosChart datos={g.demandaTurnos} />}
        {resumen.completo && <MapaDonantesChart datos={g.mapaDonantes} />}
        {resumen.completo && <KgPorMesChart datos={g.kgPorMesYTipo} />}
        <DestruccionMatrizChart datos={g.destruccionPorMetodoYMedio} />
        {resumen.completo && <EficienciaRutasChart datos={g.eficienciaRutas} />}
      </div>
    </section>
  )
}
