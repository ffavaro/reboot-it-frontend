import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, empleadosApi, rolesApi } from "@/lib/api"
import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import type { EstadoEmpleados } from "@/lib/api/empleados"
import type { Empleado, Rol, CreateEmpleadoPayload, UpdateEmpleadoPayload } from "@/lib/type/user"

const crud = createCrudHooks<Empleado, CreateEmpleadoPayload, UpdateEmpleadoPayload>("/empleados", empleadosApi)

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
  const { trigger, isLoading, error } = crud.useCreate()
  return { createEmpleado: trigger, isLoading, error }
}

export function useUpdateEmpleado() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateEmpleado: trigger, isLoading, error }
}

export function useDeleteEmpleado() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteEmpleado: trigger, isLoading, error }
}

export function useReactivarEmpleado() {
  const { trigger, isMutating } = useSWRMutation(
    "/empleados",
    (_key: string, { arg }: { arg: number }) => empleadosApi.reactivar(arg),
  )
  return { reactivarEmpleado: trigger, isLoading: isMutating }
}
