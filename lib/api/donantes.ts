import type { Donante, CreateDonantePayload, UpdateDonantePayload } from "@/lib/type/donante"
import { request } from "./client"

export const donantesApi = {
  getAll: () => request<Donante[]>("/donantes"),

  create: (data: CreateDonantePayload) =>
    request<Donante>("/donantes", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateDonantePayload) =>
    request<Donante>(`/donantes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/donantes/${id}`, { method: "DELETE" }),
}
