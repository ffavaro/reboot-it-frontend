import type { EmpleadoTransportista } from "./empleado-transportista"
import type { Vehiculo } from "./vehicle"

export interface Retiro {
  id: number
  donacionId: number
  empleadoTransportistaId: number
  vehiculoId: number | null
  fechaInicio: string | null
  fechaRetiro: string | null
  direccion: string | null
  isActive: boolean
  empleadoTransportista?: EmpleadoTransportista
  vehiculo?: Vehiculo
}

export interface CreateRetiroPayload {
  donacionId: number
  empleadoTransportistaId: number
  vehiculoId?: number
  fechaInicio?: string
  direccion?: string
}

export interface UpdateRetiroPayload {
  donacionId?: number
  empleadoTransportistaId?: number
  vehiculoId?: number | null
  fechaInicio?: string | null
  fechaRetiro?: string | null
  direccion?: string | null
}

export interface ReporteRetiroQuery {
  donanteId?: number
  empleadoTransportistaId?: number
  estadoDonacionId?: number
  fechaDesde?: string
  fechaHasta?: string
}

export interface ReporteRetiro extends Retiro {
  donacion?: {
    id: number
    donanteId: number
    estadoDonacionId: number | null
    necesitaRetiro: boolean
    descripcion: string | null
    donante?: { id: number; nombre: string; razonSocial: string | null; direccion: string | null }
    estadoDonacion?: { id: number; descripcion: string }
  } | null
}
