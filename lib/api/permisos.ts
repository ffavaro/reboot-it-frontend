import type { GuardarPermisosPayload, MatrizRol, Permisos } from "@/lib/type/permisos"
import { request } from "./client"

export const permisosApi = {
  mias: () => request<Permisos>("/permisos/mias"),
  matrizDeRol: (rolId: number) => request<MatrizRol>(`/permisos/rol/${rolId}`),
  guardarMatriz: (rolId: number, data: GuardarPermisosPayload) =>
    request<MatrizRol>(`/permisos/rol/${rolId}`, { method: "PUT", body: JSON.stringify(data) }),
}
