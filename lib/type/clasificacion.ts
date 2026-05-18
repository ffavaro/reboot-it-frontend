import type { Lote } from "./lote"
import type { Empleado } from "./user"

export interface Clasificacion {
  id: number
  loteId: number
  fecha: string | null
  empleadoId: number | null
  isActive: boolean
  lote?: Lote
  empleado?: Empleado
}

export interface CreateClasificacionPayload {
  loteId: number
  fecha?: string
  empleadoId?: number
}

export interface UpdateClasificacionPayload {
  loteId?: number
  fecha?: string | null
  empleadoId?: number | null
}
