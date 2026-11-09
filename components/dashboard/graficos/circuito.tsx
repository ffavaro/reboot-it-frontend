"use client"

import { useMemo } from "react"
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts"
import { cn } from "@/lib/utils"
import { Panel, textoLeyenda } from "@/components/dashboard/panel"
import { Tarjeta } from "@/lib/type/dashboard"
import { ALTO_EJE_X, COLOR, GRILLA, MARCAS, colorSerie, tituloX, tituloY } from "../estilo"
import { decimal, entero, nombreDeMes } from "@/lib/utils/formato"
import { dia } from "@/lib/utils/fechas"
import type { GraficosCircuito, ResumenCircuito } from "@/lib/type/dashboard"

const DIAS_HABILES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes"]

function CajaTooltip({ lineas }: { lineas: (string | false | null | undefined)[] }) {
  const [titulo, ...resto] = lineas.filter((l): l is string => !!l)
  return (
    <div className="rounded-lg border bg-popover px-3 py-2 text-xs shadow-md">
      <p className="font-medium">{titulo}</p>
      {resto.map((l) => (
        <p key={l} className="text-muted-foreground">
          {l}
        </p>
      ))}
    </div>
  )
}

const ETAPAS = [
  { clave: "espera", nombre: "Espera de retiro", color: COLOR.naranja },
  { clave: "clasificacion", nombre: "Clasificación", color: COLOR.verde },
  { clave: "destruccionPallet", nombre: "Destrucción y pallet", color: COLOR.violeta },
  { clave: "certificacion", nombre: "Certificación", color: COLOR.azul },
] as const

function EtapasDelCiclo({ datos, promedio }: { datos: GraficosCircuito["cicloPorEtapa"]; promedio?: number | null }) {
  if (!datos?.meses.length) {
    return <Panel titulo="Tiempo de espera por etapa" bajada="Días promedio en cada etapa" vacio="Todavía no hay donaciones certificadas en el período." />
  }
  const etapas = ETAPAS.map((e) => ({ nombre: e.nombre, dias: datos.promedio[e.clave], fill: e.color }))
  const tope = Math.max(1, ...etapas.map((e) => e.dias)) * 1.15
  const total = promedio ?? etapas.reduce((s, e) => s + e.dias, 0)
  const cuello = etapas.reduce((a, b) => (b.dias > a.dias ? b : a))
  return (
    <Panel
      titulo="Tiempo de espera por etapa"
      bajada={`La etapa más lenta es ${cuello.nombre.toLowerCase()}: ${decimal(cuello.dias)} de ${decimal(total)} días en promedio, sobre ${entero(datos.donaciones)} donaciones.`}
    >
      <div className="grid min-h-0 flex-1 grid-cols-1 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
        <ResponsiveContainer width="100%" height="100%" minHeight={190}>
          <RadialBarChart data={etapas} innerRadius="22%" outerRadius="100%" startAngle={90} endAngle={-270} barSize={14}>
            <PolarAngleAxis type="number" domain={[0, tope]} tick={false} />
            <RadialBar dataKey="dias" background cornerRadius={7} />
            <Tooltip content={({ payload }) => {
              const e = payload?.[0]?.payload as { nombre: string; dias: number } | undefined
              return e ? <CajaTooltip lineas={[e.nombre, `${decimal(e.dias)} días en promedio`]} /> : null
            }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <ul className="flex flex-col gap-2 text-xs">
          {etapas.map((e) => (
            <li key={e.nombre} className="flex items-center gap-2">
              <span className="size-3 shrink-0 rounded-sm" style={{ background: e.fill }} aria-hidden />
              {e.nombre}
              <span className="ml-auto pl-3 font-medium tabular-nums">{decimal(e.dias)} d</span>
            </li>
          ))}
        </ul>
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground">
        Registro → retiro (o turno en sucursal) → clasificación → pallet → certificado.
      </p>
    </Panel>
  )
}

function ReutilizacionPorTipo({ datos }: { datos: GraficosCircuito["destinoPorTipo"] }) {
  const calculo = useMemo(() => {
    const total = datos.reduce((s, d) => s + d.total, 0)
    const reutilizables = datos.reduce((s, d) => s + d.reutilizable, 0)
    const destacados = datos
      .filter((d) => d.total >= 5)
      .sort((a, b) => b.reutilizable / b.total - a.reutilizable / a.total)
      .slice(0, 3)
      .map((d) => d.tipo)
    return {
      filas: datos.map((d) => ({ ...d, nombre: `${d.tipo} (${d.total})`, fraccion: d.total ? d.reutilizable / d.total : 0 })),
      total,
      media: total ? reutilizables / total : 0,
      destacados,
    }
  }, [datos])

  if (!calculo.filas.length) {
    return <Panel titulo="Reutilización por tipo de material" bajada="Destino de cada tipo" vacio="No hay materiales clasificados en el período." />
  }
  return (
    <Panel
      titulo="Reutilización por tipo de material"
      bajada={`${entero(calculo.total)} materiales clasificados · ${Math.round(calculo.media * 100)} % reutilizable en total${
        calculo.destacados.length ? ` · lo que más se reutiliza: ${calculo.destacados.join(", ")}` : ""
      }`}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={Math.max(180, calculo.filas.length * 26 + 60)}>
        <BarChart data={calculo.filas} layout="vertical" stackOffset="expand" margin={{ top: 4, right: 16, left: 8, bottom: 4 }} barCategoryGap="22%">
          <XAxis
            type="number"
            domain={[0, 1]}
            height={ALTO_EJE_X}
            tick={MARCAS}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v) => `${Math.round(Number(v) * 100)} %`}
            label={tituloX("% de materiales")}
          />
          <YAxis type="category" dataKey="nombre" width={176} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} interval={0} label={tituloY("Tipo (cantidad)")} />
          <Tooltip formatter={(v, nombre) => [`${v} materiales`, String(nombre)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={textoLeyenda} />
          <ReferenceLine x={calculo.media} stroke={COLOR.gris} strokeDasharray="4 3" />
          <Bar dataKey="reutilizable" name="Reutilizable" stackId="d" fill="#7acc7d">
            <LabelList
              dataKey="reutilizable"
              content={(p: { x?: number | string; y?: number | string; height?: number | string; index?: number }) => {
                const fila = calculo.filas[p.index ?? 0]
                if (!fila || fila.fraccion < 0.08) return null
                return (
                  <text x={Number(p.x) + 6} y={Number(p.y) + Number(p.height) / 2} dominantBaseline="middle" fontSize={11} fontWeight={600} fill="#1d4d1f">
                    {Math.round(fila.fraccion * 100)} %
                  </text>
                )
              }}
            />
          </Bar>
          <Bar dataKey="reciclable" name="Reciclable" stackId="d" fill="#b5b3a8" />
          <Bar dataKey="desecho" name="Desecho" stackId="d" fill="#e89a98" />
        </BarChart>
      </ResponsiveContainer>
      <p className="mt-1 text-[11px] text-muted-foreground">La línea punteada marca el promedio general de reutilización.</p>
    </Panel>
  )
}

function MapaDeCalorTurnos({ datos }: { datos: GraficosCircuito["demandaTurnos"] }) {
  const mapa = useMemo(() => {
    const habiles = datos.filter((d) => d.dia >= 1 && d.dia <= 5)
    const horas = habiles.map((d) => d.hora)
    const desde = Math.min(8, ...horas)
    const hasta = Math.max(16, ...horas)
    const columnas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
    const valor = (dia: number, hora: number) => habiles.find((d) => d.dia === dia && d.hora === hora)?.cantidad ?? 0
    const porDia = DIAS_HABILES.map((_, i) => columnas.reduce((s, h) => s + valor(i + 1, h), 0))
    const porHora = columnas.map((h) => DIAS_HABILES.reduce((s, _, i) => s + valor(i + 1, h), 0))
    return {
      columnas,
      valor,
      porDia,
      porHora,
      maximo: Math.max(1, ...habiles.map((d) => d.cantidad)),
      total: porDia.reduce((s, v) => s + v, 0),
    }
  }, [datos])

  if (!mapa.total) {
    return <Panel titulo="Demanda de turnos" bajada="Turnos por día y hora" vacio="No hay turnos agendados en el período." />
  }
  const diaPico = mapa.porDia.indexOf(Math.max(...mapa.porDia))
  const horaPico = mapa.columnas[mapa.porHora.indexOf(Math.max(...mapa.porHora))]
  return (
    <Panel
      titulo="Concentración de turnos por día y hora"
      bajada={`${entero(mapa.total)} turnos · el ${DIAS_HABILES[diaPico].toLowerCase()} concentra el ${Math.round((mapa.porDia[diaPico] / mapa.total) * 100)} % · la franja más pedida es la de las ${horaPico} h`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs" aria-label="Turnos por día y hora">
          <thead>
            <tr>
              <th className="w-20 text-left text-[10px] font-normal text-muted-foreground">Día / Hora</th>
              {mapa.columnas.map((h) => (
                <th key={h} className="font-normal text-muted-foreground">
                  {h} h
                </th>
              ))}
              <th className="font-normal text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {DIAS_HABILES.map((dia, i) => (
              <tr key={dia}>
                <th scope="row" className={cn("pr-2 text-right", i === diaPico ? "font-semibold" : "font-normal text-muted-foreground")}>
                  {dia}
                </th>
                {mapa.columnas.map((h) => {
                  const n = mapa.valor(i + 1, h)
                  const intensidad = n / mapa.maximo
                  return (
                    <td
                      key={h}
                      title={`${dia} ${h} h: ${n} ${n === 1 ? "turno" : "turnos"}`}
                      className="h-9 min-w-9 rounded-md text-center tabular-nums"
                      style={
                        n
                          ? { backgroundColor: `rgba(55,138,221,${0.15 + 0.75 * intensidad})`, color: intensidad > 0.55 ? "#fff" : undefined }
                          : { backgroundColor: "rgba(0,0,0,0.03)" }
                      }
                    >
                      {n || ""}
                    </td>
                  )
                })}
                <td className={cn("text-center tabular-nums", i === diaPico ? "font-semibold" : "text-muted-foreground")}>{mapa.porDia[i]}</td>
              </tr>
            ))}
            <tr>
              <th scope="row" className="pr-2 text-right font-normal text-muted-foreground">
                Total
              </th>
              {mapa.porHora.map((t, i) => (
                <td key={mapa.columnas[i]} className="text-center tabular-nums text-muted-foreground">
                  {t}
                </td>
              ))}
              <td className="text-center font-semibold tabular-nums">{mapa.total}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Cuanto más intenso el color, más turnos en esa franja.</p>
    </Panel>
  )
}

function DonantesPrincipales({ datos }: { datos: GraficosCircuito["mapaDonantes"] }) {
  const { series, lider } = useMemo(() => {
    const agrupado = new Map<string, (GraficosCircuito["mapaDonantes"][number] & { tamano: number })[]>()
    datos.forEach((d) => agrupado.set(d.tipo, [...(agrupado.get(d.tipo) ?? []), { ...d, tamano: (d.pctReutilizable ?? 0) + 5 }]))
    return { series: [...agrupado.entries()], lider: datos.reduce<(typeof datos)[number] | null>((a, b) => (!a || b.kg > a.kg ? b : a), null) }
  }, [datos])

  if (!datos.length) {
    return <Panel titulo="Principales donantes" bajada="Donaciones, kg y reutilización por donante" vacio="No hay donaciones en el período." />
  }
  return (
    <Panel
      titulo="Principales donantes"
      bajada={`${lider ? `${lider.nombre} es el de mayor volumen (${entero(lider.kg)} kg). ` : ""}Cada burbuja es un donante; el tamaño indica qué parte de lo donado es reutilizable.`}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 4 }}>
          <CartesianGrid {...GRILLA} />
          <XAxis type="number" dataKey="donaciones" allowDecimals={false} tick={MARCAS} tickLine={false} height={ALTO_EJE_X} label={tituloX("Cantidad de donaciones")} />
          <YAxis type="number" dataKey="kg" tick={MARCAS} tickLine={false} axisLine={false} width={64} label={tituloY("Kg donados")} />
          <ZAxis type="number" dataKey="tamano" range={[70, 520]} />
          <Tooltip
            cursor={{ strokeDasharray: "3 3" }}
            content={({ payload }) => {
              const d = payload?.[0]?.payload as GraficosCircuito["mapaDonantes"][number] | undefined
              return d ? (
                <CajaTooltip
                  lineas={[
                    d.nombre,
                    d.tipo,
                    `${entero(d.donaciones)} donaciones · ${decimal(d.kg)} kg`,
                    d.pctReutilizable !== null ? `${d.pctReutilizable} % reutilizable` : "Sin materiales clasificados",
                  ]}
                />
              ) : null
            }}
          />
          <Legend iconType="circle" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} formatter={textoLeyenda} />
          {series.map(([tipo, puntos], i) => (
            <Scatter key={tipo} name={tipo} data={puntos} fill={colorSerie(i)} fillOpacity={0.6} stroke={colorSerie(i)} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
    </Panel>
  )
}

function KilosPorMes({ datos }: { datos: GraficosCircuito["kgPorMesYTipo"] }) {
  const { filas, tipos } = useMemo(() => {
    const tipos = [...new Set(datos.map((d) => d.tipo))]
    const meses = [...new Set(datos.map((d) => d.mes))].sort()
    const variosAnios = new Set(meses.map((m) => m.slice(0, 4))).size > 1
    const filas = meses.map((mes) =>
      tipos.reduce<Record<string, string | number>>(
        (fila, tipo) => ({ ...fila, [tipo]: datos.filter((d) => d.mes === mes && d.tipo === tipo).reduce((s, d) => s + d.kg, 0) }),
        { mes: nombreDeMes(mes, variosAnios) },
      ),
    )
    return { filas, tipos }
  }, [datos])

  if (!filas.length) {
    return <Panel titulo="Kg por mes y tipo de donante" bajada="Lotes pesados por mes" vacio="No hay lotes pesados en el período." />
  }
  return (
    <Panel titulo="Kg por mes y tipo de donante" bajada="Peso bruto de los lotes, separado por particular, empresa y organismo.">
      <ResponsiveContainer width="100%" height="100%" minHeight={190}>
        <BarChart data={filas} margin={{ top: 8, right: 8, left: 0, bottom: 4 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} {...GRILLA} />
          <XAxis dataKey="mes" height={ALTO_EJE_X} tick={MARCAS} tickLine={false} axisLine={false} label={tituloX("Mes")} />
          <YAxis tick={MARCAS} tickLine={false} axisLine={false} width={80} tickFormatter={(v) => `${entero(Number(v))} kg`} label={tituloY("Kilogramos")} />
          <Tooltip formatter={(v, nombre) => [`${decimal(Number(v))} kg`, String(nombre)]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} formatter={textoLeyenda} />
          {tipos.map((t, i) => (
            <Bar key={t} dataKey={t} name={t} stackId="kg" fill={colorSerie(i)} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}

const ES_MAGNETICO = /desmagnet|degauss/i
const ES_SOLIDO = /ssd|nvme|flash|usb|sd\b|estado s[oó]lido/i
const combinacionRiesgosa = (metodo: string, medio: string) => ES_MAGNETICO.test(metodo) && ES_SOLIDO.test(medio)

function MatrizDestruccion({ datos }: { datos: GraficosCircuito["destruccionPorMetodoYMedio"] }) {
  const m = useMemo(() => {
    const metodos = [...new Set(datos.map((d) => d.metodo))]
    const medios = [...new Set(datos.map((d) => d.medio))]
    const celda = (metodo: string, medio: string) => datos.find((d) => d.metodo === metodo && d.medio === medio)?.cantidad ?? 0
    const riesgosas = datos.filter((d) => combinacionRiesgosa(d.metodo, d.medio)).reduce((s, d) => s + d.cantidad, 0)
    return { metodos, medios, celda, riesgosas, total: datos.reduce((s, d) => s + d.cantidad, 0) }
  }, [datos])

  if (!m.total) {
    return <Panel titulo="Destrucción por método y medio" bajada="Procesos según método y tipo de medio" vacio="No hay procesos de destrucción en el período." />
  }
  return (
    <Panel
      titulo="Destrucción por método y medio"
      bajada={`${entero(m.total)} procesos · ${
        m.riesgosas ? `${m.riesgosas} con un método que no corresponde al medio` : "todos con un método adecuado"
      } · la desmagnetización no sirve en SSD ni NVMe (NIST SP 800-88)`}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-xs" aria-label="Procesos por método y medio">
          <thead>
            <tr>
              <th className="text-left text-[10px] font-normal text-muted-foreground">Método / Medio</th>
              {m.medios.map((medio) => (
                <th key={medio} className="font-normal text-muted-foreground">
                  {medio}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {m.metodos.map((metodo) => (
              <tr key={metodo}>
                <th scope="row" className="pr-2 text-left font-medium">
                  {metodo}
                </th>
                {m.medios.map((medio) => {
                  const n = m.celda(metodo, medio)
                  const riesgo = n > 0 && combinacionRiesgosa(metodo, medio)
                  return (
                    <td
                      key={medio}
                      title={riesgo ? "Método no adecuado para este medio" : undefined}
                      className={cn(
                        "h-9 min-w-12 rounded-md text-center tabular-nums",
                        riesgo
                          ? "bg-red-100 font-semibold text-red-800 dark:bg-red-900/30 dark:text-red-300"
                          : n
                            ? "bg-blue-50 text-blue-900 dark:bg-blue-900/20 dark:text-blue-200"
                            : "bg-muted/30",
                      )}
                    >
                      {n || ""}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {m.riesgosas > 0 && <p className="mt-2 text-[11px] text-red-700 dark:text-red-400">En rojo: combinaciones para revisar.</p>}
    </Panel>
  )
}

const HOJAS_VISIBLES = 12

function escalaRedonda(maximo: number) {
  const meta = Math.max(maximo, 1) * 1.15
  const base = 10 ** Math.floor(Math.log10(meta))
  return base * ([1, 2, 2.5, 5, 10].find((f) => base * f >= meta) ?? 10)
}

function ParadasVsKm({ datos }: { datos: GraficosCircuito["eficienciaRutas"] }) {
  const r = useMemo(() => {
    const ordenadas = [...datos].sort((a, b) => a.fecha.localeCompare(b.fecha) || a.id - b.id)
    const visibles = ordenadas.slice(-HOJAS_VISIBLES).map((h) => ({
      ...h,
      paradasNegativas: -h.paradas,
      nombre: `#${h.id} · ${h.fecha.slice(8, 10)}/${h.fecha.slice(5, 7)}`,
    }))
    const totalParadas = datos.reduce((s, h) => s + h.paradas, 0)
    return {
      visibles,
      topeKm: escalaRedonda(Math.max(0, ...visibles.map((h) => h.km))),
      topeParadas: escalaRedonda(Math.max(0, ...visibles.map((h) => h.paradas))),
      kmPorParada: totalParadas ? datos.reduce((s, h) => s + h.km, 0) / totalParadas : null,
      recortado: ordenadas.length > visibles.length,
    }
  }, [datos])

  if (!datos.length) {
    return <Panel titulo="Paradas vs km por hoja de ruta" bajada="Eficiencia de los recorridos" vacio="No hay hojas de ruta finalizadas con km en el período." />
  }
  return (
    <Panel
      titulo="Paradas vs km por hoja de ruta"
      bajada={`Cada fila es una hoja finalizada${r.recortado ? ` (las ${HOJAS_VISIBLES} más recientes)` : ""}: paradas a la izquierda, km a la derecha${
        r.kmPorParada !== null ? ` · ${decimal(r.kmPorParada)} km por parada en promedio` : ""
      }.`}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={200}>
        <BarChart data={r.visibles} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 4 }} barCategoryGap="14%">
          <CartesianGrid horizontal={false} {...GRILLA} />
          <XAxis
            xAxisId="paradas"
            type="number"
            orientation="top"
            domain={[-r.topeParadas, r.topeParadas]}
            ticks={[-r.topeParadas, -r.topeParadas / 2, 0]}
            tickFormatter={(v) => String(Math.abs(Number(v)))}
            height={ALTO_EJE_X}
            tick={MARCAS}
            tickLine={false}
            axisLine={false}
            label={{ ...tituloX("Paradas"), position: "insideTop" }}
          />
          <XAxis
            xAxisId="km"
            type="number"
            domain={[-r.topeKm, r.topeKm]}
            ticks={[0, r.topeKm / 2, r.topeKm]}
            tickFormatter={(v) => decimal(Number(v))}
            height={ALTO_EJE_X}
            tick={MARCAS}
            tickLine={false}
            axisLine={false}
            label={tituloX("Kilómetros")}
          />
          <YAxis type="category" dataKey="nombre" width={96} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} interval={0} label={tituloY("Hoja de ruta")} />
          <ReferenceLine xAxisId="km" x={0} stroke={COLOR.gris} />
          <Tooltip
            cursor={{ fill: "rgba(0,0,0,0.04)" }}
            content={({ payload }) => {
              const h = payload?.[0]?.payload as GraficosCircuito["eficienciaRutas"][number] | undefined
              return h ? <CajaTooltip lineas={[h.transportista, dia(h.fecha), `${h.paradas} paradas · ${decimal(h.km)} km`]} /> : null
            }}
          />
          <Legend iconType="square" verticalAlign="top" wrapperStyle={{ fontSize: 12, paddingBottom: 8 }} formatter={textoLeyenda} />
          <Bar xAxisId="paradas" stackId="hoja" dataKey="paradasNegativas" name="Paradas" fill={COLOR.naranja} radius={[4, 0, 0, 4]}>
            <LabelList dataKey="paradas" position="left" style={{ fontSize: 9, fill: "currentColor" }} />
          </Bar>
          <Bar xAxisId="km" stackId="hoja" dataKey="km" name="Km recorridos" fill={COLOR.azul} radius={[0, 4, 4, 0]}>
            <LabelList dataKey="km" position="right" formatter={(v) => decimal(Number(v))} style={{ fontSize: 9, fill: "currentColor" }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Panel>
  )
}

export function tarjetasDelCircuito(resumen?: ResumenCircuito): Tarjeta[] {
  if (!resumen) return []
  const g = resumen.graficos
  const todas: [Tarjeta, boolean?][] = [
    [{ id: "etapas-ciclo", ancho: 6, alto: 11, contenido: <EtapasDelCiclo datos={g.cicloPorEtapa} promedio={resumen.ciclo?.promedio} /> }, true],
    [{ id: "reutilizacion-tipo", ancho: 6, alto: 12, contenido: <ReutilizacionPorTipo datos={g.destinoPorTipo} /> }],
    [{ id: "calor-turnos", ancho: 6, alto: 12, contenido: <MapaDeCalorTurnos datos={g.demandaTurnos} /> }, true],
    [{ id: "donantes-principales", ancho: 6, alto: 12, contenido: <DonantesPrincipales datos={g.mapaDonantes} /> }, true],
    [{ id: "kilos-mes", ancho: 6, alto: 11, contenido: <KilosPorMes datos={g.kgPorMesYTipo} /> }, true],
    [{ id: "matriz-destruccion", ancho: 6, alto: 12, contenido: <MatrizDestruccion datos={g.destruccionPorMetodoYMedio} /> }],
    [{ id: "paradas-km", ancho: 6, alto: 13, contenido: <ParadasVsKm datos={g.eficienciaRutas} /> }, true],
  ]
  return todas.filter(([, soloCompleto]) => resumen.completo || !soloCompleto).map(([tarjeta]) => tarjeta)
}
