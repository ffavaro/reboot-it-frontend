import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, estadoProcesoDestruccionApi } from "@/lib/api"
import type {
  CreateEstadoProcesoDestruccionPayload,
  UpdateEstadoProcesoDestruccionPayload,
} from "@/lib/api/estado-proceso-destruccion"
import type { EstadoProcesoDestruccion } from "@/lib/type/estado-proceso-destruccion"

export function useEstadosProcesoDestruccion() {
  const { data, isLoading, error, mutate } = useSWR<EstadoProcesoDestruccion[]>("/estado-proceso-destruccion", fetcher)
  return { estados: data ?? [], isLoading, error, mutate }
}

export function useCreateEstadoProcesoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/estado-proceso-destruccion",
    (_key: string, { arg }: { arg: CreateEstadoProcesoDestruccionPayload }) =>
      estadoProcesoDestruccionApi.create(arg),
  )
  return { createEstado: trigger, isLoading: isMutating, error }
}

export function useUpdateEstadoProcesoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/estado-proceso-destruccion",
    (_key: string, { arg }: { arg: { id: number } & UpdateEstadoProcesoDestruccionPayload }) => {
      const { id, ...payload } = arg
      return estadoProcesoDestruccionApi.update(id, payload)
    },
  )
  return { updateEstado: trigger, isLoading: isMutating, error }
}

export function useDeleteEstadoProcesoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/estado-proceso-destruccion",
    (_key: string, { arg }: { arg: number }) => estadoProcesoDestruccionApi.remove(arg),
  )
  return { deleteEstado: trigger, isLoading: isMutating, error }
}
