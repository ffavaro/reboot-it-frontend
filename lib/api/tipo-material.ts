import type { TipoMaterial, CreateTipoMaterialPayload, UpdateTipoMaterialPayload } from "@/lib/type/tipo-material"
import { request } from "./client"

export const tipoMaterialApi = {
  getAll: () => request<TipoMaterial[]>("/tipo-material"),

  create: (data: CreateTipoMaterialPayload) =>
    request<TipoMaterial>("/tipo-material", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateTipoMaterialPayload) =>
    request<TipoMaterial>(`/tipo-material/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/tipo-material/${id}`, { method: "DELETE" }),
}