import type { EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload } from "@/lib/type/estado-turno"
import { request } from "./client"

export const estadoTurnoApi = {
  getAll: () => request<EstadoTurno[]>("/estado-turno"),

  create: (data: CreateEstadoTurnoPayload) =>
    request<EstadoTurno>("/estado-turno", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateEstadoTurnoPayload) =>
    request<EstadoTurno>(`/estado-turno/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/estado-turno/${id}`, { method: "DELETE" }),
}