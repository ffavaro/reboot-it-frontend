import type { Empleado } from "./user"
import type { Vehiculo } from "./vehicle"

export interface EmpleadoTransportista {
  id: number
  empleadoId: number
  vehiculoId: number | null
  fechaAsignacion: string | null
  carnetUrl?: string | null
  carnetVencimiento?: string | null
  isActive: boolean
  empleado?: Empleado
  vehiculo?: Vehiculo
}

export interface CreateEmpleadoTransportistaPayload {
  empleadoId: number
  vehiculoId?: number
  fechaAsignacion?: string
  carnetUrl?: string | null
  carnetVencimiento?: string | null
}

export interface UpdateEmpleadoTransportistaPayload {
  empleadoId?: number
  vehiculoId?: number | null
  fechaAsignacion?: string | null
  carnetUrl?: string | null
  carnetVencimiento?: string | null
}

export interface CampoCarnetProps {
  vencimiento: string
  onVencimiento: (valor: string) => void
  errorVencimiento?: string
  fotoActual: string | null
  archivo: File | null
  onArchivo: (archivo: File | null) => void
  errorFoto: string
  onErrorFoto: (error: string) => void
  soloLectura: boolean
}

export const CARNET_TIPOS = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
export const CARNET_MAX_MB = 5
export const CARNET_MAX_BYTES = CARNET_MAX_MB * 1024 * 1024

export type SituacionCarnet = "sin-carnet" | "vencido" | "vigente"