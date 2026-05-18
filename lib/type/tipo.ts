export interface Tipo {
  id: number
  nombre: string
  isActive: boolean
}

export interface CreateTipoPayload {
  nombre: string
}

export interface UpdateTipoPayload {
  nombre?: string
}
