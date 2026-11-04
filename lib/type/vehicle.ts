export const COMBUSTIBLES = ["Nafta", "Diésel", "GNC", "Eléctrico", "Híbrido"] as const

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
  kilometraje: number | null
  itvVencimiento: string | null
  tipoCombustible: string | null
  isActive: boolean
  tipoVehiculo: TipoVehiculo
}

export interface CreateVehiculoPayload {
  tipoVehiculoId: number
  patente: string
  marca: string
  modelo: string
  kilometraje: number
  itvVencimiento: string
  tipoCombustible: string
}

export type UpdateVehiculoPayload = Partial<CreateVehiculoPayload>

export interface CreateTipoVehiculoPayload {
  descripcion: string
  pesoMinimo?: number
  pesoMaximo?: number
}

export type UpdateTipoVehiculoPayload = Partial<CreateTipoVehiculoPayload>
