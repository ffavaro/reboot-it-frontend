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

// Datos para crear, junto con el donante, el usuario con el que inicia sesión (rol Donante)
export interface UsuarioDonantePayload {
  email: string
  password: string
  cuitDni: string
}

export interface CreateDonantePayload {
  usuarioId?: number
  usuario?: UsuarioDonantePayload
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
