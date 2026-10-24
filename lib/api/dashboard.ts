import type { DashboardQuery, DashboardResumen } from "@/lib/type/dashboard"
import { request } from "./client"

export const dashboardApi = {
  resumen: ({ fechaDesde, fechaHasta, donanteIds }: DashboardQuery) => {
    const query = new URLSearchParams({ fechaDesde, fechaHasta })
    if (donanteIds && donanteIds.length > 0) query.set("donanteIds", donanteIds.join(","))
    return request<DashboardResumen>(`/dashboard/resumen?${query.toString()}`)
  },
}
