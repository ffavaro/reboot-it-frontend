"use client"

import { useMemo, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { BarChart3, FileDown, FileSpreadsheet, Table2, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { DateInput } from "@/components/ui/date-input"
import { SearchInput } from "@/components/ui/search-input"
import { Leyenda } from "@/components/dashboard/panel"
import { ALTO_EJE_X, CAJA_TOOLTIP, CURSOR_BARRA, GRILLA, MARCAS, tituloX, tituloY } from "../estilo"
import { decimal, diaCorto, entero, mesCorto } from "@/lib/utils/formato"
import { exportToExcel, exportToPdf } from "@/lib/utils/export"
import { COLUMNAS_ARCHIVO, ESTADOS, LIMITE_TABLA, MovimientosProps } from "@/lib/type/dashboard"


const VACIO = { desde: "", hasta: "", estado: "", donanteId: "", texto: "" }


export function MovimientosDeLotes({ filas, periodo, cargando }: MovimientosProps) {
  const [vista, setVista] = useState<"grafico" | "tabla">("grafico")
  const [f, setF] = useState(VACIO)
  const propios = !!f.desde || !!f.hasta
  const desde = propios ? f.desde : periodo.fechaDesde
  const hasta = propios ? f.hasta : periodo.fechaHasta
  const filtrando = Object.values(f).some(Boolean)
  const cambiar = (parcial: Partial<typeof VACIO>) => setF((actual) => ({ ...actual, ...parcial }))

  const elegidas = useMemo(() => {
    const q = f.texto.trim().toLowerCase()
    return filas.filter(
      (fila) =>
        !!fila.fechaIso &&
        (!desde || fila.fechaIso >= desde) &&
        (!hasta || fila.fechaIso <= hasta) &&
        (!f.estado || fila.estado === f.estado) &&
        (!f.donanteId || String(fila.donanteId) === f.donanteId) &&
        (!q || fila.donante.toLowerCase().includes(q)),
    )
  }, [filas, desde, hasta, f.estado, f.donanteId, f.texto])

  const donantes = useMemo(() => {
    const vistos = new Map<number, string>()
    filas.forEach((fila) => fila.donanteId !== null && vistos.set(fila.donanteId, fila.donante))
    return [...vistos.entries()].sort((a, b) => a[1].localeCompare(b[1], "es"))
  }, [filas])

  const porMes = useMemo(() => {
    const meses = new Map<string, Record<string, number | string>>()
    elegidas.forEach((fila) => {
      const clave = fila.fechaIso.slice(0, 7)
      const fil = meses.get(clave) ?? { mes: mesCorto(clave), pesoKg: 0, ...Object.fromEntries(ESTADOS.map((e) => [e.nombre, 0])) }
      fil[fila.estado] = Number(fil[fila.estado]) + 1
      fil.pesoKg = Math.round((Number(fil.pesoKg) + fila.pesoKg) * 10) / 10
      meses.set(clave, fil)
    })
    return [...meses.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, fil]) => fil)
  }, [elegidas])

  const visibles = elegidas.slice(0, LIMITE_TABLA)
  const pesoTotal = elegidas.reduce((s, fila) => s + fila.pesoKg, 0)
  const archivo = { fileName: "movimientos-lotes" }
  const claseControl = "h-8 rounded-lg border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/5">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-medium">Últimos movimientos de lotes</h3>
          <div role="group" aria-label="Formato" className="inline-flex rounded-lg border border-border p-0.5">
            {([["grafico", "Gráfico", BarChart3], ["tabla", "Tabla", Table2]] as const).map(([clave, texto, Icono]) => (
              <button
                key={clave}
                type="button"
                aria-pressed={vista === clave}
                onClick={() => setVista(clave)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors",
                  vista === clave ? "bg-blue-50 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300" : "text-muted-foreground hover:bg-muted",
                )}
              >
                <Icono className="size-3.5" />
                {texto}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={!visibles.length}
            onClick={() => exportToPdf(visibles, COLUMNAS_ARCHIVO, { ...archivo, title: "Últimos movimientos de lotes" })}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileDown className="size-3.5" />
            PDF
          </button>
          <button
            type="button"
            disabled={!visibles.length}
            onClick={() => exportToExcel(visibles, COLUMNAS_ARCHIVO, { ...archivo, sheetName: "Lotes" })}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileSpreadsheet className="size-3.5" />
            Excel
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <DateInput value={f.desde} onChange={(v) => cambiar({ desde: v })} placeholder="Desde" className="h-8 w-32 text-xs" aria-label="Lotes desde" />
        <DateInput value={f.hasta} onChange={(v) => cambiar({ hasta: v })} placeholder="Hasta" className="h-8 w-32 text-xs" aria-label="Lotes hasta" />
        {!propios && <span className="text-xs text-muted-foreground">Usa el período general</span>}
        <select value={f.estado} onChange={(e) => cambiar({ estado: e.target.value })} className={claseControl} aria-label="Estado del lote">
          <option value="">Todos los estados</option>
          {ESTADOS.map((e) => (
            <option key={e.nombre} value={e.nombre}>
              {e.nombre}
            </option>
          ))}
        </select>
        <select value={f.donanteId} onChange={(e) => cambiar({ donanteId: e.target.value })} className={claseControl} aria-label="Donante del lote">
          <option value="">Todos los donantes</option>
          {donantes.map(([id, nombre]) => (
            <option key={id} value={String(id)}>
              {nombre}
            </option>
          ))}
        </select>
        <SearchInput placeholder="Buscar donante…" value={f.texto} onChange={(e) => cambiar({ texto: e.target.value })} className="w-44" />
        {filtrando && (
          <button type="button" onClick={() => setF(VACIO)} className="inline-flex items-center gap-1 px-1 text-xs text-muted-foreground hover:text-foreground">
            <X className="size-3" />
            Limpiar
          </button>
        )}
      </div>

      {cargando ? (
        <p className="flex min-h-[200px] flex-1 items-center justify-center text-sm text-muted-foreground">Cargando…</p>
      ) : !elegidas.length ? (
        <p className="flex min-h-[200px] flex-1 items-center justify-center text-sm text-muted-foreground">No hay lotes con esos filtros.</p>
      ) : vista === "grafico" ? (
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <Leyenda items={ESTADOS.map((e) => ({ nombre: e.nombre, color: e.color }))} />
            <span className="text-xs text-muted-foreground">
              {entero(elegidas.length)} lotes · {decimal(pesoTotal)} kg
            </span>
          </div>
          <ResponsiveContainer width="100%" height="100%" minHeight={200}>
            <BarChart data={porMes} barCategoryGap="25%">
              <CartesianGrid vertical={false} {...GRILLA} />
              <XAxis dataKey="mes" height={ALTO_EJE_X} tick={MARCAS} tickLine={false} axisLine={false} label={tituloX("Mes de ingreso")} />
              <YAxis width={52} tick={MARCAS} tickLine={false} axisLine={false} allowDecimals={false} label={tituloY("Lotes")} />
              <Tooltip
                contentStyle={CAJA_TOOLTIP}
                cursor={CURSOR_BARRA}
                formatter={(v, nombre) => [`${v} lotes`, String(nombre)]}
                labelFormatter={(mes, payload) => {
                  const peso = payload?.[0]?.payload?.pesoKg
                  return peso !== undefined ? `${mes} · ${peso} kg` : String(mes)
                }}
              />
              {ESTADOS.map((e, i) => (
                <Bar key={e.nombre} dataKey={e.nombre} name={e.nombre} stackId="estado" fill={e.color} radius={i === ESTADOS.length - 1 ? [4, 4, 0, 0] : 0} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="bg-muted/60 text-xs text-muted-foreground">
                  {["Ingreso", "Lote", "Donante", "Peso (kg)", "Estado"].map((t) => (
                    <th key={t} className="px-4 py-2.5 text-left font-medium">
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {visibles.map((fila) => (
                  <tr key={fila.loteId} className="hover:bg-muted/30">
                    <td className="px-4 py-3 text-muted-foreground">{diaCorto(fila.fechaIso)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{fila.codigo}</td>
                    <td className="truncate px-4 py-3">{fila.donante}</td>
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">{fila.pesoKg.toFixed(1)}</td>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", ESTADOS.find((e) => e.nombre === fila.estado)?.clase)}>
                        {fila.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {elegidas.length > visibles.length && (
            <p className="border-t border-border px-4 py-2 text-xs text-muted-foreground">
              Se muestran {visibles.length} de {elegidas.length} lotes. Acotá los filtros para ver otros.
            </p>
          )}
        </>
      )}
    </article>
  )
}
