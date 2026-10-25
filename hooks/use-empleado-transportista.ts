import { createCrudHooks } from "@/lib/hooks/create-crud-hooks"
import { empleadoTransportistaApi } from "@/lib/api"
import type { EmpleadoTransportista, CreateEmpleadoTransportistaPayload, UpdateEmpleadoTransportistaPayload } from "@/lib/type/empleado-transportista"

const crud = createCrudHooks<EmpleadoTransportista, CreateEmpleadoTransportistaPayload, UpdateEmpleadoTransportistaPayload>(
  "/empleado-transportista",
  empleadoTransportistaApi,
)

export function useEmpleadosTransportistas() {
  const { data, isLoading, error, mutate } = crud.useList()
  return { transportistas: data, isLoading, error, mutate }
}

export function useCreateEmpleadoTransportista() {
  const { trigger, isLoading, error } = crud.useCreate()
  return { createTransportista: trigger, isLoading, error }
}

export function useUpdateEmpleadoTransportista() {
  const { trigger, isLoading, error } = crud.useUpdate()
  return { updateTransportista: trigger, isLoading, error }
}

export function useDeleteEmpleadoTransportista() {
  const { trigger, isLoading, error } = crud.useDelete()
  return { deleteTransportista: trigger, isLoading, error }
}
