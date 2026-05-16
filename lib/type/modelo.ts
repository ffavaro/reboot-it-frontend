import type { Tipo } from "./tipo"
import type { Marca } from "./marca"

export interface Modelo {
  id: number
  nombre: string
  marcaId: number
  tipoId: number
  isActive: boolean
  marca?: Marca
  tipo?: Tipo
}

export interface CreateModeloPayload {
  nombre: string
  marcaId: number
  tipoId: number
}

export interface UpdateModeloPayload {
  nombre?: string
  marcaId?: number
  tipoId?: number
}
