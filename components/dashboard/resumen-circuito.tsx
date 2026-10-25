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
  const contenido = (
    <>
      <p className="text-xs text-muted-foreground leading-tight">{etiqueta}</p>
      <p className={`text-3xl font-medium leading-none ${alDia ? "text-foreground" : "text-amber-600 dark:text-amber-400"}`}>{num(valor)}</p>
      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {alDia ? (<><CheckCircle2 className="size-3.5 text-green-600" aria-hidden /> Al día</>) : detalle}
      </p>
    </>
  )
  const clase = "rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4 flex flex-col gap-1.5 min-w-0"
  return puedeVerPantalla(permisos, claveDeRuta(href)) ? (
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
function Indicador({ etiqueta, valor, detalle }: { etiqueta: string; valor: string; detalle?: string }) {
  return (
    <div className="rounded-xl bg-card shadow-sm ring-1 ring-foreground/5 p-4 flex flex-col gap-1 min-w-0">
      <p className="text-xs text-muted-foreground leading-tight">{etiqueta}</p>
      <p className="text-2xl font-medium text-foreground leading-none">{valor}</p>
      {detalle && <p className="text-xs text-muted-foreground">{detalle}</p>}
    </div>
  )
}

export function IndicadoresCircuito({ resumen }: { resumen?: DashboardResumen }) {
  if (!resumen) return null
  const { ciclo, reutilizacion: r, medios, donantes, kmPorRetiro } = resumen
  return (
    <section aria-labelledby="titulo-indicadores" className="flex flex-col gap-3">
      <div>
        <h2 id="titulo-indicadores" className="text-base font-medium text-foreground">Indicadores del circuito</h2>
        <p className="text-xs text-muted-foreground">Cuánto tarda el circuito y qué resultado deja, en el período elegido.</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {resumen.completo && (
          <Indicador
            etiqueta="Tiempo de ciclo"
            valor={ciclo ? `${decimal(ciclo.promedio)} días` : "—"}
            detalle={ciclo ? `Mín. ${decimal(ciclo.min)} · máx. ${decimal(ciclo.max)} · ${num(ciclo.donaciones)} donaciones` : "Sin certificados emitidos en el período"}
          />
        )}
        <Indicador
          etiqueta="Tasa de reutilización"
          valor={r.pctReutilizable !== null ? `${r.pctReutilizable} %` : "—"}
          detalle={r.total > 0 ? `reutilizable · ${r.pctDesecho ?? 0} % desecho (${num(r.total)} materiales)` : "Sin materiales clasificados"}
        />
        <Indicador etiqueta="Kg procesados" valor={`${num(resumen.kgProcesados)} kg`} detalle="Peso bruto de los lotes pesados" />
        <Indicador
          etiqueta="Medios de datos destruidos"
          valor={medios.total > 0 ? `${num(medios.finalizados)} de ${num(medios.total)}` : "—"}
          detalle={medios.total > 0 ? `${porcentaje(medios.finalizados, medios.total)} · destrucción segura (NIST SP 800-88)` : "Sin procesos en el período"}
        />
        {donantes && (
          <Indicador
            etiqueta="Donantes recurrentes"
            valor={donantes.total > 0 ? `${num(donantes.recurrentes)} de ${num(donantes.total)}` : "—"}
            detalle={donantes.total > 0 ? `${porcentaje(donantes.recurrentes, donantes.total)} con más de una donación` : "Sin donaciones en el período"}
          />
        )}
        {kmPorRetiro && (
          <Indicador
            etiqueta="Km por retiro"
            valor={kmPorRetiro.valor !== null ? `${decimal(kmPorRetiro.valor)} km` : "—"}
            detalle={kmPorRetiro.retiros > 0 ? `${decimal(kmPorRetiro.km)} km en ${num(kmPorRetiro.retiros)} retiros` : "Sin hojas de ruta finalizadas"}
          />
        )}
      </div>
    </section>
  )
}
