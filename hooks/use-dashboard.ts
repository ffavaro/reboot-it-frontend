import useSWR from "swr"
import { dashboardApi } from "@/lib/api/dashboard"
import type { DashboardQuery, DashboardResumen } from "@/lib/type/dashboard"

export function useDashboardResumen(params: DashboardQuery) {
  const { data, isLoading, error } = useSWR<DashboardResumen>(
    ["/dashboard/resumen", params.fechaDesde, params.fechaHasta, (params.donanteIds ?? []).join(",")],
    () => dashboardApi.resumen(params),
    { keepPreviousData: true },
  )
  return { resumen: data, isLoading, error }
}
