export interface Empleado {
  id: number
  usuarioId?: number | null
  rolId: number
  nombre: string
  apellido: string
  telefono?: string | null
  cargo?: string | null
  isActive: boolean
  rol: Rol
}

export interface CreateEmpleadoPayload {
  rolId: number
  nombre: string
  apellido: string
  telefono?: string
  cargo?: string
}

export interface UpdateEmpleadoPayload {
  rolId?: number
  nombre?: string
  apellido?: string
  telefono?: string | null
  cargo?: string | null
}

export interface Usuario  {
  id: string
  nombre: string
  email: string
  rol: Rol
  empleadoId?: string | null
  empleado?: Empleado | null
}

export interface UpdateUsuarioPayload  {
  rol?: Rol
  empleadoId?: string | null
}

export interface Rol {
    id: string,
    nombre: string,
    descripcion: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date

}