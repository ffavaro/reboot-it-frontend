import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, estadoTurnoApi } from "@/lib/api"
import type { EstadoTurno, CreateEstadoTurnoPayload, UpdateEstadoTurnoPayload } from "@/lib/type/estado-turno"

export function useEstadosTurno() {
  const { data, isLoading, error, mutate } = useSWR<EstadoTurno[]>("/estado-turno", fetcher)
  return { estadosTurno: data ?? [], isLoading, error, mutate }
}

export function useCreateEstadoTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/estado-turno",
    (_key: string, { arg }: { arg: CreateEstadoTurnoPayload }) => estadoTurnoApi.create(arg),
  )
  return { createEstadoTurno: trigger, isLoading: isMutating, error }
}

export function useUpdateEstadoTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/estado-turno",
    (_key: string, { arg }: { arg: { id: number } & UpdateEstadoTurnoPayload }) => {
      const { id, ...payload } = arg
      return estadoTurnoApi.update(id, payload)
    },
  )
  return { updateEstadoTurno: trigger, isLoading: isMutating, error }
}

export function useDeleteEstadoTurno() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/estado-turno",
    (_key: string, { arg }: { arg: number }) => estadoTurnoApi.remove(arg),
  )
  return { deleteEstadoTurno: trigger, isLoading: isMutating, error }
}