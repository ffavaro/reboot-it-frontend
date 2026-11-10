import useSWR from "swr"
import { dashboardApi } from "@/lib/api/dashboard"
import type { FiltroTablero, FiltroUsoVehiculos } from "@/lib/type/dashboard"

export function useResumenCircuito(filtro: FiltroTablero) {
  const { data, isLoading, error } = useSWR(
    ["/dashboard/resumen", filtro.fechaDesde, filtro.fechaHasta, [...filtro.donanteIds].sort().join(",")],
    () => dashboardApi.getSummary(filtro),
    { keepPreviousData: true },
  )
   return { resumen: data, isLoading, error }
}

export function useUsoDeVehiculos(filtro: FiltroUsoVehiculos) {
  const { data, isLoading, error } = useSWR(
    ["/historial-km-vehiculo/reporte/uso", filtro.fechaDesde, filtro.fechaHasta, filtro.limite ?? 0],
    () => dashboardApi.getVehicleUsage(filtro),
  )
  return { uso: data ?? [], isLoading, error }
}
