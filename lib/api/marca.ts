import type { Marca, CreateMarcaPayload, UpdateMarcaPayload } from "@/lib/type/marca"
import { request } from "./client"

export const marcaApi = {
  getAll: () => request<Marca[]>("/marca"),

  create: (data: CreateMarcaPayload) =>
    request<Marca>("/marca", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateMarcaPayload) =>
    request<Marca>(`/marca/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/marca/${id}`, { method: "DELETE" }),
}
