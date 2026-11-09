import { dia, hora } from "@/lib/utils/fechas"
import { kilometros } from "@/lib/utils/formato"
import type { HojaRutaDia } from "@/lib/type/hoja-ruta"

export const ESTILO_SELECT =
  "h-8 rounded-lg border border-border bg-background px-2 text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"

export function nombreTransportista(h: HojaRutaDia): string {
  return h.transportista
    ? `${h.transportista.nombre} ${h.transportista.apellido}`
    : `Transportista #${h.empleadoTransportistaId}`
}

export function formatDuracion(minutos: number): string {
  const horas = Math.floor(minutos / 60)
  const resto = Math.round(minutos % 60)
  if (horas === 0) return `${resto} min`
  return resto === 0 ? `${horas} h` : `${horas} h ${resto} min`
}

export function urlWhatsApp(h: HojaRutaDia): string {
  const lineas = [
    `*Hoja de ruta* - ${dia(h.fecha)}`,
    `Transportista: ${nombreTransportista(h)}`,
    h.vehiculo ? `Vehículo: ${h.vehiculo.patente} (${h.vehiculo.marca} ${h.vehiculo.modelo})` : "Vehículo: sin asignar",
    `Estado: ${h.estado}`,
    ...(h.kmEstimados !== null ? [`Km estimados: ${kilometros(h.kmEstimados)}`] : []),
    "",
    `Paradas (${h.paradas.length}):`,
    ...h.paradas.map(
      (p) =>
        `${p.orden}. ${p.donante} - ${p.direccion || "Sin dirección cargada"} (${hora(p.fechaHora)} hs)${p.retirado ? " ✔ retirado" : ""}`,
    ),
  ]
  if (h.mapsUrl) lineas.push("", `Ver ruta en Google Maps: ${h.mapsUrl}`)
  return `https://wa.me/?text=${encodeURIComponent(lineas.join("\n"))}`
}

export function abrirEnPestana(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}
