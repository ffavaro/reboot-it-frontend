import { getUser } from "@/lib/auth-utils"
import type { Donante } from "@/lib/type/donante"
import type { EmpleadoTransportista } from "@/lib/type/empleado-transportista"
import { dia, hoyIso, isoDe } from "@/lib/utils/fechas"

export function getDonanteActual(donantes: Donante[]) {
  const user = getUser()
  const isDonante = user?.rol?.nombre?.toLowerCase() === "donante"
  const myDonante = isDonante
    ? donantes.find((d) => d.usuarioId === user?.id) ?? null
    : null
  return { user, isDonante, myDonante }
}
export function getTransportistaActual(transportistas: EmpleadoTransportista[]) {
  const user = getUser()
  const isTransportista = user?.rol?.nombre?.toLowerCase() === "transportista"
  const empleadoId = user?.empleadoId
  const myTransportista = isTransportista && empleadoId
    ? transportistas.find((et) => String(et.empleadoId) === String(empleadoId)) ?? null
    : null
  return { user, isTransportista, myTransportista }
}

export const validateEmail =(v: string) => {
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

export function periodoUltimoMes(): Required<Periodo> {
  const desde = new Date()
  const diaDelMes = desde.getDate()
  desde.setDate(1)
  desde.setMonth(desde.getMonth() - 1)
  const ultimoDiaMesAnterior = new Date(desde.getFullYear(), desde.getMonth() + 1, 0).getDate()
  desde.setDate(Math.min(diaDelMes, ultimoDiaMesAnterior))
  return { fechaDesde: isoDe(desde), fechaHasta: hoyIso() }
}

export function describirPeriodo({ fechaDesde, fechaHasta }: Periodo): string {
  if (!fechaDesde && !fechaHasta) return "Período: sin límite de fechas"
  const desde = fechaDesde ? dia(fechaDesde) : "el inicio"
  const hasta = fechaHasta ? dia(fechaHasta) : "hoy"
  return `Período: desde ${desde} hasta ${hasta}`
}

export const periodoInvalido = ({ fechaDesde, fechaHasta }: Periodo) =>
  !!fechaDesde && !!fechaHasta && fechaDesde > fechaHasta

export const KM_TOPE = 9_999_999

const DIGITOS_KM = String(KM_TOPE).length

export const soloDigitosKm = (texto: string) => texto.replace(/\D/g, "").slice(0, DIGITOS_KM)

export const kmLegible = (km: number) => `${Math.round(km).toLocaleString("es-AR")} km`

export function problemaKm(texto: string, minimo: number | null = null): string | null {
  if (texto.trim() === "") return "Ingresá el kilometraje"
  const km = Number(texto)
  if (!Number.isInteger(km) || km < 0) return "El kilometraje debe ser un número entero"
  if (km > KM_TOPE) return `No puede superar los ${kmLegible(KM_TOPE)}`
  if (minimo !== null && km < minimo) return `No puede ser menor al registrado (${kmLegible(minimo)})`
  return null
}

export function textoDeError(error: unknown, alternativo: string): string {
  const mensaje = (error as { message?: unknown } | null)?.message
  if (Array.isArray(mensaje) && mensaje.length) return mensaje.join(". ")
  return typeof mensaje === "string" && mensaje.trim() ? mensaje : alternativo
}

export function sinClave<T extends object>(objeto: T, clave: keyof T): T {
  const copia = { ...objeto }
  delete copia[clave]
  return copia
}

const FORMATO_PATENTE = /^([A-Z]{3} ?\d{3}|[A-Z]{2} ?\d{3} ?[A-Z]{2})$/i

export function problemaPatente(texto: string): string | null {
  const patente = texto.trim()
  if (!patente) return "Ingresá la patente"
  return FORMATO_PATENTE.test(patente) ? null : "Formato inválido (ej. ABC123 o AB123CD)"
}

export const estaVigente = (iso: string) => iso.slice(0, 10) >= hoyIso()

export function pesoLegible(valor: number | string | null | undefined): string {
  if (valor === null || valor === undefined || valor === "") return ""
  const numero = Number(valor)
  return Number.isNaN(numero) ? String(valor) : String(numero)
}
