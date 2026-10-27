"use client"

import Link from "next/link"
import { CheckCircle2 } from "lucide-react"
import { useMisPermisos } from "@/hooks/use-permisos"
import { claveDeRuta, puedeVerPantalla } from "@/lib/nav"
import type { DashboardResumen } from "@/lib/type/dashboard"

const num = (n: number) => n.toLocaleString("es-AR")
const decimal = (n: number) => n.toLocaleString("es-AR", { maximumFractionDigits: 1 })
const porcentaje = (parte: number, total: number) => (total > 0 ? `${Math.round((parte / total) * 100)} %` : "—")

// ── Trabajo pendiente: lo primero que mira quien arma el trabajo del día ───────
function ContadorPendiente({ etiqueta, detalle, valor, href }: { etiqueta: string; detalle: string; valor: number; href: string }) {
  const { permisos } = useMisPermisos()
  const alDia = valor === 0
  const puedeVer = puedeVerPantalla(permisos, claveDeRuta(href))
  const contenido = (
    <>
      <p className="text-xs text-muted-foreground leading-tight">{etiqueta}</p>
      <p className={`text-3xl font-medium leading-none ${alDia ? "text-foreground" : "text-amber-600 dark:text-amber-400"}`}>{num(valor)}</p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {alDia ? (<><CheckCircle2 className="size-3.5 text-green-600" aria-hidden /> Al día</>) : detalle}
      </p>
      {/* Solo si el usuario puede abrir la pantalla; el recuadro entero es el enlace */}
      {puedeVer && <span className="mt-auto self-end pt-1 text-xs font-medium text-primary">Ver más -&gt;</span>}
    </>
  )
  const clase = "rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4 flex flex-col gap-1.5 min-w-0"
  return puedeVer ? (
    <Link href={href} className={`${clase} transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring`}>
      {contenido}
    </Link>
  ) : (
    <div className={clase}>{contenido}</div>
  )
}

export function TrabajoPendiente({ resumen }: { resumen?: DashboardResumen }) {
  const p = resumen?.pendiente
  return (
    <section aria-labelledby="titulo-pendiente" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-pendiente" className="text-base font-medium text-foreground">Trabajo pendiente</h2>
        <p className="text-xs text-muted-foreground">Lo que hay que hacer hoy. Cada contador lleva a la pantalla donde se resuelve.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {p?.turnosSinAsignarManana != null && (
          <ContadorPendiente etiqueta="Turnos de mañana sin asignar" detalle="Falta asignar a quién los recibe" valor={p.turnosSinAsignarManana} href="/pages/turno" />
        )}
        <ContadorPendiente etiqueta="Lotes por clasificar" detalle="Con materiales sin condición" valor={p?.lotesPorClasificar ?? 0} href="/pages/material" />
        <ContadorPendiente etiqueta="Procesos de destrucción abiertos" detalle="Sin finalizar" valor={p?.procesosAbiertos ?? 0} href="/pages/proceso-destruccion" />
        {p?.donacionesParaCertificar != null && (
          <ContadorPendiente etiqueta="Donaciones listas para certificar" detalle="Esperan su certificado de disposición" valor={p.donacionesParaCertificar} href="/pages/donacion" />
        )}
      </div>
    </section>
  )
}

// ── Indicadores del período ───────────────────────────────────────────────────
type Tono = "azul" | "verde" | "ambar" | "violeta" | "turquesa" | "rosa"
const TONOS: Record<Tono, string> = {
  azul: "bg-blue-500",
  verde: "bg-green-600",
  ambar: "bg-amber-500",
  violeta: "bg-violet-500",
  turquesa: "bg-teal-500",
  rosa: "bg-pink-500",
}

function Indicador({ etiqueta, valor, detalle, tono }: { etiqueta: string; valor: string; detalle?: string; tono: Tono }) {
  return (
    <div className="relative flex min-w-0 flex-col gap-1.5 overflow-hidden rounded-xl bg-card p-4 pl-5 shadow-sm ring-1 ring-foreground/5">
      <span className={`absolute inset-y-0 left-0 w-1 ${TONOS[tono]}`} aria-hidden />
      <p className="text-xs font-medium text-muted-foreground leading-tight">{etiqueta}</p>
      <p className="text-2xl font-semibold leading-none tabular-nums text-foreground">{valor}</p>
      {detalle && <p className="text-xs leading-snug text-muted-foreground">{detalle}</p>}
    </div>
  )
}

// Cuántas columnas usar según la cantidad de indicadores (6 → 3 + 3, 4 → 4, 5 → 5…), sin dejar huecos
const COLUMNAS_POR_CANTIDAD: Record<number, string> = {
  1: "lg:grid-cols-1",
  2: "lg:grid-cols-2",
  3: "lg:grid-cols-3",
  4: "lg:grid-cols-4",
  5: "lg:grid-cols-5",
  6: "lg:grid-cols-3",
}

export function IndicadoresCircuito({ resumen }: { resumen?: DashboardResumen }) {
  if (!resumen) return null
  const { ciclo, reutilizacion: r, medios, donantes, kmPorRetiro } = resumen
  const indicadores: React.ReactNode[] = []
  if (resumen.completo) {
    indicadores.push(
      <Indicador
        key="ciclo"
        tono="azul"
        etiqueta="Tiempo de ciclo"
        valor={ciclo ? `${decimal(ciclo.promedio)} días` : "—"}
        detalle={ciclo ? `Mín. ${decimal(ciclo.min)} · máx. ${decimal(ciclo.max)} · ${num(ciclo.donaciones)} donaciones` : "Sin certificados emitidos en el período"}
      />,
    )
  }
  indicadores.push(
    <Indicador
      key="reutilizacion"
      tono="verde"
      etiqueta="Tasa de reutilización"
      valor={r.pctReutilizable !== null ? `${r.pctReutilizable} %` : "—"}
      detalle={r.total > 0 ? `reutilizable · ${r.pctDesecho ?? 0} % desecho (${num(r.total)} materiales)` : "Sin materiales clasificados"}
    />,
    <Indicador key="kg" tono="ambar" etiqueta="Kg procesados" valor={`${num(resumen.kgProcesados)} kg`} detalle="Peso bruto de los lotes pesados" />,
    <Indicador
      key="medios"
      tono="violeta"
      etiqueta="Medios de datos destruidos"
      valor={medios.total > 0 ? `${num(medios.finalizados)} de ${num(medios.total)}` : "—"}
      detalle={medios.total > 0 ? `${porcentaje(medios.finalizados, medios.total)} · destrucción segura (NIST SP 800-88)` : "Sin procesos en el período"}
    />,
  )
  if (donantes) {
    indicadores.push(
      <Indicador
        key="donantes"
        tono="turquesa"
        etiqueta="Donantes recurrentes"
        valor={donantes.total > 0 ? `${num(donantes.recurrentes)} de ${num(donantes.total)}` : "—"}
        detalle={donantes.total > 0 ? `${porcentaje(donantes.recurrentes, donantes.total)} con más de una donación` : "Sin donaciones en el período"}
      />,
    )
  }
  if (kmPorRetiro) {
    indicadores.push(
      <Indicador
        key="km"
        tono="rosa"
        etiqueta="Km por retiro"
        valor={kmPorRetiro.valor !== null ? `${decimal(kmPorRetiro.valor)} km` : "—"}
        detalle={kmPorRetiro.retiros > 0 ? `${decimal(kmPorRetiro.km)} km en ${num(kmPorRetiro.retiros)} retiros` : "Sin hojas de ruta finalizadas"}
      />,
    )
  }
  return (
    <section aria-labelledby="titulo-indicadores" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-indicadores" className="text-base font-medium text-foreground">Indicadores del circuito</h2>
        <p className="text-xs text-muted-foreground">Cuánto tarda el circuito y qué resultado deja, en el período elegido.</p>
      </div>
      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${COLUMNAS_POR_CANTIDAD[indicadores.length] ?? "lg:grid-cols-4"}`}>
        {indicadores}
      </div>
    </section>
  )
}
