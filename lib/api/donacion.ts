import type { Donacion, CreateDonacionPayload, UpdateDonacionPayload, ReporteDonacion, ReporteDonacionQuery } from "@/lib/type/donacion"
import { request } from "./client"

export const donacionApi = {
  getAll: () => request<Donacion[]>("/donacion"),

  getReporte: (params: ReporteDonacionQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<ReporteDonacion[]>(`/donacion/reporte${qs ? `?${qs}` : ""}`)
  },

  create: (data: CreateDonacionPayload) =>
    request<Donacion>("/donacion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateDonacionPayload) =>
    request<Donacion>(`/donacion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/donacion/${id}`, { method: "DELETE" }),
}