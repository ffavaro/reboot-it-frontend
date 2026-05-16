import type { Clasificacion, CreateClasificacionPayload, UpdateClasificacionPayload } from "@/lib/type/clasificacion"
import { request } from "./client"

export const clasificacionApi = {
  getAll: () => request<Clasificacion[]>("/clasificacion"),

  create: (data: CreateClasificacionPayload) =>
    request<Clasificacion>("/clasificacion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateClasificacionPayload) =>
    request<Clasificacion>(`/clasificacion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/clasificacion/${id}`, { method: "DELETE" }),
}
