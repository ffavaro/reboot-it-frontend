import type { Donante } from "./donante"
import type { TipoMaterial } from "./tipo-material"

export interface EstadoDonacion {
  id: number
  descripcion: string
}

export interface DonacionDetalle {
  id: number
  donacionId: number
  tipoMaterialId: number
  descripcion: string | null
  cantidadEstimada: number | null
  observaciones: string | null
  tipoMaterial?: TipoMaterial
}

export interface Donacion {
  id: number
  donanteId: number
  estadoDonacionId: number | null
  necesitaRetiro: boolean
  descripcion: string | null
  isActive: boolean
  donante?: Donante
  estadoDonacion?: EstadoDonacion
  detalles?: DonacionDetalle[]
}

export interface CreateDetallePayload {
  tipoMaterialId: number
  descripcion?: string
  cantidadEstimada?: number
  observaciones?: string
}

export interface CreateDonacionPayload {
  donanteId: number
  fechaHora: string
  estadoDonacionId?: number
  necesitaRetiro?: boolean
  descripcion?: string
  detalles?: CreateDetallePayload[]
}

export interface UpdateDonacionPayload {
  donanteId?: number
  estadoDonacionId?: number | null
  necesitaRetiro?: boolean
  descripcion?: string | null
  detalles?: CreateDetallePayload[]
}