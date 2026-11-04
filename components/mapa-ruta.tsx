"use client"

import { useEffect, useRef } from "react"
import "leaflet/dist/leaflet.css"
import type { PuntoRecorrido } from "@/lib/type/hoja-ruta"

export interface MapaRutaDatos {
  // Línea del recorrido en formato "encoded polyline" de Google
  polyline: string
  // Coordenada de cada punto del recorrido (origen, paradas y destino), en el mismo orden que `recorrido`
  puntos: { lat: number; lng: number }[]
}

// Decodifica el formato "encoded polyline" que devuelve la Routes API de Google
function decodificarPolyline(codigo: string): [number, number][] {
  const salida: [number, number][] = []
  let i = 0
  let lat = 0
  let lng = 0
  while (i < codigo.length) {
    for (const eje of ["lat", "lng"] as const) {
      let desplazamiento = 0
      let resultado = 0
      let byte: number
      do {
        byte = codigo.charCodeAt(i++) - 63
        resultado |= (byte & 0x1f) << desplazamiento
        desplazamiento += 5
      } while (byte >= 0x20)
      const delta = resultado & 1 ? ~(resultado >> 1) : resultado >> 1
      if (eje === "lat") lat += delta
      else lng += delta
    }
    salida.push([lat / 1e5, lng / 1e5])
  }
  return salida
}

const COLORES = { origen: "#16a34a", parada: "#2563eb", destino: "#dc2626" }

/**
 * Mapa propio de la hoja de ruta (OpenStreetMap + Leaflet): dibuja el recorrido y marca el origen, cada parada
 * numerada y el destino. No depende de ninguna clave del navegador ni del mapa embebido de Google.
 */
export function MapaRuta({ mapa, recorrido }: { mapa: MapaRutaDatos; recorrido: PuntoRecorrido[] }) {
  const contenedor = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let mapaLeaflet: import("leaflet").Map | null = null
    let cancelado = false

    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelado || !contenedor.current) return

      mapaLeaflet = L.map(contenedor.current, { scrollWheelZoom: false })
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(mapaLeaflet)

      const linea = decodificarPolyline(mapa.polyline)
      const trazado = L.polyline(linea, { color: "#2563eb", weight: 5, opacity: 0.75 }).addTo(mapaLeaflet)

      let paradas = 0
      const limites = L.latLngBounds(linea.length ? linea : mapa.puntos.map((p) => [p.lat, p.lng] as [number, number]))
      mapa.puntos.forEach((p, i) => {
        const info = recorrido[i]
        const rol = info?.rol ?? (i === 0 ? "origen" : i === mapa.puntos.length - 1 ? "destino" : "parada")
        if (rol === "parada") paradas += 1
        const texto = rol === "origen" ? "O" : rol === "destino" ? "D" : String(paradas)
        // Origen y destino suelen ser la misma base: se dibujan lado a lado para que no se tapen
        const mismoLugarQueOrigen = rol === "destino" && Math.abs(p.lat - mapa.puntos[0].lat) < 1e-5 && Math.abs(p.lng - mapa.puntos[0].lng) < 1e-5
        const ancla: [number, number] = rol === "origen" ? [30, 14] : mismoLugarQueOrigen ? [-2, 14] : [14, 14]
        const icono = L.divIcon({
          className: "",
          iconSize: [28, 28],
          iconAnchor: ancla,
          html: `<div style="width:28px;height:28px;border-radius:9999px;background:${COLORES[rol]};color:#fff;font:600 13px/28px sans-serif;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)">${texto}</div>`,
        })
        const marcador = L.marker([p.lat, p.lng], { icon: icono }).addTo(mapaLeaflet!)
        if (info) {
          // el contenido se arma con nodos de texto: las direcciones las carga el usuario
          const cuerpo = document.createElement("div")
          const titulo = document.createElement("strong")
          titulo.textContent = info.etiqueta
          cuerpo.appendChild(titulo)
          if (info.donante) {
            cuerpo.appendChild(document.createElement("br"))
            cuerpo.appendChild(document.createTextNode(info.donante))
          }
          cuerpo.appendChild(document.createElement("br"))
          cuerpo.appendChild(document.createTextNode(info.direccion))
          marcador.bindPopup(cuerpo)
        }
        limites.extend([p.lat, p.lng])
      })

      mapaLeaflet.fitBounds(limites.isValid() ? limites : trazado.getBounds(), { padding: [30, 30] })
      // el contenedor puede haber cambiado de tamaño mientras se cargaba
      setTimeout(() => mapaLeaflet?.invalidateSize(), 0)
    })()

    return () => {
      cancelado = true
      mapaLeaflet?.remove()
    }
  }, [mapa, recorrido])

  return (
    <div
      ref={contenedor}
      className="z-0 h-[420px] w-full rounded-md border border-border"
      role="img"
      aria-label="Mapa con el recorrido de la hoja de ruta"
    />
  )
}
