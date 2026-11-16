import type { Rol } from "@/lib/type/user"
import { crudApi } from "./crud"

export interface CreateRolPayload {
  nombre: string
  descripcion?: string
}

export interface UpdateRolPayload {
  nombre?: string
  descripcion?: string
}

export const rolesApi = crudApi<Rol, CreateRolPayload, UpdateRolPayload, string>("/roles")
