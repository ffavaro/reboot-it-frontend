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

export interface ClasificarMaterialPayload {
  condicionMaterialId: number
  requiereDestruccion?: boolean
  tipoId?: number
  marcaId?: number
  modeloId?: number
  descripcion?: string
}

export interface ReporteInventarioQuery {
  tipoMaterialId?: number
  condicionMaterialId?: number
  loteId?: number
  tieneDestruccion?: boolean
  fechaDesde?: string
  fechaHasta?: string
}

export interface ReporteInventario extends Material {
  createdAt: string
  medioAlmacenamiento?: {
    id: number
    tipoId: number | null
    marcaId: number | null
    modeloId: number | null
    procesoDestruccion?: {
      id: number
      fecha: string | null
      estadoId: number
      estado?: { id: number; nombre: string; descripcion: string | null }
      metodoDestruccionId: number | null
      metodoDestruccion?: { id: number; nombre: string }
    } | null
  } | null
}
