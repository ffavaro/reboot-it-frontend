export interface Marca {
  id: number
  nombre: string
  isActive: boolean
}

export interface CreateMarcaPayload {
  nombre: string
}

export interface UpdateMarcaPayload {
  nombre?: string
}
