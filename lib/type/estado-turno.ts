export interface EstadoTurno {
  id: number
  descripcion: string
  isActive: boolean
}

export interface CreateEstadoTurnoPayload {
  descripcion: string
}

export interface UpdateEstadoTurnoPayload {
  descripcion?: string
}