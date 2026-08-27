import type { Donacion } from "./donacion"

export interface Lote {
  id: number
  donacionId: number
  pesoBrutoKg: number | null
  observaciones: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  donacion?: Donacion
}

export interface CreateLotePayload {
  donacionId: number
  pesoBrutoKg?: number
  observaciones?: string
}

export interface UpdateLotePayload {
  donacionId?: number
  pesoBrutoKg?: number | null
  observaciones?: string | null
}
