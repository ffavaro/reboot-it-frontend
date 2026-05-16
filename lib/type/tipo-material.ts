export interface TipoMaterial {
  id: number
  nombre: string
  descripcion: string | null
  isActive: boolean
}

export interface CreateTipoMaterialPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateTipoMaterialPayload {
  nombre?: string
  descripcion?: string
}