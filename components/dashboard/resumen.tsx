"use client"

import Link from "next/link"
import { ArrowRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { usePerfil } from "@/hooks/use-auth"
import { ubicarRuta } from "@/lib/type/menu"
import { decimal, entero, porcentaje } from "@/lib/utils/formato"  
import type { Contador, ResumenCircuito } from "@/lib/type/dashboard"


function contadores(p: ResumenCircuito["pendiente"] | undefined): Contador[] {
  const lista: (Contador | null)[] = [
    p?.turnosSinAsignarManana != null
      ? { clave: "turnos", etiqueta: "Turnos de mañana sin asignar", motivo: "Falta definir quién los recibe", valor: p.turnosSinAsignarManana, ruta: "/pages/turno" }
      : null,
    { clave: "lotes", etiqueta: "Lotes por clasificar", motivo: "Tienen materiales sin condición", valor: p?.lotesPorClasificar ?? 0, ruta: "/pages/material" },
    { clave: "procesos", etiqueta: "Procesos de destrucción abiertos", motivo: "Todavía sin finalizar", valor: p?.procesosAbiertos ?? 0, ruta: "/pages/proceso-destruccion" },
    p?.donacionesParaCertificar != null
      ? { clave: "certificar", etiqueta: "Donaciones listas para certificar", motivo: "Esperan el certificado de disposición", valor: p.donacionesParaCertificar, ruta: "/pages/certificado-disposicion" }
      : null,
  ]
  return lista.filter((c): c is Contador => c !== null)
}

function TarjetaPendiente({ contador, enlazar }: { contador: Contador; enlazar: boolean }) {
  const alDia = contador.valor === 0
  const cuerpo = (
    <>
      <span className="text-xs leading-tight text-muted-foreground">{contador.etiqueta}</span>
      <span className={cn("text-3xl font-medium leading-none tabular-nums", alDia ? "text-foreground" : "text-amber-600 dark:text-amber-400")}>
        {entero(contador.valor)}
      </span>
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        {alDia ? (
          <>
            <CheckCircle2 className="size-3.5 text-green-600" aria-hidden />
            Al día
          </>
        ) : (
          contador.motivo
        )}
      </span>
      {enlazar && (
        <span className="mt-auto inline-flex items-center gap-1 self-end pt-1 text-xs font-medium text-primary">
          Ir a resolver
          <ArrowRight className="size-3" />
        </span>
      )}
    </>
  )
  const base = "flex min-w-0 flex-col gap-1.5 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/5"
  return enlazar ? (
    <Link href={contador.ruta} className={cn(base, "transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring")}>
      {cuerpo}
    </Link>
  ) : (
    <div className={base}>{cuerpo}</div>
  )
}

export function TrabajoPendiente({ resumen }: { resumen?: ResumenCircuito }) {
  const perfil = usePerfil()
  const lista = contadores(resumen?.pendiente)
  return (
    <section aria-labelledby="dash-pendiente" className="flex flex-col gap-3">
      <div>
        <h2 id="dash-pendiente" className="text-base font-medium text-foreground">Trabajo pendiente</h2>
        <p className="text-xs text-muted-foreground">Lo que queda por hacer hoy. Cada tarjeta lleva a la pantalla donde se resuelve.</p>
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {lista.map((c) => (
          <TarjetaPendiente key={c.clave} contador={c} enlazar={!!perfil && ubicarRuta(c.ruta, perfil) !== null} />
        ))}
      </div>
    </section>
  )
}

const FRANJAS = ["bg-blue-500", "bg-green-600", "bg-amber-500", "bg-violet-500", "bg-teal-500", "bg-pink-500"]

interface Dato {
  clave: string
  etiqueta: string
  valor: string
  detalle: string
}

function datosDelCircuito(r: ResumenCircuito): Dato[] {
  const { ciclo, reutilizacion: reu, medios, donantes, kmPorRetiro } = r
  const lista: (Dato | false)[] = [
    r.completo && {
      clave: "ciclo",
      etiqueta: "Tiempo de ciclo",
      valor: ciclo ? `${decimal(ciclo.promedio)} días` : "—",
      detalle: ciclo
        ? `Mínimo ${decimal(ciclo.min)} · máximo ${decimal(ciclo.max)} · ${entero(ciclo.donaciones)} donaciones`
        : "Ninguna donación certificada en el período",
    },
    {
      clave: "reutilizacion",
      etiqueta: "Tasa de reutilización",
      valor: reu.pctReutilizable !== null ? `${reu.pctReutilizable} %` : "—",
      detalle: reu.total > 0 ? `${reu.pctDesecho ?? 0} % a desecho sobre ${entero(reu.total)} materiales` : "Sin materiales clasificados",
    },
    { clave: "kg", etiqueta: "Kg procesados", valor: `${entero(r.kgProcesados)} kg`, detalle: "Peso bruto de los lotes pesados" },
    {
      clave: "medios",
      etiqueta: "Medios de datos destruidos",
      valor: medios.total > 0 ? `${entero(medios.finalizados)} de ${entero(medios.total)}` : "—",
      detalle: medios.total > 0 ? `${porcentaje(medios.finalizados, medios.total)} con destrucción segura (NIST SP 800-88)` : "Sin procesos en el período",
    },
    !!donantes && {
      clave: "donantes",
      etiqueta: "Donantes recurrentes",
      valor: donantes.total > 0 ? `${entero(donantes.recurrentes)} de ${entero(donantes.total)}` : "—",
      detalle: donantes.total > 0 ? `${porcentaje(donantes.recurrentes, donantes.total)} donó más de una vez` : "Sin donaciones en el período",
    },
    !!kmPorRetiro && {
      clave: "km",
      etiqueta: "Km por retiro",
      valor: kmPorRetiro.valor !== null ? `${decimal(kmPorRetiro.valor)} km` : "—",
      detalle: kmPorRetiro.retiros > 0 ? `${decimal(kmPorRetiro.km)} km en ${entero(kmPorRetiro.retiros)} retiros` : "Sin hojas de ruta finalizadas",
    },
  ]
  return lista.filter((d): d is Dato => !!d)
}

const COLUMNAS_LG = ["lg:grid-cols-1", "lg:grid-cols-1", "lg:grid-cols-2", "lg:grid-cols-3", "lg:grid-cols-4", "lg:grid-cols-5", "lg:grid-cols-3"]

const columnas = (n: number) => COLUMNAS_LG[Math.min(n, COLUMNAS_LG.length - 1)]

export function IndicadoresCircuito({ resumen }: { resumen?: ResumenCircuito }) {
  if (!resumen) return null
  const datos = datosDelCircuito(resumen)
  return (
    <section aria-labelledby="dash-indicadores" className="flex flex-col gap-3">
      <div>
        <h2 id="dash-indicadores" className="text-base font-medium text-foreground">Indicadores del circuito</h2>
        <p className="text-xs text-muted-foreground">Cuánto tarda el circuito y qué resultado deja en el período elegido.</p>
      </div>
      <div className={cn("grid grid-cols-1 gap-3 sm:grid-cols-2", columnas(datos.length))}>
        {datos.map((d, i) => (
          <div key={d.clave} className="relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl bg-card p-4 pl-5 shadow-sm ring-1 ring-foreground/5">
            <span className={cn("absolute inset-y-0 left-0 w-1", FRANJAS[i % FRANJAS.length])} aria-hidden />
            <span className="text-xs font-medium leading-tight text-muted-foreground">{d.etiqueta}</span>
            <span className="text-2xl font-semibold leading-none tabular-nums text-foreground">{d.valor}</span>
            <span className="text-xs leading-snug text-muted-foreground">{d.detalle}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
