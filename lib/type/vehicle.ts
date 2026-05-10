export interface TipoVehiculo {
  id: number
  descripcion: string
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
}

export interface UpdateTipoVehiculoPayload {
  descripcion?: string
}
