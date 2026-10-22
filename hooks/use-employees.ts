import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, empleadosApi, rolesApi } from "@/lib/api"
import type { EstadoEmpleados } from "@/lib/api/empleados"
import type { Empleado, Rol, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"

// habilitado=false: no consulta (por ejemplo cuando el rol no tiene esa pantalla)
export function useEmpleadosFull(estado: EstadoEmpleados = "activos", habilitado = true) {
  const { data, isLoading, error, mutate } = useSWR<Empleado[]>(habilitado ? ["/empleados", estado] : null, () => empleadosApi.getAll(estado))
  return { empleados: data ?? [], isLoading, error, mutate }
}

// Empleados para un combo (sin datos personales): lo usa Proceso de destrucción, que no tiene acceso a la pantalla Empleados
export function useEmpleadosCombo(habilitado = true) {
  const { data, isLoading, error } = useSWR<Empleado[]>(habilitado ? "/empleados/combo" : null, () => empleadosApi.getCombo())
  return { empleados: data ?? [], isLoading, error }
}

export function useRoles(habilitado = true) {
  const { data, isLoading } = useSWR<Rol[]>(habilitado ? "/roles" : null, fetcher)
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

export function useReactivarEmpleado() {
  const { trigger, isMutating } = useSWRMutation(
    "/empleados",
    (_key: string, { arg }: { arg: number }) => empleadosApi.reactivar(arg),
  )
  return { reactivarEmpleado: trigger, isLoading: isMutating }
}
