import type { Turno, CreateTurnoPayload, UpdateTurnoPayload } from "@/lib/type/turno"
import { request } from "./client"

export const turnoApi = {
  getAll: () => request<Turno[]>("/turno"),

  create: (data: CreateTurnoPayload) =>
    request<Turno>("/turno", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateTurnoPayload) =>
    request<Turno>(`/turno/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/turno/${id}`, { method: "DELETE" }),
}