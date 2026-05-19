import type { Donante } from "./donante"
import type { EstadoTurno } from "./estado-turno"

export interface Turno {
  id: number
  donanteId: number
  estadoTurnoId: number
  fechaHora: string
  descripcion: string | null
  isActive: boolean
  donante?: Donante
  estadoTurno?: EstadoTurno
}

export interface CreateTurnoPayload {
  donanteId: number
  estadoTurnoId: number
  fechaHora: string
  descripcion?: string
}

export interface UpdateTurnoPayload {
  donanteId?: number
  estadoTurnoId?: number
  fechaHora?: string
  descripcion?: string | null
}