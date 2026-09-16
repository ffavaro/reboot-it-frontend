"use client"

import { useState } from "react"
import { MapPin, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTurnos } from "@/hooks/use-turno"
import { useDonaciones } from "@/hooks/use-donacion"
import { useUsuarios } from "@/hooks/use-users"
import { useEmpleadosTransportistas } from "@/hooks/use-empleado-transportista"
import { getUser } from "@/lib/auth-utils"
import { getTransportistaActual } from "@/lib/utils/helpers"
import type { Turno } from "@/lib/type/turno"
import type { Donacion } from "@/lib/type/donacion"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"

// Solo los turnos con el retiro ya confirmado forman parte de la hoja de ruta
const ESTADO_RETIRO_CONFIRMADO = "retiro confirmado"
// Estos roles no tienen vehículo propio: ven las hojas de ruta de todos los transportistas
const ROLES_VEN_TODAS_LAS_HOJAS = ["admin", "administrativo"]

function todayISO(): string {
  const now = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

// Compara solo año/mes/día en hora local, ignorando la hora del turno
function dateOnly(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
}

// Se arma el string a mano (no toLocaleString) porque el ICU del entorno puede no
// tener datos de "es-AR" y cae en el orden mm/dd/yyyy sin avisar
function formatFechaHora(iso: string): string {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// El <input type="date"> nativo muestra la fecha en el formato del navegador/SO
// (a veces mm/dd/yyyy) sin importar el locale que le pasemos, así que el filtro
// usa un input de texto propio, siempre dd/mm/yyyy, en vez de type="date"
function isoAVisual(iso: string): string {
  const [y, m, d] = iso.split("-")
  return `${d}/${m}/${y}`
}

// Va agregando las barras a medida que se escriben los dígitos: 14 -> 14/ -> 14/09 -> 14/09/2026
function enmascararFecha(raw: string): string {
  const digitos = raw.replace(/\D/g, "").slice(0, 8)
  const partes = [digitos.slice(0, 2), digitos.slice(2, 4), digitos.slice(4, 8)].filter(Boolean)
  return partes.join("/")
}

// Valida que sea una fecha real (rechaza 31/02/2026, no solo el formato)
function visualAIso(visual: string): string | null {
  const match = visual.match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  if (!match) return null
  const [, dd, mm, yyyy] = match
  const d = Number(dd), m = Number(mm), y = Number(yyyy)
  const date = new Date(y, m - 1, d)
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null
  return `${yyyy}-${mm}-${dd}`
}

type Parada = {
  turnoId: number
  donante: string
  direccion: string
  hora: string
  estado: string
}

function turnosPreParadas(turnos: Turno[], donaciones: Donacion[]): Parada[] {
  return turnos
    .slice()
    .sort((a, b) => a.fechaHora.localeCompare(b.fechaHora))
    .map((t) => {
      const donacion = t.donacionId ? donaciones.find((d: Donacion) => d.id === t.donacionId) : null
      const direccion = donacion?.direccionRetiro || t.donante?.direccion || ""
      return {
        turnoId: t.id,
        donante: t.donante?.nombre ?? `Donante #${t.donanteId}`,
        direccion,
        hora: formatFechaHora(t.fechaHora),
        estado: t.estadoTurno?.descripcion ?? "",
      }
    })
}

function buildGoogleMapsUrl(direcciones: string[]): string {
  if (!direcciones.length) return ""
  const destino = direcciones[direcciones.length - 1]
  const waypoints = direcciones.slice(0, -1)
  const params = new URLSearchParams({ api: "1", destination: destino, travelmode: "driving" })
  if (waypoints.length) params.set("waypoints", waypoints.join("|"))
  return `https://www.google.com/maps/dir/?${params.toString()}`
}

function buildWhatsAppUrl(paradas: Parada[], mapsUrl: string): string {
  const lineas = [
    "Hoja de ruta - Retiros confirmados",
    "",
    ...paradas.map((p, i) => `${i + 1}. ${p.donante} — ${p.direccion || "Sin dirección cargada"}${p.hora ? ` (${p.hora})` : ""}`),
  ]
  if (mapsUrl) lineas.push("", `Ver ruta en Google Maps: ${mapsUrl}`)
  return `https://wa.me/?text=${encodeURIComponent(lineas.join("\n"))}`
}

function RutaGrupo({ titulo, paradas }: { titulo?: string; paradas: Parada[] }) {
  const direccionesValidas = paradas.filter((p) => p.direccion.trim()).map((p) => p.direccion)
  const mapsUrl = buildGoogleMapsUrl(direccionesValidas)
  const whatsappUrl = buildWhatsAppUrl(paradas, mapsUrl)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {titulo && <p className="text-sm font-semibold text-foreground">{titulo}</p>}
        <span className="text-sm text-muted-foreground">
          {paradas.length} parada{paradas.length !== 1 ? "s" : ""} con retiro confirmado
        </span>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            disabled={!mapsUrl}
            onClick={() => window.open(mapsUrl, "_blank", "noopener,noreferrer")}
          >
            <MapPin className="h-4 w-4" />
            Abrir en Google Maps
          </Button>
          <Button
            disabled={paradas.length === 0}
            onClick={() => window.open(whatsappUrl, "_blank", "noopener,noreferrer")}
          >
            <MessageCircle className="h-4 w-4" />
            Compartir por WhatsApp
          </Button>
        </div>
      </div>

      {paradas.length === 0 ? (
        <p className="text-sm italic text-muted-foreground py-2">
          No hay turnos con retiro confirmado a partir de esa fecha.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs text-muted-foreground uppercase">
              <tr>
                <th className="px-3 py-2 text-left font-medium w-8">#</th>
                <th className="px-3 py-2 text-left font-medium">Donante</th>
                <th className="px-3 py-2 text-left font-medium">Dirección</th>
                <th className="px-3 py-2 text-left font-medium">Fecha y hora del turno</th>
                <th className="px-3 py-2 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paradas.map((p, i) => (
                <tr key={p.turnoId}>
                  <td className="px-3 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-3 py-2 font-medium">{p.donante}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {p.direccion || <span className="italic text-destructive">Sin dirección cargada</span>}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{p.hora}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.estado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function HojaRutaPage() {
  const { turnos } = useTurnos()
  const { donaciones } = useDonaciones()
  const { usuarios } = useUsuarios()
  const { transportistas } = useEmpleadosTransportistas()
  const { myTransportista } = getTransportistaActual(usuarios, transportistas)

  const user = getUser()
  const rolNombre = user?.rol?.nombre?.toLowerCase() ?? ""
  const veTodasLasHojas = ROLES_VEN_TODAS_LAS_HOJAS.includes(rolNombre)

  const hoy = todayISO()
  const [desde, setDesde] = useState(hoy)
  const [desdeTexto, setDesdeTexto] = useState(isoAVisual(hoy))
  // El filtro nunca puede ir a un día anterior a hoy, aunque se manipule el input a mano
  const desdeEfectivo = desde < hoy ? hoy : desde
  const desdeTimestamp = dateOnly(new Date(`${desdeEfectivo}T00:00:00`))

  function handleDesdeTextoChange(raw: string) {
    const enmascarada = enmascararFecha(raw)
    setDesdeTexto(enmascarada)
    if (enmascarada.length < 10) return
    const iso = visualAIso(enmascarada)
    if (!iso) return
    const clamped = iso < hoy ? hoy : iso
    setDesde(clamped)
    if (clamped !== iso) setDesdeTexto(isoAVisual(clamped))
  }

  const turnosConfirmadosDesde = turnos.filter((t: Turno) => {
    if (!t.isActive) return false
    const estado = t.estadoTurno?.descripcion?.toLowerCase() ?? ""
    if (estado !== ESTADO_RETIRO_CONFIRMADO) return false
    return dateOnly(new Date(t.fechaHora)) >= desdeTimestamp
  })

  const dateFilter = (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">Desde</label>
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        value={desdeTexto}
        onChange={(e) => handleDesdeTextoChange(e.target.value)}
        onBlur={() => setDesdeTexto(isoAVisual(desdeEfectivo))}
        maxLength={10}
        className="h-9 w-28 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
    </div>
  )

  if (veTodasLasHojas) {
    const grupos = transportistas
      .filter((et: EmpleadoTransportista) => et.isActive)
      .map((et: EmpleadoTransportista) => ({
        id: et.id,
        nombre: et.empleado ? `${et.empleado.nombre} ${et.empleado.apellido}` : `Transportista #${et.id}`,
        paradas: turnosPreParadas(
          turnosConfirmadosDesde.filter((t: Turno) => t.empleadoTransportistaId === et.id),
          donaciones,
        ),
      }))
      .filter((g) => g.paradas.length > 0)

    return (
      <div className="flex flex-col gap-6 p-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Hoja de Ruta</h1>
          <p className="text-sm text-muted-foreground">
            Hojas de ruta de todos los transportistas con retiros confirmados.
          </p>
        </div>

        {dateFilter}

        {grupos.length === 0 ? (
          <p className="text-sm italic text-muted-foreground py-4">
            No hay turnos con retiro confirmado de ningún transportista a partir de esa fecha.
          </p>
        ) : (
          <div className="flex flex-col gap-6">
            {grupos.map((g) => (
              <div key={g.id} className="rounded-lg border p-4">
                <RutaGrupo titulo={g.nombre} paradas={g.paradas} />
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Hoja de Ruta</h1>
        <p className="text-sm text-muted-foreground">
          Direcciones de las donaciones con retiro confirmado, listas para armar tu recorrido.
        </p>
      </div>

      {!myTransportista ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Todavía no tenés un vehículo asignado. Pedile a un administrador que te asigne uno en "Empleado Transportista".
        </div>
      ) : (
        <>
          {dateFilter}
          <RutaGrupo
            paradas={turnosPreParadas(
              turnosConfirmadosDesde.filter((t: Turno) => t.empleadoTransportistaId === myTransportista.id),
              donaciones,
            )}
          />
        </>
      )}
    </div>
  )
}
