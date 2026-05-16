import type { Empleado } from "./user"

export interface MedioAlmacenamientoRef {
  id: number
  materialId: number
  tipo?: { nombre: string }
  marca?: { nombre: string }
  modelo?: { nombre: string }
}

export interface ProcesoDestruccion {
  id: number
  medioAlmacenamientoId: number
  fecha: string | null
  metodo: string | null
  empleadoId: number | null
  isActive: boolean
  medioAlmacenamiento?: MedioAlmacenamientoRef
  empleado?: Empleado
}

export interface CreateProcesoDestruccionPayload {
  medioAlmacenamientoId: number
  fecha?: string
  metodo?: string
  empleadoId?: number
}

export interface UpdateProcesoDestruccionPayload {
  medioAlmacenamientoId?: number
  fecha?: string | null
  metodo?: string | null
  empleadoId?: number | null
}
