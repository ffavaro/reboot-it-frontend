import type { Vehiculo } from "./vehicle"

export interface HistorialKmVehiculo {
  id: number
  vehiculoId: number
  kmInicial: number
  // null mientras el recorrido sigue en curso
  kmFinal: number | null
  createdAt: string
  vehiculo?: Vehiculo
}

export interface HistorialKmQuery {
  fechaDesde?: string
  fechaHasta?: string
}

// Vehículos más utilizados: km totales de los recorridos finalizados del período
export interface UsoVehiculo {
  id: number
  patente: string
  marca: string
  modelo: string
  kmTotales: number
  cantidadRecorridos: number
}
