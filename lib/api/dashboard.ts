import type { FiltroTablero, FiltroUsoVehiculos, ResumenCircuito, UsoDeVehiculo } from "../type/dashboard"
import { request } from "./client"

const query = (valores: Record<string, string | number | undefined>) =>
  new URLSearchParams(
    Object.entries(valores)
      .filter(([, v]) => v !== undefined && v !== "")
      .map(([k, v]) => [k, String(v)]),
  ).toString()

export const dashboardApi = {
  getSummary: ({ fechaDesde, fechaHasta, donanteIds }: FiltroTablero) =>
    request<ResumenCircuito>(
      `/dashboard/resumen?${query({ fechaDesde, fechaHasta, donanteIds: donanteIds.length ? donanteIds.join(",") : undefined })}`,
    ),

  getVehicleUsage: (filtro: FiltroUsoVehiculos) =>
    request<UsoDeVehiculo[]>(`/historial-km-vehiculo/reporte/uso?${query({ ...filtro })}`),
}
