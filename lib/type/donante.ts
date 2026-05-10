export interface TipoDonante {
  id: number
  descripcion: string
}

export interface Donante {
  id: number
  usuarioId?: number | null
  tipoDonanteId: number
  nombre: string
  razonSocial?: string | null
  telefono?: string | null
  direccion?: string | null
  isActive: boolean
  tipoDonante: TipoDonante
}

export interface CreateDonantePayload {
  usuarioId?: number
  tipoDonanteId: number
  nombre: string
  razonSocial?: string
  telefono?: string
  direccion?: string
}

export interface UpdateDonantePayload {
  usuarioId?: number | null
  tipoDonanteId?: number
  nombre?: string
  razonSocial?: string | null
  telefono?: string | null
  direccion?: string | null
}

export interface CreateTipoDonantePayload {
  descripcion: string
}

export interface UpdateTipoDonantePayload {
  descripcion?: string
}
