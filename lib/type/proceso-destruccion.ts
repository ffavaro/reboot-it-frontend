import type { Empleado } from "./user"
import type { MetodoDestruccion } from "./metodo-destruccion"
import type { EstadoProcesoDestruccion } from "./estado-proceso-destruccion"

export interface MedioAlmacenamientoRef {
  id: number
  materialId: number
  tipo?: { nombre: string }
  marca?: { nombre: string }
  modelo?: { nombre: string }
  material?: {
    descripcion: string | null
    tipoMaterial?: { nombre: string }
  }
}

export interface ProcesoDestruccion {
  id: number
  medioAlmacenamientoId: number
  fecha: string | null
  metodoDestruccionId: number | null
  estadoId: number
  empleadoId: number | null
  isActive: boolean
  medioAlmacenamiento?: MedioAlmacenamientoRef
  metodoDestruccion?: MetodoDestruccion
  estado?: EstadoProcesoDestruccion
  empleado?: Empleado
}

export interface CreateProcesoDestruccionPayload {
  medioAlmacenamientoId: number
  fecha?: string
  metodoDestruccionId?: number
  estadoId?: number
  empleadoId?: number
}

export interface UpdateProcesoDestruccionPayload {
  medioAlmacenamientoId?: number
  fecha?: string | null
  metodoDestruccionId?: number | null
  estadoId?: number
  empleadoId?: number | null
}

export interface ReporteProcesoDestruccionQuery {
  estadoId?: number
  metodoDestruccionId?: number
  empleadoId?: number
  fechaDesde?: string
  fechaHasta?: string
}
