import type { Donante } from "./donante"
import type { EstadoTurno } from "./estado-turno"
import type { Empleado } from "./user"
import type { EmpleadoTransportista } from "./empleado-transportista"
import type { TipoMaterial } from "./tipo-material"

export interface TurnoDetalle {
  id: number
  turnoId: number
  donacionDetalleId: number
  tipoMaterialId: number
  descripcion: string | null
  cantidadConfirmada: number | null
  observaciones: string | null
  isActive: boolean
  tipoMaterial?: TipoMaterial
}

export interface Turno {
  id: number
  donanteId: number
  estadoTurnoId: number
  fechaHora: string
  descripcion: string | null
  necesitaRetiro: boolean
  empleadoId: number | null
  empleadoTransportistaId: number | null
  isActive: boolean
  donante?: Donante
  estadoTurno?: EstadoTurno
  empleado?: Empleado | null
  empleadoTransportista?: EmpleadoTransportista | null
  detalles?: TurnoDetalle[]
}

export interface CreateTurnoPayload {
  donanteId: number
  estadoTurnoId: number
  fechaHora: string
  descripcion?: string
  necesitaRetiro?: boolean
}

export interface UpdateTurnoPayload {
  donanteId?: number
  estadoTurnoId?: number
  fechaHora?: string
  descripcion?: string | null
  necesitaRetiro?: boolean
}

export interface AsignarEmpleadoPayload {
  empleadoId?: number
  empleadoTransportistaId?: number
}