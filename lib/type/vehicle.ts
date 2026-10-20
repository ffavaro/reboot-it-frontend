export const TIPOS_COMBUSTIBLE = ["Nafta", "Diésel", "GNC", "Eléctrico", "Híbrido"] as const

export interface TipoVehiculo {
  id: number
  descripcion: string
  pesoMinimo: number | null
  pesoMaximo: number | null
}

export interface Vehiculo {
  id: number
  tipoVehiculoId: number
  patente: string
  marca: string
  modelo: string
  itvVencimiento: string | null
  kilometraje: number | null
  tipoCombustible: string | null
  isActive: boolean
  tipoVehiculo: TipoVehiculo
}

export interface CreateVehiculoPayload {
  tipoVehiculoId: number
  patente: string
  marca: string
  modelo: string
  itvVencimiento: string
  kilometraje: number
  tipoCombustible: string
}

export interface UpdateVehiculoPayload {
  tipoVehiculoId?: number
  patente?: string
  marca?: string
  modelo?: string
  itvVencimiento?: string
  kilometraje?: number
  tipoCombustible?: string
}

export interface CreateTipoVehiculoPayload {
  descripcion: string
  pesoMinimo?: number
  pesoMaximo?: number
}

export interface UpdateTipoVehiculoPayload {
  descripcion?: string
  pesoMinimo?: number
  pesoMaximo?: number
}
