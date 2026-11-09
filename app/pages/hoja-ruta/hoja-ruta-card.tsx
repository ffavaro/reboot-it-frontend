"use client"

import type { ReactNode } from "react"
import { CheckCircle2, Cloud, CloudFog, CloudLightning, CloudRain, CloudSun, Snowflake, Sun } from "lucide-react"
import { EstadoHojaBadge } from "@/components/ui/estado-hoja-badge"
import { MapaRuta } from "@/components/mapa-ruta"
import { cn } from "@/lib/utils"
import { dia, hora } from "@/lib/utils/fechas"
import { kilometros } from "@/lib/utils/formato"
import { formatDuracion, nombreTransportista } from "@/lib/utils/hoja-ruta"
import type { HojaRutaDia, ParadaHojaRuta } from "@/lib/type/hoja-ruta"

const ETIQUETA = "text-xs font-medium uppercase tracking-wide text-foreground/75"

function IconoClima({ codigo }: { codigo: number }) {
  const clase = "size-6 shrink-0"
  if (codigo === 0) return <Sun className={clase} />
  if (codigo <= 2) return <CloudSun className={clase} />
  if (codigo === 3) return <Cloud className={clase} />
  if (codigo === 45 || codigo === 48) return <CloudFog className={clase} />
  if (codigo >= 95) return <CloudLightning className={clase} />
  if ((codigo >= 71 && codigo <= 77) || codigo === 85 || codigo === 86) return <Snowflake className={clase} />
  return <CloudRain className={clase} />
}

function OrdenDeVisita({ hoja }: { hoja: HojaRutaDia }) {
  return (
    <p className="text-xs text-muted-foreground">
      Orden de visita: {hoja.paradas.map((p) => `${p.orden}. ${p.donante}`).join(" → ")}
    </p>
  )
}

function Resumen({ hoja }: { hoja: HojaRutaDia }) {
  const retirados = hoja.paradas.filter((p) => p.retirado).length
  const clima = hoja.clima
  return (
    <div className="grid grid-cols-2 gap-3 rounded-lg border border-primary/20 bg-primary/5 p-3 lg:grid-cols-4">
      <div className="flex flex-col gap-0.5">
        <span className={ETIQUETA}>Turnos</span>
        <span className="text-2xl font-semibold tabular-nums">{hoja.paradas.length}</span>
        {hoja.estado !== "Pendiente" && (
          <span className="text-xs text-foreground/75">{retirados} retirado{retirados !== 1 ? "s" : ""}</span>
        )}
      </div>
      <div className="flex flex-col gap-0.5">
        <span className={ETIQUETA}>Km estimados{hoja.origen ? " (ida y vuelta)" : ""}</span>
        <span className="text-2xl font-semibold tabular-nums">
          {hoja.kmEstimados !== null ? kilometros(hoja.kmEstimados) : ""}
        </span>
        {hoja.rutaOptimizada && <span className="text-xs text-foreground/75">Ruta optimizada</span>}
      </div>
      {hoja.duracionMinutos !== null && (
        <div className="flex flex-col gap-0.5">
          <span className={ETIQUETA}>Tiempo estimado</span>
          <span className="text-2xl font-semibold tabular-nums">{formatDuracion(hoja.duracionMinutos)}</span>
          <span className="text-xs text-foreground/75">Solo manejo, sin contar cada retiro</span>
        </div>
      )}
      {clima && (
        <div className="flex flex-col gap-0.5">
          <span className={ETIQUETA}>Clima</span>
          <span className="flex items-center gap-2 text-2xl font-semibold">
            <IconoClima codigo={clima.codigo} />
            {clima.descripcion}
          </span>
          <span className="text-xs tabular-nums text-foreground/75">
            {clima.tempMin}° / {clima.tempMax}°C
            {clima.probLluvia !== null && ` · lluvia ${clima.probLluvia}%`}
            {clima.vientoMaxKmh !== null && ` · viento ${clima.vientoMaxKmh} km/h`}
          </span>
        </div>
      )}
    </div>
  )
}

function DatosKm({ hoja }: { hoja: HojaRutaDia }) {
  const info = hoja.hojaRuta
  const hayDatos = info?.kmInicial != null || info?.kmFinal != null || hoja.origen
  if (!hayDatos) return null
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
      {info?.kmInicial != null && (
        <span>Km inicial: <span className="font-medium text-foreground">{kilometros(info.kmInicial)}</span></span>
      )}
      {info?.kmFinal != null && (
        <span>Km final: <span className="font-medium text-foreground">{kilometros(info.kmFinal)}</span></span>
      )}
      {hoja.origen && (
        <span>Base: <span className="font-medium text-foreground">{hoja.origen}</span></span>
      )}
    </div>
  )
}

function Mapa({ hoja }: { hoja: HojaRutaDia }) {
  if (hoja.mapa) {
    return (
      <div className="flex flex-col gap-2">
        <MapaRuta mapa={hoja.mapa} recorrido={hoja.recorrido} />
        <OrdenDeVisita hoja={hoja} />
      </div>
    )
  }
  if (hoja.embedUrl) {
    return (
      <div className="flex flex-col gap-2">
        <iframe
          src={hoja.embedUrl}
          title={`Ruta de ${nombreTransportista(hoja)}`}
          className="h-[420px] w-full rounded-md border border-border"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <OrdenDeVisita hoja={hoja} />
      </div>
    )
  }
  return (
    <p className="rounded-md border border-dashed py-10 text-center text-sm italic text-muted-foreground">
      {hoja.estado === "Finalizada"
        ? "El mapa no está disponible para hojas de ruta finalizadas."
        : "Ningún turno tiene dirección cargada: no hay ruta para mostrar."}
    </p>
  )
}

function ListaRecorrido({ hoja }: { hoja: HojaRutaDia }) {
  if (hoja.recorrido.length === 0) return null
  const numeros = hoja.recorrido.map((p, i) =>
    p.rol === "parada" ? hoja.recorrido.slice(0, i + 1).filter((x) => x.rol === "parada").length : 0,
  )
  return (
    <div className="rounded-md border bg-muted/30 p-3">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorrido</p>
      <ol className="flex flex-col gap-2">
        {hoja.recorrido.map((p, i) => {
          const texto = p.rol === "origen" ? "O" : p.rol === "destino" ? "D" : numeros[i]
          return (
            <li key={`${p.etiqueta}-${i}`} className="flex items-start gap-3">
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white",
                  p.rol === "origen" && "bg-green-600",
                  p.rol === "destino" && "bg-red-600",
                  p.rol === "parada" && "bg-blue-600",
                )}
              >
                {texto}
              </span>
              <div className="min-w-0 text-sm">
                <p>
                  <span className="font-medium">{p.etiqueta}</span>
                  {p.donante && <span className="text-muted-foreground"> · {p.donante}</span>}
                </p>
                <p className="break-words text-xs text-muted-foreground">{p.direccion}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function ListaTurnos({
  paradas, acciones,
}: {
  paradas: ParadaHojaRuta[]
  acciones?: (parada: ParadaHojaRuta) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Turnos</p>
      <ul className="flex flex-col divide-y rounded-md border">
        {paradas.map((p) => (
          <li key={p.turnoId} className="flex flex-wrap items-center justify-between gap-3 px-3 py-2.5">
            <div className="flex min-w-0 items-start gap-3">
              <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                {p.orden}
              </span>
              <div className="min-w-0 text-sm">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="font-medium">{p.donante}</span>
                  {p.retirado ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[11px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <CheckCircle2 className="size-3" /> Retirado
                    </span>
                  ) : (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                      Pendiente de retiro
                    </span>
                  )}
                </p>
                <p className="break-words text-xs text-muted-foreground">
                  {p.direccion || <span className="italic text-destructive">Sin dirección cargada</span>}
                  {" · "}
                  <span className="tabular-nums">{hora(p.fechaHora)} hs</span>
                </p>
              </div>
            </div>
            {acciones && <div className="flex flex-wrap gap-2">{acciones(p)}</div>}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function HojaRutaCard({
  hoja, mostrarTransportista = true, actions, accionesParada,
}: {
  hoja: HojaRutaDia
  mostrarTransportista?: boolean
  actions: ReactNode
  accionesParada?: (parada: ParadaHojaRuta) => ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {mostrarTransportista && <p className="text-base font-semibold">{nombreTransportista(hoja)}</p>}
            <EstadoHojaBadge estado={hoja.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            {dia(hoja.fecha)}
            {" · "}
            {hoja.vehiculo ? (
              <>
                <span className="font-mono text-xs">{hoja.vehiculo.patente}</span> {hoja.vehiculo.marca} {hoja.vehiculo.modelo}
              </>
            ) : (
              <span className="italic text-destructive">Sin vehículo asignado</span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">{actions}</div>
      </div>

      <Resumen hoja={hoja} />
      <DatosKm hoja={hoja} />

      {hoja.advertencia && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          {hoja.advertencia}
        </p>
      )}

      {hoja.paradas.length === 0 ? (
        <p className="py-2 text-sm italic text-muted-foreground">Sin turnos pendientes de retiro.</p>
      ) : (
        <>
          <Mapa hoja={hoja} />
          <ListaRecorrido hoja={hoja} />
          <ListaTurnos paradas={hoja.paradas} acciones={accionesParada} />
        </>
      )}
    </div>
  )
}