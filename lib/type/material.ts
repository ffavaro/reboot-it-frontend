import type { Lote } from "./lote"
import type { TipoMaterial } from "./tipo-material"
import type { CondicionMaterial } from "./condicion-material"

export interface Material {
  id: number
  loteId: number
  tipoMaterialId: number
  condicionMaterialId: number
  descripcion: string | null
  isActive: boolean
  lote?: Lote
  tipoMaterial?: TipoMaterial
  condicionMaterial?: CondicionMaterial
}

export interface CreateMaterialPayload {
  loteId: number
  tipoMaterialId: number
  condicionMaterialId: number
  descripcion?: string
}

export interface UpdateMaterialPayload {
  loteId?: number
  tipoMaterialId?: number
  condicionMaterialId?: number
  descripcion?: string | null
}
