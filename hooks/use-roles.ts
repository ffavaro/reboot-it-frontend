import { rolesApi } from "@/lib/api"
import { crearHooksRecurso } from "./use-recurso"
import type { Rol } from "@/lib/type/user"
import type { CreateRolPayload, UpdateRolPayload } from "@/lib/api/roles"

const h = crearHooksRecurso<Rol, CreateRolPayload, UpdateRolPayload, string>("/roles", rolesApi)

export function useRoles() { const { data, ...r } = h.useLista(); return { roles: data, ...r } }
export function useCreateRol() { const { trigger, ...r } = h.useCrear(); return { createRol: trigger, ...r } }
export function useUpdateRol() { const { trigger, ...r } = h.useActualizar(); return { updateRol: trigger, ...r } }
export function useDeleteRol() { const { trigger, ...r } = h.useEliminar(); return { deleteRol: trigger, ...r } }
