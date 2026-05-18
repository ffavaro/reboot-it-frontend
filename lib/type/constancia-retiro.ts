import type { Empleado } from "./user"

export interface ConstanciaRetiro {
  id: number
  retiroId: number
  fechaEmision: string | null
  observaciones: string | null
  tecnicoId: number | null
  isActive: boolean
  tecnico?: Empleado
}

export interface CreateConstanciaRetiroPayload {
  retiroId: number
  fechaEmision?: string
  observaciones?: string
  tecnicoId?: number
}

export interface UpdateConstanciaRetiroPayload {
  retiroId?: number
  fechaEmision?: string | null
  observaciones?: string | null
  tecnicoId?: number | null
}
