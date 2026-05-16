import type { Rack } from "./rack"
import type { MedioAlmacenamiento } from "./medio-almacenamiento"

export interface Pallet {
  id: number
  rackId: number
  mdcId: number | null
  codigo: string | null
  statusKg: number | null
  isActive: boolean
  rack?: Rack
  medioAlmacenamiento?: MedioAlmacenamiento
}

export interface CreatePalletPayload {
  rackId: number
  mdcId?: number
  codigo?: string
  statusKg?: number
}

export interface UpdatePalletPayload {
  rackId?: number
  mdcId?: number | null
  codigo?: string | null
  statusKg?: number | null
}
