import type { Turno, CreateTurnoPayload, UpdateTurnoPayload, AsignarEmpleadoPayload } from "@/lib/type/turno"
import { request } from "./client"

export const turnoApi = {
  getAll: () => request<Turno[]>("/turno"),

  create: (data: CreateTurnoPayload) =>
    request<Turno>("/turno", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateTurnoPayload) =>
    request<Turno>(`/turno/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  asignar: (id: number, data: AsignarEmpleadoPayload) =>
    request<Turno>(`/turno/${id}/asignar`, { method: "PATCH", body: JSON.stringify(data) }),

  finalizar: (id: number) =>
    request<Turno>(`/turno/${id}/finalizar`, { method: "PATCH" }),

  remove: (id: number) =>
    request<void>(`/turno/${id}`, { method: "DELETE" }),
}