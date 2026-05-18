import type { Lote, CreateLotePayload, UpdateLotePayload } from "@/lib/type/lote"
import { request } from "./client"

export const loteApi = {
  getAll: () => request<Lote[]>("/lote"),

  create: (data: CreateLotePayload) =>
    request<Lote>("/lote", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateLotePayload) =>
    request<Lote>(`/lote/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/lote/${id}`, { method: "DELETE" }),
}
