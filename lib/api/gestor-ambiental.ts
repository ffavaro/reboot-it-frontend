import type { GestorAmbiental, CreateGestorAmbientalPayload, UpdateGestorAmbientalPayload } from "@/lib/type/gestor-ambiental"
import { request } from "./client"

export const gestorAmbientalApi = {
  getAll: () => request<GestorAmbiental[]>("/gestor-ambiental"),

  create: (data: CreateGestorAmbientalPayload) =>
    request<GestorAmbiental>("/gestor-ambiental", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateGestorAmbientalPayload) =>
    request<GestorAmbiental>(`/gestor-ambiental/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/gestor-ambiental/${id}`, { method: "DELETE" }),
}
