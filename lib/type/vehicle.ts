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
  isActive: boolean
  tipoVehiculo: TipoVehiculo
}

export interface CreateVehiculoPayload {
  tipoVehiculoId: number
  patente: string
  marca: string
  modelo: string
}

export interface UpdateVehiculoPayload {
  tipoVehiculoId?: number
  patente?: string
  marca?: string
  modelo?: string
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
