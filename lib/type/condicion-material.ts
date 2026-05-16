export interface CondicionMaterial {
  id: number
  condicion: string
  descripcion: string | null
  isActive: boolean
}

export interface CreateCondicionMaterialPayload {
  condicion: string
  descripcion?: string
}

export interface UpdateCondicionMaterialPayload {
  condicion?: string
  descripcion?: string
}
