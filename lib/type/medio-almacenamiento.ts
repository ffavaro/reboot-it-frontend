import type { Tipo } from "./tipo"
import type { Marca } from "./marca"
import type { Modelo } from "./modelo"

export interface MedioAlmacenamiento {
  id: number
  materialId: number
  tipoId: number | null
  marcaId: number | null
  modeloId: number | null
  terminosUso: string | null
  isActive: boolean
  tipo?: Tipo
  marca?: Marca
  modelo?: Modelo
}

export interface CreateMedioAlmacenamientoPayload {
  materialId: number
  tipoId?: number
  marcaId?: number
  modeloId?: number
  terminosUso?: string
}

export interface UpdateMedioAlmacenamientoPayload {
  materialId?: number
  tipoId?: number
  marcaId?: number
  modeloId?: number
  terminosUso?: string
}
