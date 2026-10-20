export interface Empleado {
  id: number
  usuarioId?: number | null
  rolId: number
  nombre: string
  apellido: string
  cuitDni?: string | null
  fechaAlta?: string | null
  direccion?: string | null
  telefono?: string | null
  cargo?: string | null
  isActive: boolean
  rol: Rol
}

export interface CreateEmpleadoPayload {
  rolId: number
  nombre: string
  apellido: string
  cuitDni: string
  fechaAlta: string
  direccion: string
  telefono: string
  cargo?: string
  // El alta crea también el usuario del empleado con este email y contraseña
  email: string
  password: string
}

export interface UpdateEmpleadoPayload {
  rolId?: number
  nombre?: string
  apellido?: string
  cuitDni?: string
  fechaAlta?: string
  direccion?: string
  telefono?: string | null
  cargo?: string | null
}

export interface Usuario  {
  id: string
  nombre: string
  apellido?: string | null
  cuitDni?: string | null
  email: string
  rol: Rol
  empleadoId?: string | null
  empleado?: Empleado | null
}

export interface CreateUsuarioPayload {
  nombre: string
  apellido?: string
  cuitDni?: string
  email: string
  rolId: number
  password?: string
  empleadoId?: number | null
}

export interface UpdateUsuarioPayload {
  nombre?: string
  apellido?: string
  cuitDni?: string
  rolId?: number
  empleadoId?: number | null
}

export interface Rol {
    id: string,
    nombre: string,
    descripcion: string,
    isActive: boolean,
    createdAt: Date,
    updatedAt: Date

}