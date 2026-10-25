import { getUser } from "@/lib/auth-utils"
import type { Donante } from "@/lib/type/donante"
import type { Usuario } from "@/lib/type/user"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"

export function getDonanteActual(donantes: Donante[]) {
  const user = getUser()
  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d) => d.usuarioId === user?.id) ?? null
    : null
  return { user, isDonante, myDonante }
}

// El vínculo usuario↔empleado se guarda en usuario.empleadoId (no al revés en
// empleado.usuarioId, que ningún formulario completa), así que hay que pasar
// por el usuario logueado para encontrar su ficha de Empleado Transportista.
// Ficha de transportista del usuario logueado. El empleado sale del token; el backend ya entrega a un transportista
// solo su propia ficha, así que no hace falta consultar la lista de usuarios (que no puede ver).
export function getTransportistaActual(transportistas: EmpleadoTransportista[]) {
  const user = getUser()
  const isTransportista = user?.rol?.nombre?.toLowerCase() === "transportista"
  const porEmpleado = user?.empleadoId != null
    ? transportistas.find((et) => String(et.empleadoId) === String(user.empleadoId))
    : undefined
  const myTransportista = isTransportista ? porEmpleado ?? (transportistas.length === 1 ? transportistas[0] : null) : null
  return { user, isTransportista, myTransportista }
}

// Las fechas "solo día" (yyyy-MM-dd) se formatean cortando el string: new Date("2026-10-20") es UTC y mostraría el día anterior
export const formatDate = (iso: string | null) => {
  if (!iso) return null
  const dia = /^(\d{4})-(\d{2})-(\d{2})(?:T00:00:00(?:\.0+)?Z?)?$/.exec(iso)
  if (dia) return `${dia[3]}/${dia[2]}/${dia[1]}`
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// Fecha de "hoy" en dd/mm/aaaa, para el encabezado de los reportes imprimibles
export const formatFechaHoy = () =>
  new Date().toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

// Hora HH:mm a partir de un datetime ISO, con padding manual (sin Intl/toLocaleTimeString)
// para no depender de los datos ICU de es-AR del entorno
export const formatHora = (iso: string): string => {
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export const formatDateTime = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

export const validateEmail = (v: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export const validateCuitDni = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length === 8 || digits.length === 11;
}
// ── Fechas "solo día" (yyyy-MM-dd) ───────────────────────────────────────────
// new Date("2026-05-20") se interpreta como UTC y en Argentina muestra el día anterior,
// por eso las columnas de tipo DATE se formatean cortando el string.
export const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

// Período por defecto de los reportes: desde un mes antes de hoy hasta hoy (yyyy-MM-dd)
export const periodoPorDefecto = () => {
  const hasta = new Date()
  const desde = new Date(hasta)
  desde.setDate(1)
  desde.setMonth(desde.getMonth() - 1)
  // si el mes anterior es más corto (por ejemplo, 31/03 -> 28/02) se usa su último día
  const ultimoDia = new Date(desde.getFullYear(), desde.getMonth() + 1, 0).getDate()
  desde.setDate(Math.min(hasta.getDate(), ultimoDia))
  const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  return { fechaDesde: iso(desde), fechaHasta: iso(hasta) }
}

export const formatFechaISO = (iso: string | null | undefined) => {
  if (!iso) return null
  return iso.slice(0, 10).split("-").reverse().join("/")
}

// Una fecha de vencimiento está vigente hasta el final de ese mismo día
export const isVigente = (iso: string | null | undefined) => !!iso && iso.slice(0, 10) >= todayISO()

// El backend devuelve los DECIMAL como string ("100.00"): se muestra sin ceros sobrantes ("100", "12.5")
export const formatPeso = (v: number | string | null | undefined) => {
  if (v === null || v === undefined || v === "") return ""
  const n = Number(v)
  return Number.isNaN(n) ? String(v) : String(n)
}

// Los errores del backend traen `message` como string (conflictos) o como lista (validaciones del DTO)
export const getErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { message?: string | string[] } | null)?.message
  if (Array.isArray(message)) return message[0] ?? fallback
  return message || fallback
}

export const formatKm = (km: number) => `${km.toLocaleString("es-AR", { maximumFractionDigits: 1 })} km`
