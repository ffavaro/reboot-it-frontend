import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, procesoDestruccionApi } from "@/lib/api"
import type {
  ProcesoDestruccion,
  CreateProcesoDestruccionPayload,
  UpdateProcesoDestruccionPayload,
} from "@/lib/type/proceso-destruccion"

export function useProcesosDestruccion() {
  const { data, isLoading, error, mutate } = useSWR<ProcesoDestruccion[]>("/proceso-destruccion", fetcher)
  return { procesos: data ?? [], isLoading, error, mutate }
}

export function useCreateProcesoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/proceso-destruccion",
    (_key: string, { arg }: { arg: CreateProcesoDestruccionPayload }) =>
      procesoDestruccionApi.create(arg),
  )
  return { createProceso: trigger, isLoading: isMutating, error }
}

export function useUpdateProcesoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/proceso-destruccion",
    (_key: string, { arg }: { arg: { id: number } & UpdateProcesoDestruccionPayload }) => {
      const { id, ...payload } = arg
      return procesoDestruccionApi.update(id, payload)
    },
  )
  return { updateProceso: trigger, isLoading: isMutating, error }
}

export function useDeleteProcesoDestruccion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/proceso-destruccion",
    (_key: string, { arg }: { arg: number }) => procesoDestruccionApi.remove(arg),
  )
  return { deleteProceso: trigger, isLoading: isMutating, error }
}
