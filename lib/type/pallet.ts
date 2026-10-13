import type { Rack } from "./rack"
import type { Lote } from "./lote"

export interface Pallet {
  id: number
  rackId: number
  loteId: number | null
  codigo: string | null
  peso_kg: number | null
  isActive: boolean
  rack?: Rack
  lote?: Lote
}

export interface CreatePalletPayload {
  rackId: number
  loteId?: number
  codigo?: string
  peso_kg?: number
}

export interface UpdatePalletPayload {
  rackId?: number
  loteId?: number | null
  codigo?: string | null
  peso_kg?: number | null
}
