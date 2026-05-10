import type { Rol } from "@/lib/type/user"
import { request } from "./client"

export const rolesApi = {
  getAll: () => request<Rol[]>("/roles"),
}
