import type { Material, CreateMaterialPayload, UpdateMaterialPayload, ClasificarMaterialPayload, ReporteInventario, ReporteInventarioQuery } from "@/lib/type/material"
import { request } from "./client"

export const materialApi = {
  getAll: () => request<Material[]>("/material"),

  getReporte: (params: ReporteInventarioQuery) => {
    const query = new URLSearchParams()
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== "") query.set(k, String(v))
    })
    const qs = query.toString()
    return request<ReporteInventario[]>(`/material/reporte${qs ? `?${qs}` : ""}`)
  },

  create: (data: CreateMaterialPayload) =>
    request<Material>("/material", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateMaterialPayload) =>
    request<Material>(`/material/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  clasificar: (id: number, data: ClasificarMaterialPayload) =>
    request<Material>(`/material/${id}/clasificar`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/material/${id}`, { method: "DELETE" }),
}
