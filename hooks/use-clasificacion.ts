import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, clasificacionApi } from "@/lib/api"
import type { Clasificacion, CreateClasificacionPayload, UpdateClasificacionPayload } from "@/lib/type/clasificacion"

export function useClasificaciones() {
  const { data, isLoading, error, mutate } = useSWR<Clasificacion[]>("/clasificacion", fetcher)
  return { clasificaciones: data ?? [], isLoading, error, mutate }
}

export function useCreateClasificacion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/clasificacion",
    (_key: string, { arg }: { arg: CreateClasificacionPayload }) => clasificacionApi.create(arg),
  )
  return { createClasificacion: trigger, isLoading: isMutating, error }
}

export function useUpdateClasificacion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/clasificacion",
    (_key: string, { arg }: { arg: { id: number } & UpdateClasificacionPayload }) => {
      const { id, ...payload } = arg
      return clasificacionApi.update(id, payload)
    },
  )
  return { updateClasificacion: trigger, isLoading: isMutating, error }
}

export function useDeleteClasificacion() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/clasificacion",
    (_key: string, { arg }: { arg: number }) => clasificacionApi.remove(arg),
  )
  return { deleteClasificacion: trigger, isLoading: isMutating, error }
}
