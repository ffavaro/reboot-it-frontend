import type { Donante } from "./donante"

export interface Donacion {
  id: number
  donanteId: number
  descripcion: string | null
  estado: string | null
  isActive: boolean
  donante?: Donante
}

export interface CreateDonacionPayload {
  donanteId: number
  descripcion?: string
  estado?: string
}

export interface UpdateDonacionPayload {
  donanteId?: number
  descripcion?: string | null
  estado?: string | null
}