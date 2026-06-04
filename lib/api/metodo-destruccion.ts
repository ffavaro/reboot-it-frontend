import type { MetodoDestruccion } from "@/lib/type/metodo-destruccion"
import { request } from "./client"

export interface CreateMetodoDestruccionPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateMetodoDestruccionPayload {
  nombre?: string
  descripcion?: string | null
}

export const metodoDestruccionApi = {
  getAll: () => request<MetodoDestruccion[]>("/metodo-destruccion"),

  create: (data: CreateMetodoDestruccionPayload) =>
    request<MetodoDestruccion>("/metodo-destruccion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateMetodoDestruccionPayload) =>
    request<MetodoDestruccion>(`/metodo-destruccion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/metodo-destruccion/${id}`, { method: "DELETE" }),
}
