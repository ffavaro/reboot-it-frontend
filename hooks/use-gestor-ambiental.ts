import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { fetcher, gestorAmbientalApi } from "@/lib/api"
import type {
  GestorAmbiental,
  CreateGestorAmbientalPayload,
  UpdateGestorAmbientalPayload,
} from "@/lib/type/gestor-ambiental"

export function useGestoresAmbientales() {
  const { data, isLoading, error, mutate } = useSWR<GestorAmbiental[]>("/gestor-ambiental", fetcher)
  return { gestores: data ?? [], isLoading, error, mutate }
}

export function useCreateGestorAmbiental() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/gestor-ambiental",
    (_key: string, { arg }: { arg: CreateGestorAmbientalPayload }) => gestorAmbientalApi.create(arg),
  )
  return { createGestor: trigger, isLoading: isMutating, error }
}

export function useUpdateGestorAmbiental() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/gestor-ambiental",
    (_key: string, { arg }: { arg: { id: number } & UpdateGestorAmbientalPayload }) => {
      const { id, ...payload } = arg
      return gestorAmbientalApi.update(id, payload)
    },
  )
  return { updateGestor: trigger, isLoading: isMutating, error }
}

export function useDeleteGestorAmbiental() {
  const { trigger, isMutating, error } = useSWRMutation(
    "/gestor-ambiental",
    (_key: string, { arg }: { arg: number }) => gestorAmbientalApi.remove(arg),
  )
  return { deleteGestor: trigger, isLoading: isMutating, error }
}
