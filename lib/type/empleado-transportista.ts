import type { Empleado } from "./user"
import type { Vehiculo } from "./vehicle"

export interface EmpleadoTransportista {
  id: number
  empleadoId: number
  vehiculoId: number | null
  fechaAsignacion: string | null
  carnetUrl: string | null
  carnetVencimiento: string | null
  isActive: boolean
  empleado?: Empleado
  vehiculo?: Vehiculo
}

export interface CreateEmpleadoTransportistaPayload {
  empleadoId: number
  vehiculoId?: number
  fechaAsignacion?: string
  carnetUrl: string
  carnetVencimiento: string
}

export interface UpdateEmpleadoTransportistaPayload {
  empleadoId?: number
  vehiculoId?: number | null
  fechaAsignacion?: string | null
  carnetUrl?: string
  carnetVencimiento?: string
}
