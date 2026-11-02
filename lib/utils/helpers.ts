import { getUser } from "@/lib/auth-utils"
import type { Donante } from "@/lib/type/donante"
import type { Usuario } from "@/lib/type/user"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { dia, hoyIso } from "@/lib/documentos/formato"

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
export function getTransportistaActual(usuarios: Usuario[], transportistas: EmpleadoTransportista[]) {
  const user = getUser()
  const isTransportista = user?.rol?.nombre?.toLowerCase() === "transportista"
  const myUsuario = user ? usuarios.find((u) => String(u.id) === String(user.id)) : null
  const myTransportista = isTransportista && myUsuario?.empleadoId
    ? transportistas.find((et) => String(et.empleadoId) === String(myUsuario.empleadoId)) ?? null
    : null
  return { user, isTransportista, myTransportista }
}

export const formatDate = (iso: string | null) => {
  if (!iso) return null
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
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

export interface Periodo {
  fechaDesde?: string
  fechaHasta?: string
}

function isoLocal(fecha: Date) {
  const dos = (n: number) => String(n).padStart(2, "0")
  return `${fecha.getFullYear()}-${dos(fecha.getMonth() + 1)}-${dos(fecha.getDate())}`
}

export function periodoUltimoMes(): Required<Periodo> {
  const desde = new Date()
  const diaDelMes = desde.getDate()
  desde.setDate(1)
  desde.setMonth(desde.getMonth() - 1)
  const ultimoDiaMesAnterior = new Date(desde.getFullYear(), desde.getMonth() + 1, 0).getDate()
  desde.setDate(Math.min(diaDelMes, ultimoDiaMesAnterior))
  return { fechaDesde: isoLocal(desde), fechaHasta: hoyIso() }
}

export function describirPeriodo({ fechaDesde, fechaHasta }: Periodo): string {
  if (!fechaDesde && !fechaHasta) return "Período: sin límite de fechas"
  const desde = fechaDesde ? dia(fechaDesde) : "el inicio"
  const hasta = fechaHasta ? dia(fechaHasta) : "hoy"
  return `Período: desde ${desde} hasta ${hasta}`
}

export const periodoInvalido = ({ fechaDesde, fechaHasta }: Periodo) =>
  !!fechaDesde && !!fechaHasta && fechaDesde > fechaHasta
