import type { HistorialKmVehiculo, HistorialKmQuery, UsoVehiculo } from "@/lib/type/historial-km"
import { request } from "./client"

// Arma "?a=1&b=2" ignorando los valores vacíos
export function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const qs = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") qs.set(k, String(v))
  })
  const s = qs.toString()
  return s ? `?${s}` : ""
}

export const historialKmApi = {
  getByVehiculo: (vehiculoId: number, query: HistorialKmQuery = {}) =>
    request<HistorialKmVehiculo[]>(`/historial-km-vehiculo/vehiculo/${vehiculoId}${buildQuery({ ...query })}`),

  getUsoVehiculos: (query: HistorialKmQuery & { limit?: number } = {}) =>
    request<UsoVehiculo[]>(`/historial-km-vehiculo/reporte/uso${buildQuery({ ...query })}`),
}
