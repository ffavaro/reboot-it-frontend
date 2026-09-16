import type { Donante } from "./donante"
import type { TipoMaterial } from "./tipo-material"
import type { CondicionMaterial } from "./condicion-material"

export interface EstadoDonacion {
  id: number
  descripcion: string
}

export interface DonacionDetalle {
  id: number
  donacionId: number
  tipoMaterialId: number
  condicionMaterialId: number | null
  cantidadEstimada: number | null
  tipoMaterial?: TipoMaterial
  condicionMaterial?: CondicionMaterial
}

export interface Donacion {
  id: number
  donanteId: number
  estadoDonacionId: number | null
  necesitaRetiro: boolean
  direccionRetiro: string | null
  pesoEstimadoKg: number | null
  descripcion: string | null
  isActive: boolean
  donante?: Donante
  estadoDonacion?: EstadoDonacion
  detalles?: DonacionDetalle[]
}

export interface CreateDetallePayload {
  tipoMaterialId: number
  condicionMaterialId: number
  cantidadEstimada?: number
}

export interface CreateDonacionPayload {
  donanteId: number
  fechaHora: string
  estadoDonacionId?: number
  necesitaRetiro?: boolean
  direccionRetiro?: string
  pesoEstimadoKg?: number
  descripcion?: string
  detalles?: CreateDetallePayload[]
}

export interface UpdateDonacionPayload {
  donanteId?: number
  estadoDonacionId?: number | null
  necesitaRetiro?: boolean
  direccionRetiro?: string | null
  pesoEstimadoKg?: number | null
  descripcion?: string | null
  detalles?: CreateDetallePayload[]
}

export interface ReporteDonacionQuery {
  donanteId?: number
  estadoDonacionId?: number
  necesitaRetiro?: boolean
  tieneMateriales?: boolean
  fechaDesde?: string
  fechaHasta?: string
}

export interface ReporteTurno {
  id: number
  fechaHora: string
  estadoTurnoId: number
  estadoTurno?: { id: number; descripcion: string }
  empleadoId: number | null
  empleadoTransportistaId: number | null
}

export interface ReporteRetiro {
  id: number
  fechaInicio: string | null
  fechaRetiro: string | null
  direccion: string | null
  empleadoTransportista?: {
    id: number
    empleado?: { nombre: string; apellido: string }
  }
  vehiculo?: { id: number; patente: string; marca: string; modelo: string }
}

export interface ReporteDonacion extends Donacion {
  createdAt: string
  turno: ReporteTurno | null
  retiro: ReporteRetiro | null
}