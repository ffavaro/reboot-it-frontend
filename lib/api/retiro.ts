import type { Retiro, CreateRetiroPayload, UpdateRetiroPayload, ReporteRetiro, ReporteRetiroQuery } from "@/lib/type/retiro"
import { request } from "./client"

export const retiroApi = {
  getAll: () => request<Retiro[]>("/retiro"),

  getReporte: (params: ReporteRetiroQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<ReporteRetiro[]>(`/retiro/reporte${qs ? `?${qs}` : ""}`)
  },

  create: (data: CreateRetiroPayload) =>
    request<Retiro>("/retiro", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateRetiroPayload) =>
    request<Retiro>(`/retiro/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/retiro/${id}`, { method: "DELETE" }),
}
