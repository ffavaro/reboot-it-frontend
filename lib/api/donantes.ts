import type { Donante, CreateDonantePayload, UpdateDonantePayload } from "@/lib/type/donante"
import { request } from "./client"

export const donantesApi = {
  getAll: () => request<Donante[]>("/donantes"),

  // token: el registro crea el donante con el token del usuario recién creado (todavía sin sesión)
  create: (data: CreateDonantePayload, token?: string) =>
    request<Donante>("/donantes", { method: "POST", body: JSON.stringify(data), token }),

  update: (id: number, data: UpdateDonantePayload) =>
    request<Donante>(`/donantes/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  remove: (id: number) =>
    request<void>(`/donantes/${id}`, { method: "DELETE" }),


  // Genera una contraseña temporal para el usuario del donante (se muestra una sola vez)
  restablecerContrasena: (id: number) =>
    request<{ password: string; email: string | null; avisoEnviado: boolean }>(`/donantes/${id}/restablecer-contrasena`, { method: "POST" }),
}
