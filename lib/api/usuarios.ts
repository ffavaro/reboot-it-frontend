import type { Usuario, UpdateUsuarioPayload } from "@/lib/type/user"
import { request } from "./client"

export const usuariosApi = {
  getAll: () =>
    request<Usuario[]>("/usuarios"),

  update: (id: string, data: UpdateUsuarioPayload) =>
    request<Usuario>(`/usuarios/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: string) =>
    request<void>(`/usuarios/${id}`, { method: "DELETE" }),
}
