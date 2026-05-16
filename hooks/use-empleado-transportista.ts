import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, empleadoTransportistaApi } from "@/lib/api"
import type { EmpleadoTransportista, CreateEmpleadoTransportistaPayload, UpdateEmpleadoTransportistaPayload } from "@/lib/type/empleado-transportista"

export function useEmpleadosTransportistas() {
  const { data, isLoading, error, mutate } = useSWR<EmpleadoTransportista[]>("/empleado-transportista", fetcher)
  return { transportistas: data ?? [], isLoading, error, mutate }
}

export function useCreateEmpleadoTransportista() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/empleado-transportista",
    (_key: string, { arg }: { arg: CreateEmpleadoTransportistaPayload }) =>
      empleadoTransportistaApi.create(arg),
  )
  return { createTransportista: trigger, isLoading: isMutating, error }
}

export function useUpdateEmpleadoTransportista() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/empleado-transportista",
    (_key: string, { arg }: { arg: { id: number } & UpdateEmpleadoTransportistaPayload }) => {
      const { id, ...payload } = arg
      return empleadoTransportistaApi.update(id, payload)
    },
  )
  return { updateTransportista: trigger, isLoading: isMutating, error }
}

export function useDeleteEmpleadoTransportista() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/empleado-transportista",
    (_key: string, { arg }: { arg: number }) => empleadoTransportistaApi.remove(arg),
  )
  return { deleteTransportista: trigger, isLoading: isMutating, error }
}