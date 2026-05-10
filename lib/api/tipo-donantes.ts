import type { TipoDonante, CreateTipoDonantePayload, UpdateTipoDonantePayload } from "@/lib/type/donante"
import { request } from "./client"

export const tipoDonanteApi = {
  getAll: () => request<TipoDonante[]>("/tipo-donante"),

  create: (data: CreateTipoDonantePayload) =>
    request<TipoDonante>("/tipo-donante", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateTipoDonantePayload) =>
    request<TipoDonante>(`/tipo-donante/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/tipo-donante/${id}`, { method: "DELETE" }),
}
