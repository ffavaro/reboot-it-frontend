import type { Material, CreateMaterialPayload, UpdateMaterialPayload, ClasificarMaterialPayload } from "@/lib/type/material"
import { request } from "./client"

export const materialApi = {
  getAll: () => request<Material[]>("/material"),

  create: (data: CreateMaterialPayload) =>
    request<Material>("/material", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateMaterialPayload) =>
    request<Material>(`/material/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  clasificar: (id: number, data: ClasificarMaterialPayload) =>
    request<Material>(`/material/${id}/clasificar`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/material/${id}`, { method: "DELETE" }),
}
