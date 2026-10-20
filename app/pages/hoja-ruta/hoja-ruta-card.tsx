"use client"

import type { ReactNode } from "react"
import { CheckCircle2 } from "lucide-react"
import { EstadoHojaBadge } from "@/components/ui/estado-hoja-badge"
import { formatFechaISO, formatKm } from "@/lib/utils/helpers"
import { cn } from "@/lib/utils"
import type { HojaRutaDia, ParadaHojaRuta } from "@/lib/type/hoja-ruta"

function formatHora(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function nombreTransportista(h: HojaRutaDia): string {
  return h.transportista ? `${h.transportista.nombre} ${h.transportista.apellido}` : `Transportista #${h.empleadoTransportistaId}`
}

// Mensaje para wa.me con el detalle de la hoja de ruta y el link de Google Maps
export function buildWhatsAppUrl(h: HojaRutaDia): string {
  const lineas = [
    `*Hoja de ruta* - ${formatFechaISO(h.fecha)}`,
    `Transportista: ${nombreTransportista(h)}`,
    h.vehiculo ? `Vehículo: ${h.vehiculo.patente} (${h.vehiculo.marca} ${h.vehiculo.modelo})` : "Vehículo: sin asignar",
    `Estado: ${h.estado}`,
    ...(h.kmEstimados !== null ? [`Km estimados: ${formatKm(h.kmEstimados)}`] : []),
    "",
    `Paradas (${h.paradas.length}):`,
    ...h.paradas.map(
      (p) => `${p.orden}. ${p.donante} - ${p.direccion || "Sin dirección cargada"} (${formatHora(p.fechaHora)} hs)${p.retirado ? " ✔ retirado" : ""}`,
    ),
  ]
  if (h.mapsUrl) lineas.push("", `Ver ruta en Google Maps: ${h.mapsUrl}`)
  return `https://wa.me/?text=${encodeURIComponent(lineas.join("\n"))}`
}

export function HojaRutaCard({
  hoja, mostrarTransportista = true, actions, accionesParada,
}: {
  hoja: HojaRutaDia
  mostrarTransportista?: boolean
  actions: ReactNode
  // Botones de cada turno (por ejemplo "Confirmar retiro" o "Ver constancia")
  accionesParada?: (parada: ParadaHojaRuta) => ReactNode
}) {
  const info = hoja.hojaRuta
  const retirados = hoja.paradas.filter((p) => p.retirado).length
  return (
    <div className="flex flex-col gap-4 rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            {mostrarTransportista && <p className="text-base font-semibold">{nombreTransportista(hoja)}</p>}
            <EstadoHojaBadge estado={hoja.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            {formatFechaISO(hoja.fecha)}
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

      <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm">
        <span className="text-muted-foreground">
          Turnos: <span className="font-medium text-foreground">{hoja.paradas.length}</span>
          {hoja.estado !== "Pendiente" && (
            <span className="ml-1 text-xs">({retirados} retirado{retirados !== 1 ? "s" : ""})</span>
          )}
        </span>
        <span className="text-muted-foreground">
          Km estimados{hoja.origen ? " (ida y vuelta)" : ""}:{" "}
          <span className="font-medium text-foreground">{hoja.kmEstimados !== null ? formatKm(hoja.kmEstimados) : "—"}</span>
          {hoja.rutaOptimizada && <span className="ml-1 text-xs">(ruta optimizada)</span>}
        </span>
        {info?.kmInicial != null && (
          <span className="text-muted-foreground">
            Km inicial: <span className="font-medium text-foreground">{formatKm(info.kmInicial)}</span>
          </span>
        )}
        {info?.kmFinal != null && (
          <span className="text-muted-foreground">
            Km final: <span className="font-medium text-foreground">{formatKm(info.kmFinal)}</span>
          </span>
        )}
        {hoja.origen && (
          <span className="text-muted-foreground">
            Base: <span className="font-medium text-foreground">{hoja.origen}</span>
          </span>
        )}
      </div>

      {hoja.advertencia && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{hoja.advertencia}</p>
      )}

      {hoja.paradas.length === 0 ? (
        <p className="py-2 text-sm italic text-muted-foreground">Sin turnos pendientes de retiro.</p>
      ) : (
        <>
          {/* Mapa con los turnos (marcadores) y el recorrido */}
          {hoja.embedUrl ? (
            <div className="flex flex-col gap-2">
              <iframe
                src={hoja.embedUrl}
                title={`Ruta de ${nombreTransportista(hoja)}`}
                className="h-[420px] w-full rounded-md border border-border"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <p className="text-xs text-muted-foreground">
                Orden de visita: {hoja.paradas.map((p) => `${p.orden}. ${p.donante}`).join(" → ")}
              </p>
            </div>
          ) : (
            <p className="rounded-md border border-dashed py-10 text-center text-sm italic text-muted-foreground">
              {hoja.estado === "Finalizada"
                ? "El mapa no está disponible para hojas de ruta finalizadas."
                : "Ningún turno tiene dirección cargada: no hay ruta para mostrar."}
            </p>
          )}

          {hoja.recorrido.length > 0 && (
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Recorrido</p>
              <ol className="flex flex-col gap-2">
                {hoja.recorrido.map((p, i) => {
                  const paradasPrevias = hoja.recorrido.slice(0, i).filter((x) => x.rol === "parada").length
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
                        {p.rol === "origen" ? "O" : p.rol === "destino" ? "D" : paradasPrevias + 1}
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
          )}

          {/* Turnos de la hoja: pendientes de retiro y ya retirados */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Turnos</p>
            <ul className="flex flex-col divide-y rounded-md border">
              {hoja.paradas.map((p) => (
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
                        <span className="tabular-nums">{formatHora(p.fechaHora)} hs</span>
                      </p>
                    </div>
                  </div>
                  {accionesParada && <div className="flex flex-wrap gap-2">{accionesParada(p)}</div>}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  )
}
