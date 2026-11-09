import { request } from "./client"
import type { MatrizRol, PermisoAGuardar, PermisosPorClave } from "@/lib/type/permisos"

export const permisosApi = {
  mios: () => request<PermisosPorClave>("/permisos/mias"),

  matrizDeRol: (rolId: number) => request<MatrizRol>(`/permisos/rol/${rolId}`),

  guardarMatriz: (rolId: number, permisos: PermisoAGuardar[]) =>
    request<MatrizRol>(`/permisos/rol/${rolId}`, { method: "PUT", body: JSON.stringify({ permisos }) }),
}
