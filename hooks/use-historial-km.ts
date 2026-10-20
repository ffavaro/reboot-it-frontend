import useSWR from "swr"
import { fetcher, buildQuery } from "@/lib/api"
import type { HistorialKmVehiculo, HistorialKmQuery, UsoVehiculo } from "@/lib/type/historial-km"

export function useHistorialKmVehiculo(vehiculoId: number | null, query: HistorialKmQuery = {}) {
  const key = vehiculoId ? `/historial-km-vehiculo/vehiculo/${vehiculoId}${buildQuery({ ...query })}` : null
  const { data, isLoading, error, mutate } = useSWR<HistorialKmVehiculo[]>(key, fetcher)
  return { historial: data ?? [], isLoading, error, mutate }
}

export function useUsoVehiculos(query: HistorialKmQuery & { limit?: number }) {
  const key = `/historial-km-vehiculo/reporte/uso${buildQuery({ ...query })}`
  const { data, isLoading, error, mutate } = useSWR<UsoVehiculo[]>(key, fetcher)
  return { uso: data ?? [], isLoading, error, mutate }
}
