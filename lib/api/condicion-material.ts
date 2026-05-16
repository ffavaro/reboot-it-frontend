import type { CondicionMaterial, CreateCondicionMaterialPayload, UpdateCondicionMaterialPayload } from "@/lib/type/condicion-material"
import { request } from "./client"

export const condicionMaterialApi = {
  getAll: () => request<CondicionMaterial[]>("/condicion-material"),

  create: (data: CreateCondicionMaterialPayload) =>
    request<CondicionMaterial>("/condicion-material", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateCondicionMaterialPayload) =>
    request<CondicionMaterial>(`/condicion-material/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/condicion-material/${id}`, { method: "DELETE" }),
}
