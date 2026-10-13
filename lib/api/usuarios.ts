import type { Usuario, CreateUsuarioPayload, UpdateUsuarioPayload } from "@/lib/type/user"
import { request } from "./client"

export const usuariosApi = {
  getAll: () =>
    request<Usuario[]>("/usuarios"),

  create: (data: CreateUsuarioPayload) =>
    request<Usuario>("/usuarios", { method: "POST", body: JSON.stringify(data) }),

  update: (id: string, data: UpdateUsuarioPayload) =>
    request<Usuario>(`/usuarios/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/usuarios/${id}`, { method: "DELETE" }),
}
