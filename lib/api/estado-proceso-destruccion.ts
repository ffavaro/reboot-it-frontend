import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"
import { request } from "./client"

export interface CreateEstadoProcesoDestruccionPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateEstadoProcesoDestruccionPayload {
  nombre?: string
  descripcion?: string | null
}

export const estadoProcesoDestruccionApi = {
  getAll: () => request<EstadoProcesoDestruccion[]>("/estado-proceso-destruccion"),

  create: (data: CreateEstadoProcesoDestruccionPayload) =>
    request<EstadoProcesoDestruccion>("/estado-proceso-destruccion", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateEstadoProcesoDestruccionPayload) =>
    request<EstadoProcesoDestruccion>(`/estado-proceso-destruccion/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/estado-proceso-destruccion/${id}`, { method: "DELETE" }),
}
