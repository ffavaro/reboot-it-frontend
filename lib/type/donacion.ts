import type { Donante } from "./donante"

export interface Donacion {
  id: number
  donanteId: number
  descripcion: string | null
  estado_donacion_id: string | null
  isActive: boolean
  donante?: Donante
  detalles?: DetalleDonacion[]
}

export interface DetalleDonacion {  
  id: number
  donacionId: number
  tipoMaterialId: number
  descripcion: string | null
  cantidad_estimada: number
  observaciones: string | null
}

export interface CreateDonacionPayload {
  donanteId: number
  fechaHora: string
  descripcion?: string
  estado?: string
}

export interface UpdateDonacionPayload {
  donanteId?: number
  descripcion?: string | null
  estado?: string | null
}