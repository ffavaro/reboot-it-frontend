import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, empleadosApi, rolesApi } from "@/lib/api"
import type { Empleado, Rol, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"

export function useEmpleadosFull() {
  const { data, isLoading, error, mutate } = useSWR<Empleado[]>("/empleados", fetcher)
  return { empleados: data ?? [], isLoading, error, mutate }
}

export function useRoles() {
  const { data, isLoading } = useSWR<Rol[]>("/roles", fetcher)
  return { roles: data ?? [], isLoading }
}

export function useCreateEmpleado() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/empleados",
    (_key: string, { arg }: { arg: CreateEmpleadoPayload }) => empleadosApi.create(arg),
  )
  return { createEmpleado: trigger, isLoading: isMutating, error }
}

export function useUpdateEmpleado() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/empleados",
    (_key: string, { arg }: { arg: { id: number } & UpdateEmpleadoPayload }) => {
      const { id, ...payload } = arg
      return empleadosApi.update(id, payload)
    },
  )
  return { updateEmpleado: trigger, isLoading: isMutating, error }
}

export function useDeleteEmpleado() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/empleados",
    (_key: string, { arg }: { arg: number }) => empleadosApi.remove(arg),
  )
  return { deleteEmpleado: trigger, isLoading: isMutating, error }
}
