import type { Retiro, CreateRetiroPayload, UpdateRetiroPayload, ReporteRetiro, ReporteRetiroQuery } from "@/lib/type/retiro"
import { request } from "./client"
import { crudApi } from "./crud"

export const retiroApi = {
  ...crudApi<Retiro, CreateRetiroPayload, UpdateRetiroPayload>("/retiro"),

  getReporte: (params: ReporteRetiroQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<ReporteRetiro[]>(`/retiro/reporte${qs ? `?${qs}` : ""}`)
  },
}
