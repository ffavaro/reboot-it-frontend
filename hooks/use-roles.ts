import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, rolesApi } from "@/lib/api"
import type { Rol } from "@/lib/type/user"
import type { CreateRolPayload, UpdateRolPayload } from "@/lib/api/roles"

export function useRoles() {
  const { data, isLoading, error, mutate } = useSWR<Rol[]>("/roles", fetcher)
  return { roles: data ?? [], isLoading, error, mutate }
}

export function useCreateRol() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/roles",
    (_key: string, { arg }: { arg: CreateRolPayload }) => rolesApi.create(arg),
  )
  return { createRol: trigger, isLoading: isMutating, error }
}

export function useUpdateRol() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/roles",
    (_key: string, { arg }: { arg: { id: string } & UpdateRolPayload }) => {
      const { id, ...payload } = arg
      return rolesApi.update(id, payload)
    },
  )
  return { updateRol: trigger, isLoading: isMutating, error }
}

export function useDeleteRol() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/roles",
    (_key: string, { arg }: { arg: string }) => rolesApi.remove(arg),
  )
  return { deleteRol: trigger, isLoading: isMutating, error }
}