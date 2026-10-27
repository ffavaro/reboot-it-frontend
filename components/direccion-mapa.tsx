"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import "leaflet/dist/leaflet.css"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { request } from "@/lib/api/client"

// La dirección tiene que incluir la altura (número de la casa) para poder identificarla
export const tieneAltura = (direccion: string) => /\d/.test(direccion)

interface Sugerencia {
  etiqueta: string
  lat: number
  lng: number
}

interface RespuestaNominatim {
  lat: string
  lon: string
  display_name: string
  address?: Record<string, string>
}

const NOMINATIM = "https://nominatim.openstreetmap.org"
// Córdoba capital, para el mapa mientras todavía no hay una dirección
const CENTRO_INICIAL: [number, number] = [-31.4201, -64.1888]
// Zona por defecto del respaldo: provincia de Córdoba (oeste,norte,este,sur)
const VIEWBOX_CORDOBA = "-65.8,-29.5,-61.8,-35.0"

// "Calle 123, Localidad, Provincia": más corta y legible que el nombre completo que devuelve el servicio
function etiquetaCorta(r: RespuestaNominatim): string {
  const a = r.address
  if (!a) return r.display_name
  const calle = [a.road ?? a.pedestrian ?? a.footway, a.house_number].filter(Boolean).join(" ")
  const localidad = a.suburb ?? a.city_district ?? a.city ?? a.town ?? a.village ?? a.municipality
  const partes = [calle, localidad, a.state].filter(Boolean)
  return partes.length >= 2 ? partes.join(", ") : r.display_name
}

// Google Maps (vía el backend, que guarda la clave) devuelve calle, número, localidad y provincia ya separados
async function buscarGoogle(texto: string, senal: AbortSignal): Promise<Sugerencia[]> {
  const datos = await request<{ etiqueta: string; lat: number; lng: number }[]>(
    `/geo/buscar?q=${encodeURIComponent(texto)}`,
    { signal: senal },
  )
  return datos.map((d) => ({ etiqueta: d.etiqueta, lat: d.lat, lng: d.lng }))
}

// Respaldo si Google no responde (sin clave, sin cuota o sin conexión con el backend)
async function buscarNominatim(texto: string, senal: AbortSignal): Promise<Sugerencia[]> {
  const url = `${NOMINATIM}/search?format=jsonv2&addressdetails=1&limit=5&countrycodes=ar&accept-language=es&viewbox=${VIEWBOX_CORDOBA}&q=${encodeURIComponent(texto)}`
  const res = await fetch(url, { signal: senal })
  if (!res.ok) throw new Error("No se pudo buscar la dirección")
  const datos: RespuestaNominatim[] = await res.json()
  return datos.map((r) => ({ etiqueta: etiquetaCorta(r), lat: Number(r.lat), lng: Number(r.lon) }))
}

async function buscar(texto: string, senal: AbortSignal): Promise<Sugerencia[]> {
  try {
    return await buscarGoogle(texto, senal)
  } catch (e) {
    if (senal.aborted) throw e
    const exacta = await buscarNominatim(texto, senal)
    if (exacta.length > 0) return exacta
    // Con barrio o localidad de más suele no encontrar nada: se reintenta solo con "calle número, Córdoba"
    const calle = texto.split(",")[0].trim()
    return calle && calle !== texto ? buscarNominatim(`${calle}, Córdoba`, senal) : exacta
  }
}

async function direccionDe(lat: number, lng: number): Promise<string | null> {
  try {
    const d = await request<{ etiqueta: string } | null>(`/geo/inversa?lat=${lat}&lng=${lng}`)
    if (d?.etiqueta) return d.etiqueta
  } catch { /* se prueba con el servicio de respaldo */ }
  const res = await fetch(`${NOMINATIM}/reverse?format=jsonv2&addressdetails=1&accept-language=es&lat=${lat}&lon=${lng}`)
  if (!res.ok) return null
  const dato: RespuestaNominatim & { error?: string } = await res.json()
  return dato.error ? null : etiquetaCorta(dato)
}

/**
 * Campo de dirección con mapa (búsqueda con Google Maps centrada en Córdoba, mapa Leaflet): se escribe la dirección y se eligen las
 * coincidencias, o se toca el mapa / se arrastra el pin, para que quede cargada la dirección correcta.
 */
export function DireccionMapa({
  value, onChange, onBlur, maxLength = 100, placeholder = "Calle y número, localidad", id, name, inputClassName, disabled,
}: {
  value: string
  onChange: (valor: string) => void
  onBlur?: () => void
  maxLength?: number
  placeholder?: string
  id?: string
  name?: string
  inputClassName?: string
  disabled?: boolean
}) {
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<import("leaflet").Map | null>(null)
  const pin = useRef<import("leaflet").Marker | null>(null)
  const leaflet = useRef<typeof import("leaflet") | null>(null)
  // true cuando el cambio del texto viene del mapa o de una sugerencia (no hace falta volver a buscarlo)
  const textoElegido = useRef<string | null>(null)
  // el mapa se crea una sola vez: sus eventos deben llamar siempre al onChange más reciente
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [sugerencias, setSugerencias] = useState<Sugerencia[]>([])
  const [buscando, setBuscando] = useState(false)
  const [sinResultados, setSinResultados] = useState(false)
  const [mapaListo, setMapaListo] = useState(false)

  const faltaAltura = value.trim().length >= 3 && !tieneAltura(value)
  const corto = (t: string) => (t.length > maxLength ? t.slice(0, maxLength) : t)

  // Mueve el pin (y lo crea si todavía no existe)
  function ubicar(lat: number, lng: number, zoom = 17) {
    const L = leaflet.current
    const m = mapa.current
    if (!L || !m) return
    if (!pin.current) {
      const icono = L.divIcon({
        className: "",
        iconSize: [26, 26],
        iconAnchor: [13, 13],
        html: '<div style="width:26px;height:26px;border-radius:9999px;background:#dc2626;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.5)"></div>',
      })
      pin.current = L.marker([lat, lng], { draggable: true, icon: icono }).addTo(m)
      pin.current.on("dragend", () => {
        const p = pin.current?.getLatLng()
        if (p) void desdeMapa(p.lat, p.lng)
      })
    } else {
      pin.current.setLatLng([lat, lng])
    }
    m.setView([lat, lng], zoom)
  }

  async function desdeMapa(lat: number, lng: number) {
    ubicar(lat, lng, mapa.current?.getZoom() ?? 17)
    try {
      const dir = await direccionDe(lat, lng)
      if (dir) {
        const nueva = corto(dir)
        textoElegido.current = nueva
        onChangeRef.current(nueva)
      }
    } catch { /* sin conexión: queda el texto escrito */ }
  }

  // El mapa se crea una sola vez
  useEffect(() => {
    let cancelado = false
    ;(async () => {
      const L = (await import("leaflet")).default
      if (cancelado || !contenedor.current) return
      leaflet.current = L
      const m = L.map(contenedor.current, { scrollWheelZoom: false }).setView(CENTRO_INICIAL, 11)
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(m)
      m.on("click", (e) => { if (!disabled) void desdeMapa(e.latlng.lat, e.latlng.lng) })
      mapa.current = m
      setMapaListo(true)
      setTimeout(() => m.invalidateSize(), 0)
    })()
    return () => {
      cancelado = true
      mapa.current?.remove()
      mapa.current = null
      pin.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Al escribir, se buscan coincidencias (con una pausa, para no consultar en cada tecla)
  useEffect(() => {
    if (!mapaListo) return
    const texto = value.trim()
    if (textoElegido.current === value) { textoElegido.current = null; setSugerencias([]); return }
    if (texto.length < 5) { setSugerencias([]); setSinResultados(false); return }
    const control = new AbortController()
    const espera = setTimeout(async () => {
      setBuscando(true)
      try {
        const encontradas = await buscar(texto, control.signal)
        setSugerencias(encontradas)
        setSinResultados(encontradas.length === 0)
        if (encontradas[0]) ubicar(encontradas[0].lat, encontradas[0].lng, 16)
      } catch { /* cancelada o sin conexión */ }
      finally { setBuscando(false) }
    }, 700)
    return () => { clearTimeout(espera); control.abort() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, mapaListo])

  function elegir(s: Sugerencia) {
    const nueva = corto(s.etiqueta)
    textoElegido.current = nueva
    onChange(nueva)
    setSugerencias([])
    setSinResultados(false)
    ubicar(s.lat, s.lng)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          id={id}
          name={name}
          value={value}
          disabled={disabled}
          maxLength={maxLength}
          placeholder={placeholder}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={inputClassName}
        />
        {sugerencias.length > 0 && (
          <ul className="absolute left-0 right-0 top-full z-[1000] mt-1 max-h-56 overflow-y-auto rounded-md border border-border bg-popover text-sm shadow-md" role="listbox">
            {sugerencias.map((s) => (
              <li key={`${s.lat},${s.lng},${s.etiqueta}`} role="option" aria-selected={false}>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => elegir(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-muted"
                >
                  <MapPin className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span>{s.etiqueta}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className={cn("text-xs", sinResultados || faltaAltura ? "text-amber-600" : "text-muted-foreground")}>
        {faltaAltura
          ? "Agregá la altura (número de la casa) para poder identificar el domicilio. Ej: Av. Corrientes 1234"
          : buscando
          ? "Buscando en el mapa…"
          : sinResultados
          ? "No encontramos esa dirección: probá con calle, número y localidad, o tocá el lugar en el mapa."
          : "Escribí la dirección y elegila de la lista, o tocá el mapa / arrastrá el pin para ubicarla."}
      </p>
      <div
        ref={contenedor}
        className="z-0 h-56 w-full rounded-md border border-border"
        role="img"
        aria-label="Mapa para ubicar la dirección"
      />
    </div>
  )
}
