import type { Modelo, CreateModeloPayload, UpdateModeloPayload } from "@/lib/type/modelo"
import { request } from "./client"

export const modeloApi = {
  getAll: () => request<Modelo[]>("/modelo"),

  getByMarca: (marcaId: number) => request<Modelo[]>(`/modelo?marcaId=${marcaId}`),

  create: (data: CreateModeloPayload) =>
    request<Modelo>("/modelo", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateModeloPayload) =>
    request<Modelo>(`/modelo/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/modelo/${id}`, { method: "DELETE" }),
}
