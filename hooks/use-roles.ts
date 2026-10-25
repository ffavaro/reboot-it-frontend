import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { rolesApi } from "@/lib/api"
import type { Rol } from "@/lib/type/user"
import type { CreateRolPayload, UpdateRolPayload } from "@/lib/api/roles"

const crud = createCrudHooks<Rol, CreateRolPayload, UpdateRolPayload, string>("/roles", rolesApi)

export function useRoles() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { roles: data, isLoading, error, mutate }
}

export function useCreateRol() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createRol: trigger, isLoading, error }
}

export function useUpdateRol() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateRol: trigger, isLoading, error }
}

export function useDeleteRol() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteRol: trigger, isLoading, error }
}
