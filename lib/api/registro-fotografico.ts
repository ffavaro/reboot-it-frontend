import type {
  RegistroFotografico,
  CreateRegistroFotograficoPayload,
  UpdateRegistroFotograficoPayload,
} from "@/lib/type/registro-fotografico"
import { request } from "./client"

export const registroFotograficoApi = {
  getAll: () => request<RegistroFotografico[]>("/registro-fotografico"),

  getByTurno: (turnoId: number) =>
    request<RegistroFotografico[]>(`/registro-fotografico/by-turno/${turnoId}`),

  create: (data: CreateRegistroFotograficoPayload) =>
    request<RegistroFotografico>("/registro-fotografico", { method: "POST", body: JSON.stringify(data) }),

  update: (id: number, data: UpdateRegistroFotograficoPayload) =>
    request<RegistroFotografico>(`/registro-fotografico/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/registro-fotografico/${id}`, { method: "DELETE" }),
}
