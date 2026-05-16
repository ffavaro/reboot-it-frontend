import type { Tipo, CreateTipoPayload, UpdateTipoPayload } from "@/lib/type/tipo"
import { request } from "./client"

export const tipoApi = {
  getAll: () => request<Tipo[]>("/tipo"),

  create: (data: CreateTipoPayload) =>
    request<Tipo>("/tipo", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateTipoPayload) =>
    request<Tipo>(`/tipo/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/tipo/${id}`, { method: "DELETE" }),
}
