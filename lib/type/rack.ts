export interface Rack {
  id: number
  codigo: string
  ubicacion: string | null
  isActive: boolean
}

export interface CreateRackPayload {
  codigo: string
  ubicacion?: string
}

export interface UpdateRackPayload {
  codigo?: string
  ubicacion?: string | null
}
