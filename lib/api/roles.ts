import type { Rol } from "@/lib/type/user"
import { request } from "./client"

export interface CreateRolPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateRolPayload {
  nombre?: string
  descripcion?: string
}

export const rolesApi = {
  getAll: () => request<Rol[]>("/roles"),

  create: (data: CreateRolPayload) =>
    request<Rol>("/roles", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: UpdateRolPayload) =>
    request<Rol>(`/roles/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: string) =>
    request<void>(`/roles/${id}`, { method: "DELETE" }),
}
