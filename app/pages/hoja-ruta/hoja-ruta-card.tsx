"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import { Map as MapIcon, Table2 } from "lucide-react"
import { DataTable } from "@/components/ui/data-table"
import type { TableColumn } from "@/components/ui/data-table"
import { EstadoHojaBadge } from "@/components/ui/estado-hoja-badge"
import { formatFechaISO, formatKm } from "@/lib/utils/helpers"
import { cn } from "@/lib/utils"
import type { HojaRutaDia, ParadaHojaRuta } from "@/lib/type/hoja-ruta"

type Vista = "tabla" | "mapa"
type FilaParada = ParadaHojaRuta & { id: number }

const COLUMNS: TableColumn<FilaParada>[] = [
  { key: "orden", header: "#", cell: (p) => <span className="text-muted-foreground">{p.orden}</span> },
  { key: "donante", header: "Donante", cell: (p) => <span className="font-medium">{p.donante}</span> },
  {
    key: "direccion",
    header: "Dirección",
    cell: (p) => p.direccion
      ? <span className="text-muted-foreground">{p.direccion}</span>
      : <span className="italic text-destructive">Sin dirección cargada</span>,
  },
  { key: "hora", header: "Hora del turno", cell: (p) => <span className="tabular-nums text-muted-foreground">{formatHora(p.fechaHora)}</span> },
]

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
      (p) => `${p.orden}. ${p.donante} - ${p.direccion || "Sin dirección cargada"} (${formatHora(p.fechaHora)} hs)`,
    ),
  ]
  if (h.mapsUrl) lineas.push("", `Ver ruta en Google Maps: ${h.mapsUrl}`)
  return `https://wa.me/?text=${encodeURIComponent(lineas.join("\n"))}`
}

export function HojaRutaCard({
  hoja, mostrarTransportista = true, actions,
}: {
  hoja: HojaRutaDia
  mostrarTransportista?: boolean
  actions: ReactNode
}) {
  const info = hoja.hojaRuta
  const [vista, setVista] = useState<Vista>("tabla")
  const filas: FilaParada[] = hoja.paradas.map((p) => ({ ...p, id: p.turnoId }))
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
          Pedidos: <span className="font-medium text-foreground">{hoja.cantidadPedidos}</span>
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
        {hoja.origen && (
          <span className="text-muted-foreground">
            Base: <span className="font-medium text-foreground">{hoja.origen}</span>
          </span>
        )}
        {info?.kmReales != null && (
          <span className="text-muted-foreground">
            Km reales: <span className="font-medium text-foreground">{formatKm(info.kmReales)}</span>
          </span>
        )}
      </div>

      {hoja.advertencia && (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">{hoja.advertencia}</p>
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

      {hoja.paradas.length === 0 ? (
        <p className="py-2 text-sm italic text-muted-foreground">Sin pedidos asignados.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="inline-flex w-fit rounded-lg border border-border p-0.5" role="group" aria-label="Formato de visualización">
            {([["tabla", "Tabla", Table2], ["mapa", "Mapa", MapIcon]] as const).map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => setVista(key)}
                aria-pressed={vista === key}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs transition-colors ${
                  vista === key
                    ? "bg-blue-50 font-medium text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="size-3.5" />{label}
              </button>
            ))}
          </div>

          {vista === "tabla" ? (
            <DataTable
              data={filas}
              columns={COLUMNS}
              emptyText="Sin pedidos asignados."
              pageSizeOptions={[10, 25, 50]}
            />
          ) : hoja.embedUrl ? (
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
                : "Ninguna parada tiene dirección cargada: no hay ruta para mostrar."}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
